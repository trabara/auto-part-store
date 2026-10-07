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
/**
 * The agent states every field the import would otherwise default (doors,
 * drive, transmission, nulls): defaulted fields become required. Year maxima
 * (this year + 2 when built) are left to the server, so the schema doesn't age.
 */
const explicit = (node, key) => {
  if (!node || typeof node !== "object") return node;
  if (node.properties) {
    const defaulted = Object.entries(node.properties).filter(([, v]) => v && "default" in v).map(([k]) => k);
    node.required = [...new Set([...(node.required ?? []), ...defaulted])];
    for (const [k, v] of Object.entries(node.properties)) explicit(v, k);
  }
  if (node.items) explicit(node.items, key);
  for (const option of node.anyOf ?? []) explicit(option, key);
  delete node.default;
  if (key === "year_start" || key === "year_end") delete node.maximum;
  return node;
};
const { $schema, ...outputSchema } = explicit(z.toJSONSchema(AgentOutputSchema, { io: "input" }));
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
const TASK = "$('Task prompt').first().json";
const MEDUSA_AUTH = { authentication: "genericCredentialType", genericAuthType: "httpBasicAuth" };
const medusaCredentials = { httpBasicAuth: { id: "", name: "Medusa secret API key" } };
const tavilyCredentials = { httpHeaderAuth: { id: "", name: "Tavily API key" } };
/** Medusa calls are idempotent (natural keys): retry transient failures. */
const RETRY = { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 };
const assignments = (values) => ({
  assignments: {
    assignments: Object.entries(values).map(([name, [type, value]]) => ({ id: id(`config/${name}`), name, value, type })),
  },
  options: {},
});
const condition = (name, leftValue, operator, rightValue = "") => ({
  conditions: {
    options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
    conditions: [{ id: id(`if/${name}`), leftValue, rightValue, operator }],
    combinator: "and",
  },
  options: {},
});
const IS_TRUE = { type: "boolean", operation: "true", singleValue: true };
const code = (jsCode) => ({ mode: "runOnceForEachItem", jsCode: jsCode.trim() });
const medusa = (path, query = [], extra = {}) => ({
  url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/${path}`,
  ...MEDUSA_AUTH,
  sendQuery: true,
  queryParameters: { parameters: query.map(([name, value]) => ({ name, value })) },
  ...extra,
});

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
    // Medusa as seen from n8n (compose: the host's port 9000).
    medusa_url: ["string", "http://host.docker.internal:9000"],
    // Only this make (empty: every make).
    make: ["string", ""],
    // Tasks per run: a model's generations, or one generation's configurations.
    tasks_per_run: ["number", 10],
    // Generations with at most this many configurations (0: empty ones only).
    max_configurations: ["number", 0],
    // Apply clean results (creates, and fills values the catalog lacks);
    // false: validate only, everything goes to review.
    auto_apply: ["boolean", true],
    // Slack-compatible incoming webhook for the run summary (empty: none).
    review_webhook_url: ["string", ""],
  }),
  { notes: "Edit these values. Credentials: Medusa secret API key (Basic Auth: key as user, empty password), Tavily API key (Header Auth: Authorization = Bearer tvly-…), OpenRouter." },
);

// ── Research queue ───────────────────────────────────────────────────────────
node(
  "Research tasks",
  "n8n-nodes-base.httpRequest",
  4.2,
  [480, 100],
  {
    ...medusa("tasks", [
      ["limit", `={{ ${CONFIG}.tasks_per_run }}`],
      ["make", `={{ ${CONFIG}.make || undefined }}`],
      ["max_configurations", `={{ ${CONFIG}.max_configurations }}`],
    ]),
    options: {},
  },
  { credentials: medusaCredentials, ...RETRY },
);
node("One item per task", "n8n-nodes-base.splitOut", 1, [720, 100], { fieldToSplitOut: "tasks", options: {} });
node("Loop over tasks", "n8n-nodes-base.splitInBatches", 3, [960, 100], { batchSize: 1, options: {} });

// ── One task: prompt, research, scope, validate, decide, apply ───────────────
node(
  "Task prompt",
  "n8n-nodes-base.code",
  2,
  [1200, 200],
  code(`
const t = $json;
const span = (g) => g.year_start + "–" + (g.year_end ?? "present");
const head = ["Task: " + t.kind, "Make: " + t.make, "Model: " + t.model, "Category: " + t.category, ""];
let body;
if (t.kind === "generations") {
  body = [
    "The catalog has no generations for this model yet. List its generations, each with vehicles: [].",
  ];
} else {
  const g = t.generation;
  const engine = (e) => [e.fuel, e.layout, e.cylinders && e.cylinders + " cyl", e.displacement_cc && e.displacement_cc + " cm³", e.power_kw + " kW", e.code && "code " + e.code]
    .filter(Boolean).join(" ");
  const lines = (t.existing ?? []).map((v, i) =>
    "#" + (i + 1) + " " + engine(v.engine) + " · " + v.body_style + " " + v.doors + " doors · " + v.drive + " · " + v.transmission +
    " · trim " + (v.trim ?? "—") + " · " + span(v));
  const shown = lines.slice(0, 120);
  body = [
    'Generation to research: "' + g.name + '"' + (g.code ? " (" + g.code + ")" : "") + ", " + span(g) + " in the catalog.",
    "",
    "The model's generations in the catalog:",
    ...t.generations.map((s) => '- "' + s.name + '"' + (s.code ? " (" + s.code + ")" : "") + ": " + span(s) + ", " + s.configurations + " configuration(s)"),
    "",
    'Configurations of "' + g.name + '" already in the catalog:',
    ...(shown.length ? shown : ["(none yet)"]),
    ...(lines.length > shown.length ? ["(and " + (lines.length - shown.length) + " more)"] : []),
    "",
    'Return exactly one generation, named "' + g.name + '", with its configurations.',
  ];
}
return {
  kind: t.kind,
  make: t.make,
  model: t.model,
  category: t.category,
  generation: t.generation?.name ?? null,
  label: t.make + " " + t.model + (t.generation ? " " + t.generation.name : " (generations)"),
  prompt: [...head, ...body, "", "Research, validate your generations with validate_catalog, then return them."].join("\\n"),
};
`),
);
node(
  "Research agent",
  "@n8n/n8n-nodes-langchain.agent",
  2,
  [1440, 200],
  { promptType: "define", text: "={{ $json.prompt }}", hasOutputParser: true, options: { systemMessage, maxIterations: 20 } },
  { onError: "continueErrorOutput" },
);
// Any OpenRouter model with tool calling; the id is OpenRouter's (provider/model).
node("Chat model (OpenRouter)", "@n8n/n8n-nodes-langchain.lmChatOpenRouter", 1, [1200, 460], {
  model: "anthropic/claude-sonnet-5.5",
  // One task's answer fits well within 16k tokens; research calls can be slow.
  options: { maxTokens: 16000, timeout: 600000, temperature: 0.1 },
}, { credentials: { openRouterApi: { id: "", name: "OpenRouter account" } } });
node("Catalog generations", "@n8n/n8n-nodes-langchain.outputParserStructured", 1.2, [1920, 460], {
  schemaType: "manual",
  inputSchema: JSON.stringify(outputSchema, null, 2),
});

// Agent tools: lean responses keep the agent's context (re-sent on every step) small.
const tool = (name, position, description, parameters, credentials) =>
  node(name, "n8n-nodes-base.httpRequestTool", 4.2, position, { toolDescription: description, ...parameters, options: {} }, { credentials });
const TAVILY = { method: "POST", authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", sendBody: true, specifyBody: "json" };
tool(
  "web_search",
  [1360, 460],
  "Search the web. Returns up to 5 results, each with title, URL and the most relevant passages.",
  {
    ...TAVILY,
    url: "https://api.tavily.com/search",
    jsonBody: `={{ JSON.stringify({ query: $fromAI('query', 'What to search for, e.g. "Renault Clio V fiche technique motorisations ch" or "Golf VII engines kW"', 'string'), max_results: 5, search_depth: 'advanced', chunks_per_source: 3, exclude_domains: ['autoevolution.com'] }) }}`,
    optimizeResponse: true,
    responseType: "json",
    dataField: "results",
    fieldsToInclude: "selected",
    fields: "title,url,content",
  },
  tavilyCredentials,
);
tool(
  "read_page",
  [1520, 460],
  "Read a web page as markdown. With focus (what you look for, e.g. 'engines power kW displacement'), returns only the most relevant passages; without, the page (long pages are cut).",
  {
    ...TAVILY,
    url: "https://api.tavily.com/extract",
    jsonBody: `={{ [$fromAI('focus', 'What you look for on the page; empty to read the whole page', 'string', '')].map((focus) => JSON.stringify({ urls: [$fromAI('url', 'The page URL', 'string')], extract_depth: 'advanced', format: 'markdown', query: focus || undefined, chunks_per_source: focus ? 5 : undefined }))[0] }}`,
    optimizeResponse: true,
    responseType: "text",
    truncateResponse: true,
    maxLength: 30000,
  },
  tavilyCredentials,
);
tool(
  "validate_catalog",
  [1680, 460],
  "Check your generations against the catalog without writing anything: problems to fix, warnings (likely duplicates of existing records), what would be created and updated, and existing values that contradict yours.",
  {
    method: "POST",
    ...medusa("import", [["dry_run", "true"], ["mode", "fill"]]),
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify({ format: 'vehicle-catalog@1', market: 'TN', source: { name: 'research draft' }, makes: [{ name: ${TASK}.make, models: [{ name: ${TASK}.model, category: ${TASK}.category, generations: $fromAI('generations', 'Your generations, exactly as you will return them', 'json') }] }] }) }}`,
  },
  medusaCredentials,
);

node(
  "Build catalog file",
  "n8n-nodes-base.code",
  2,
  [1680, 100],
  code(`
const task = $('Task prompt').item.json;
const { generations = [], sources = [], notes = "" } = $json.output ?? {};
// Keep the result within the task: the given generation only (configurations),
// or generations without configurations (generations: those come in their own tasks).
const scoped = [];
const dropped = [];
for (const g of generations) {
  if (task.kind === "configurations") {
    if (g.name.trim().toLowerCase() === task.generation.toLowerCase()) scoped.push({ ...g, name: task.generation });
    else dropped.push(g.name);
  } else scoped.push({ ...g, vehicles: [] });
}
return {
  task,
  sources,
  notes: [notes, dropped.length ? "Left out (outside this task): " + dropped.join(", ") + "." : ""].filter(Boolean).join(" "),
  file: {
    format: "vehicle-catalog@1",
    market: "TN",
    source: { name: "AI research agent (n8n), " + sources.length + " source(s)", url: sources.join(" "), retrieved_at: new Date().toISOString() },
    makes: [{ name: task.make, models: [{ name: task.model, category: task.category, generations: scoped }] }],
  },
};
`),
);
node(
  "Validate (dry run)",
  "n8n-nodes-base.httpRequest",
  4.2,
  [1920, 100],
  {
    method: "POST",
    ...medusa("import", [["dry_run", "true"], ["mode", "fill"]]),
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify($json.file) }}",
    options: {},
  },
  { credentials: medusaCredentials, onError: "continueErrorOutput", ...RETRY },
);
node(
  "Decide",
  "n8n-nodes-base.code",
  2,
  [2160, 100],
  code(`
const report = $json.report;
const adds = report.created.generations + report.created.vehicles + report.updated.length;
const autoApply = $('Config').first().json.auto_apply;
const status = report.problems.length
  ? "problems"
  : report.warnings.length
    ? "possible duplicates"
    : !adds
      ? "nothing new"
      : !autoApply
        ? "validated (auto_apply off)"
        : null;
return { apply: status === null, status, report };
`),
);
node("Apply?", "n8n-nodes-base.if", 2.2, [2400, 100], condition("apply", "={{ $json.apply }}", IS_TRUE));
node(
  "Apply (fill)",
  "n8n-nodes-base.httpRequest",
  4.2,
  [2640, 0],
  {
    method: "POST",
    ...medusa("import", [["mode", "fill"]]),
    sendBody: true,
    specifyBody: "json",
    jsonBody: "={{ JSON.stringify($('Build catalog file').item.json.file) }}",
    options: {},
  },
  { credentials: medusaCredentials, onError: "continueErrorOutput", ...RETRY },
);

// One outcome per task (applied, not applied with the reason, or failed),
// fed back to the loop and summarized at the end.
node(
  "Outcome",
  "n8n-nodes-base.code",
  2,
  [2880, 200],
  code(`
let built = {};
try { built = $('Build catalog file').item.json; } catch {} // the agent failed: nothing built
const task = $('Task prompt').item.json;
const report = $json.report ?? {};
const applied = report.dryRun === false;
const status = $json.error ? "failed" : applied ? ((report.differences ?? []).length ? "applied, review contradictions" : "applied") : $json.status;
return {
  label: task.label,
  status,
  created: report.created ?? null,
  updated: report.updated ?? [],
  differences: report.differences ?? [],
  warnings: report.warnings ?? [],
  problems: report.problems ?? [],
  error: $json.error ? String($json.error.message ?? $json.error) : null,
  notes: built.notes ?? "",
  sources: built.sources ?? [],
  // The proposal, to review or apply by hand (not kept once applied).
  file: applied ? undefined : built.file,
};
`),
);

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
const lines = rows.map((r) => {
  const parts = ["• " + r.label + ": " + r.status];
  if (r.created && r.created.generations + r.created.vehicles) parts.push(r.created.generations + " generation(s), " + r.created.vehicles + " configuration(s)");
  if (r.updated.length) parts.push(r.updated.length + " value(s) filled");
  if (r.differences.length) parts.push(r.differences.length + " contradiction(s)");
  if (r.warnings.length) parts.push(r.warnings.length + " possible duplicate(s)");
  if (r.problems.length) parts.push(r.problems.length + " problem(s)");
  if (r.error) parts.push(r.error);
  return parts.join(" · ");
});
const text = "Vehicle catalog research (" + rows.length + " task(s))\\n" + lines.join("\\n") +
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
  condition("notify", `={{ ${CONFIG}.review_webhook_url }}`, { type: "string", operation: "notEmpty", singleValue: true }),
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
link("Config", "Research tasks");
link("Research tasks", "One item per task");
link("One item per task", "Loop over tasks");
link("Loop over tasks", "Run summary", { output: 0 });
link("Loop over tasks", "Task prompt", { output: 1 });
link("Task prompt", "Research agent");
link("Research agent", "Build catalog file", { output: 0 });
link("Research agent", "Outcome", { output: 1 });
link("Build catalog file", "Validate (dry run)");
link("Validate (dry run)", "Decide", { output: 0 });
link("Validate (dry run)", "Outcome", { output: 1 });
link("Decide", "Apply?");
link("Apply?", "Apply (fill)", { output: 0 });
link("Apply?", "Outcome", { output: 1 });
link("Apply (fill)", "Outcome", { output: 0 });
link("Apply (fill)", "Outcome", { output: 1 });
link("Outcome", "Loop over tasks");
link("Run summary", "Notify?");
link("Notify?", "Send summary", { output: 0 });
link("Chat model (OpenRouter)", "Research agent", { type: "ai_languageModel" });
link("Catalog generations", "Research agent", { type: "ai_outputParser" });
for (const t of ["web_search", "read_page", "validate_catalog"]) link(t, "Research agent", { type: "ai_tool" });

const workflow = {
  // Stable: re-importing (CLI) updates this workflow instead of adding a copy.
  id: "vehCatResearch01",
  name: "Vehicle catalog research",
  active: false,
  nodes,
  connections,
  // Executions keep each task's proposal, sources and notes for review.
  settings: {
    executionOrder: "v1",
    timezone: "Africa/Tunis",
    saveManualExecutions: true,
    saveDataSuccessExecution: "all",
    saveDataErrorExecution: "all",
    saveExecutionProgress: true,
  },
  pinData: {},
  meta: { templateCredsSetupCompleted: false },
};
const out = path.join(here, "vehicle-catalog-research.json");
fs.writeFileSync(out, JSON.stringify(workflow, null, 2) + "\n");
console.log(`Wrote ${path.relative(process.cwd(), out)} (${nodes.length} nodes).`);
