// Builds the n8n workflow that researches the vehicle catalog with an AI agent
// (vehicle-catalog-research.json). The agent's output schema is derived from
// the catalog contract, so rebuild after changing CatalogGenerationSchema:
//
//   yarn workspace @repo/module-vehicle build && node infra/n8n/build-workflow.mjs
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../../packages/modules/vehicle/package.json"));
const { z } = require("@medusajs/framework/zod");
const { CatalogGenerationSchema } = require("./dist/contract/catalog.js");

// ── Agent output: generations as the import reads them, plus provenance ──────
const AgentOutputSchema = z.object({
  generations: z.array(CatalogGenerationSchema),
  sources: z.array(z.string()).describe("Every URL used"),
  notes: z.string().describe("What a reviewer should know: conflicts, versions left out and why"),
});
const { $schema, ...outputSchema } = z.toJSONSchema(AgentOutputSchema, { io: "input" });
const systemMessage = fs.readFileSync(path.join(here, "prompts/researcher.md"), "utf8").trim();

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Stable ids, so rebuilding only changes what changed. */
const id = (name) => {
  const h = createHash("sha1").update(`vehicle-catalog-research/${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const nodes = [];
const node = (name, type, typeVersion, position, parameters, extra = {}) => {
  nodes.push({ id: id(name), name, type, typeVersion, position, parameters, ...extra });
  return name;
};
const CONFIG = "$('Config').first().json";
const MEDUSA_AUTH = {
  authentication: "genericCredentialType",
  genericAuthType: "httpBasicAuth",
};
const medusaCredentials = { httpBasicAuth: { id: "", name: "Medusa secret API key" } };
const tavilyCredentials = { httpHeaderAuth: { id: "", name: "Tavily API key" } };
const assignments = (values) => ({
  assignments: {
    assignments: Object.entries(values).map(([name, [type, value]]) => ({ id: id(`config/${name}`), name, value, type })),
  },
  options: {},
});
const condition = (name, leftValue, operator, rightValue) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
    conditions: [{ id: id(`if/${name}`), leftValue, rightValue, operator }],
    combinator: "and",
  },
  options: {},
});
const code = (jsCode) => ({ mode: "runOnceForEachItem", jsCode: jsCode.trim() });

// ── Triggers and configuration ───────────────────────────────────────────────
node("Weekly", "n8n-nodes-base.scheduleTrigger", 1.2, [0, 0], {
  rule: { interval: [{ field: "weeks", triggerAtDay: [1], triggerAtHour: 3 }] },
});
node("Run now", "n8n-nodes-base.manualTrigger", 1, [0, 200], {});
node(
  "Config",
  "n8n-nodes-base.set",
  3.4,
  [240, 100],
  assignments({
    // Medusa as seen from n8n (Docker: the host's port 9000).
    medusa_url: ["string", "http://host.docker.internal:9000"],
    // Only this make (empty: every make), least complete models first.
    make: ["string", ""],
    models_per_run: ["number", 5],
    // Only models with at most this many configurations (-1: any).
    max_configurations: ["number", -1],
    // Apply clean results (creates, and fills values the catalog lacks);
    // false: validate only, everything goes to review.
    auto_apply: ["boolean", true],
    // Slack-compatible incoming webhook for the run summary (empty: none).
    review_webhook_url: ["string", ""],
  }),
  { notes: "Edit these values. Credentials: Medusa secret API key (HTTP Basic: key as user, empty password), Tavily API key (header Authorization: Bearer tvly-…), OpenRouter." },
);

// ── Research queue ───────────────────────────────────────────────────────────
node(
  "Least complete models",
  "n8n-nodes-base.httpRequest",
  4.2,
  [480, 100],
  {
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/coverage`,
    ...MEDUSA_AUTH,
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: "limit", value: `={{ ${CONFIG}.models_per_run }}` },
        { name: "make", value: `={{ ${CONFIG}.make || undefined }}` },
        { name: "max_configurations", value: `={{ ${CONFIG}.max_configurations >= 0 ? ${CONFIG}.max_configurations : undefined }}` },
      ],
    },
    options: {},
  },
  { credentials: medusaCredentials },
);
node("One item per model", "n8n-nodes-base.splitOut", 1, [720, 100], { fieldToSplitOut: "models", options: {} });
node("Loop over models", "n8n-nodes-base.splitInBatches", 3, [960, 100], { batchSize: 1, options: {} });

// ── One model: what exists, research, validate, apply ────────────────────────
node(
  "Existing catalog",
  "n8n-nodes-base.httpRequest",
  4.2,
  [1200, 200],
  {
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/export`,
    ...MEDUSA_AUTH,
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: "make", value: "={{ $json.make }}" },
        { name: "model", value: "={{ $json.model }}" },
      ],
    },
    options: {},
  },
  { credentials: medusaCredentials },
);
node(
  "Summarize existing",
  "n8n-nodes-base.code",
  2,
  [1440, 200],
  code(`
const target = $('Loop over models').item.json;
const model = $json.makes?.[0]?.models?.[0];
const lines = (model?.generations ?? []).map((g) =>
  \`- "\${g.name}"\${g.code ? \` (\${g.code})\` : ""}: \${g.year_start}–\${g.year_end ?? "present"}, \${g.vehicles.length} configuration(s)\`,
);
return {
  make: target.make,
  model: target.model,
  category: target.category,
  existing: lines.length ? lines.join("\\n") : "(no generations yet)",
};
`),
);
node(
  "Research agent",
  "@n8n/n8n-nodes-langchain.agent",
  2,
  [1680, 200],
  {
    promptType: "define",
    text: `=Make: {{ $json.make }}
Model: {{ $json.model }}
Category: {{ $json.category }}

Generations already in the catalog (reuse these names exactly):
{{ $json.existing }}

Research this model's generations and configurations, validate your answer with validate_catalog, then return it.`,
    hasOutputParser: true,
    options: { systemMessage, maxIterations: 40 },
  },
  { onError: "continueErrorOutput" },
);
// Any OpenRouter model with tool calling; the id is OpenRouter's (provider/model).
node("Chat model (OpenRouter)", "@n8n/n8n-nodes-langchain.lmChatOpenRouter", 1, [1440, 460], {
  model: "anthropic/claude-sonnet-5.5",
  // A large model's answer needs room; research calls can be slow (10 min).
  options: { maxTokens: 32000, timeout: 600000, temperature: 0.1 },
}, { credentials: { openRouterApi: { id: "", name: "OpenRouter account" } } });
node("Catalog generations", "@n8n/n8n-nodes-langchain.outputParserStructured", 1.2, [2160, 460], {
  schemaType: "manual",
  inputSchema: JSON.stringify(outputSchema, null, 2),
});

// Agent tools.
const tool = (name, position, description, parameters, credentials) =>
  node(name, "n8n-nodes-base.httpRequestTool", 4.2, position, { toolDescription: description, ...parameters, options: {} }, { credentials });
tool(
  "web_search",
  [1600, 460],
  "Search the web. Returns results with title, URL and a content snippet.",
  {
    method: "POST",
    url: "https://api.tavily.com/search",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify({ query: $fromAI('query', 'What to search for, e.g. "Renault Clio V engines power kW 2019"', 'string'), max_results: 8, search_depth: 'advanced', exclude_domains: ['autoevolution.com'] }) }}`,
  },
  tavilyCredentials,
);
tool(
  "read_page",
  [1760, 460],
  "Read the full text of a web page (from a search result).",
  {
    method: "POST",
    url: "https://api.tavily.com/extract",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify({ urls: [$fromAI('url', 'The page URL', 'string')], extract_depth: 'advanced', format: 'text' }) }}`,
  },
  tavilyCredentials,
);
tool(
  "get_existing_catalog",
  [1920, 460],
  "The model as it is in the catalog: every generation and configuration (may be long).",
  {
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/export`,
    ...MEDUSA_AUTH,
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: "make", value: "={{ $fromAI('make', 'The make, as given', 'string') }}" },
        { name: "model", value: "={{ $fromAI('model', 'The model, as given', 'string') }}" },
      ],
    },
  },
  medusaCredentials,
);
tool(
  "validate_catalog",
  [2040, 460],
  "Check a vehicle-catalog@1 file without writing anything: returns problems to fix, what would be created and updated, and existing values that contradict the file.",
  {
    method: "POST",
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/import`,
    ...MEDUSA_AUTH,
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: "dry_run", value: "true" },
        { name: "mode", value: "fill" },
      ],
    },
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify($fromAI('catalog', 'The complete vehicle-catalog@1 file: { format, market, source, makes: [{ name, models: [{ name, category, generations }] }] }', 'json')) }}`,
  },
  medusaCredentials,
);

node(
  "Build catalog file",
  "n8n-nodes-base.code",
  2,
  [2000, 100],
  code(`
const target = $('Summarize existing').item.json;
const { generations = [], sources = [], notes = "" } = $json.output ?? {};
return {
  make: target.make,
  model: target.model,
  sources,
  notes,
  file: {
    format: "vehicle-catalog@1",
    market: "TN",
    source: {
      name: "AI research agent (n8n), " + sources.length + " source(s)",
      url: sources.join(" "),
      retrieved_at: new Date().toISOString(),
    },
    makes: [{ name: target.make, models: [{ name: target.model, category: target.category, generations }] }],
  },
};
`),
);
node(
  "Validate (dry run)",
  "n8n-nodes-base.httpRequest",
  4.2,
  [2240, 100],
  {
    method: "POST",
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/import`,
    ...MEDUSA_AUTH,
    sendQuery: true,
    queryParameters: { parameters: [{ name: "dry_run", value: "true" }, { name: "mode", value: "fill" }] },
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify($json.file) }}",
    options: {},
  },
  { credentials: medusaCredentials, onError: "continueErrorOutput" },
);
node(
  "Clean?",
  "n8n-nodes-base.if",
  2.2,
  [2480, 100],
  condition(
    "clean",
    `={{ $json.report.problems.length === 0 && $json.report.created.generations + $json.report.created.vehicles + $json.report.updated.length > 0 && ${CONFIG}.auto_apply }}`,
    { type: "boolean", operation: "true", singleValue: true },
    "",
  ),
);
node(
  "Apply (fill)",
  "n8n-nodes-base.httpRequest",
  4.2,
  [2720, 0],
  {
    method: "POST",
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/import`,
    ...MEDUSA_AUTH,
    sendQuery: true,
    queryParameters: { parameters: [{ name: "mode", value: "fill" }] },
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify($('Build catalog file').item.json.file) }}",
    options: {},
  },
  { credentials: medusaCredentials, onError: "continueErrorOutput" },
);

// Outcomes (fed back to the loop, summarized at the end).
const outcome = (name, position, status) =>
  node(
    name,
    "n8n-nodes-base.code",
    2,
    position,
    code(`
let built = {};
try { built = $('Build catalog file').item.json; } catch {} // not run for this model (agent failed)
const target = $('Summarize existing').item.json;
const report = $json.report ?? {};
return {
  make: target.make,
  model: target.model,
  status: ${status},
  created: report.created ?? null,
  updated: report.updated ?? [],
  differences: report.differences ?? [],
  problems: report.problems ?? [],
  error: $json.error ? String($json.error.message ?? $json.error) : null,
  notes: built.notes ?? "",
  sources: built.sources ?? [],
  file: report.dryRun === false ? undefined : built.file,
};
`),
  );
outcome("Applied", [2960, 0], `(report.differences ?? []).length ? "applied, review contradictions" : "applied"`);
outcome("Needs review", [2720, 200], `(report.problems ?? []).length ? "problems" : $('Config').first().json.auto_apply ? "nothing new" : "validated (auto_apply off)"`);
outcome("Failed", [2720, 380], `"failed"`);

// ── Run summary ──────────────────────────────────────────────────────────────
node(
  "Run summary",
  "n8n-nodes-base.code",
  2,
  [1200, -160],
  {
    mode: "runOnceForAllItems",
    jsCode: `
const rows = $input.all().map((i) => i.json).filter((r) => r.status);
const count = (c) => c ? c.generations + " generation(s), " + c.vehicles + " configuration(s)" : "";
const lines = rows.map((r) => {
  const parts = ["• " + r.make + " " + r.model + ": " + r.status];
  if (r.created) parts.push(count(r.created));
  if (r.updated.length) parts.push(r.updated.length + " value(s) filled");
  if (r.differences.length) parts.push(r.differences.length + " contradiction(s) to review");
  if (r.problems.length) parts.push(r.problems.length + " problem(s)");
  if (r.error) parts.push(r.error);
  return parts.join(" · ");
});
const text = "Vehicle catalog research (" + rows.length + " model(s))\\n" + lines.join("\\n") +
  "\\nDetails (sources, notes, proposals to review): this execution in n8n.";
return [{ json: { text, results: rows } }];
`.trim(),
  },
);
node(
  "Notify?",
  "n8n-nodes-base.if",
  2.2,
  [1440, -160],
  condition("notify", `={{ ${CONFIG}.review_webhook_url }}`, { type: "string", operation: "notEmpty", singleValue: true }, ""),
);
node(
  "Send summary",
  "n8n-nodes-base.httpRequest",
  4.2,
  [1680, -240],
  {
    method: "POST",
    url: `={{ ${CONFIG}.review_webhook_url }}`,
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify({ text: $json.text }) }}",
    options: {},
  },
);

// ── Connections ──────────────────────────────────────────────────────────────
const connections = {};
const link = (from, to, { output = 0, type = "main" } = {}) => {
  const outputs = (connections[from] ??= {})[type] ??= [];
  while (outputs.length <= output) outputs.push([]);
  outputs[output].push({ node: to, type, index: 0 });
};
link("Weekly", "Config");
link("Run now", "Config");
link("Config", "Least complete models");
link("Least complete models", "One item per model");
link("One item per model", "Loop over models");
link("Loop over models", "Run summary", { output: 0 });
link("Loop over models", "Existing catalog", { output: 1 });
link("Existing catalog", "Summarize existing");
link("Summarize existing", "Research agent");
link("Research agent", "Build catalog file", { output: 0 });
link("Research agent", "Failed", { output: 1 });
link("Build catalog file", "Validate (dry run)");
link("Validate (dry run)", "Clean?", { output: 0 });
link("Validate (dry run)", "Failed", { output: 1 });
link("Clean?", "Apply (fill)", { output: 0 });
link("Clean?", "Needs review", { output: 1 });
link("Apply (fill)", "Applied", { output: 0 });
link("Apply (fill)", "Failed", { output: 1 });
for (const end of ["Applied", "Needs review", "Failed"]) link(end, "Loop over models");
link("Run summary", "Notify?");
link("Notify?", "Send summary", { output: 0 });
link("Chat model (OpenRouter)", "Research agent", { type: "ai_languageModel" });
link("Catalog generations", "Research agent", { type: "ai_outputParser" });
for (const t of ["web_search", "read_page", "get_existing_catalog", "validate_catalog"]) link(t, "Research agent", { type: "ai_tool" });

const workflow = {
  // Stable: re-importing (CLI) updates this workflow instead of adding a copy.
  id: "vehCatResearch01",
  name: "Vehicle catalog research",
  active: false,
  nodes,
  connections,
  settings: { executionOrder: "v1", timezone: "Africa/Tunis", saveManualExecutions: true },
  pinData: {},
  meta: { templateCredsSetupCompleted: false },
};
const out = path.join(here, "vehicle-catalog-research.json");
fs.writeFileSync(out, JSON.stringify(workflow, null, 2) + "\n");
console.log(`Wrote ${path.relative(process.cwd(), out)} (${nodes.length} nodes).`);
