// Builds the n8n workflow of the catalog steward (vehicle-catalog-research.json):
// a nightly loop over the backend's task ledger. The backend decides what to do
// (rules, ledger, prompts, checks, apply policy); this workflow runs the
// models, NVIDIA Nemotron through NVIDIA's API: a first pass on the backend's
// prompt, then the research agent as a fallback for research the first pass
// couldn't settle. The agent's output
// schema derives from the catalog contract, so rebuild after changing it:
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

// ── The cloud agent's output: generations as the import reads them, plus provenance ──
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
const TASK = "$('Task').first().json";
const medusaCredentials = { httpBasicAuth: { id: "", name: "Medusa secret API key" } };
/** Every chat model is the NVIDIA Nemotron chat model node (NVIDIA's API): one credential. */
const nvidiaCredentials = { nvidiaApi: { id: "", name: "NVIDIA API" } };
/** A Nemotron chat model node, its model from Config. */
const nemotron = (model, options) => ({ model: `={{ ${CONFIG}.${model} }}`, options });
/** Medusa calls are idempotent or leased: retry transient failures. */
const RETRY = { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 };
const assignments = (values) => ({
  assignments: {
    assignments: Object.entries(values).map(([name, [type, value]]) => ({ id: id(`config/${name}`), name, value, type })),
  },
  options: {},
});
const isTrue = (name, expression) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
    conditions: [{ id: id(`if/${name}`), leftValue: `={{ ${expression} }}`, rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }],
    combinator: "and",
  },
  options: {},
});
const code = (jsCode, mode = "runOnceForEachItem") => ({ mode, jsCode: jsCode.trim() });
/** A Medusa admin call (Basic auth with the secret API key). */
const medusa = (method, route, body, extra = {}) => ({
  method,
  url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/${route}`,
  authentication: "genericCredentialType",
  genericAuthType: "httpBasicAuth",
  ...(body ? { sendBody: true, specifyBody: "json", jsonBody: `={{ JSON.stringify(${body}) }}` } : {}),
  options: {},
  ...extra,
});
const RESEARCH = `['RESEARCH_GENERATIONS', 'RESEARCH_CONFIGURATIONS'].includes(${TASK}.kind)`;

// ── Start: configuration, rules, ledger, model warm-up ───────────────────────
node("Nightly", "n8n-nodes-base.scheduleTrigger", 1.2, [0, 0], { rule: { interval: [{ field: "days", triggerAtHour: 1 }] } });
node("Run now", "n8n-nodes-base.manualTrigger", 1, [0, 200], {});
node(
  "Config",
  "n8n-nodes-base.set",
  3.4,
  [220, 100],
  assignments({
    // Medusa as seen from n8n (compose: Medusa on the host).
    medusa_url: ["string", "http://host.docker.internal:9000"],
    // NVIDIA API models (build.nvidia.com): Nemotron 3 Super for both steps.
    first_pass_model: ["string", "nvidia/nemotron-3-super-120b-a12b"],
    agent_model: ["string", "nvidia/nemotron-3-super-120b-a12b"],
    // The research agent takes over research the first pass couldn't settle.
    agent_fallback: ["boolean", true],
    // The run stops claiming at this time (workflow timezone) or after this many tasks.
    window_end: ["string", "06:00"],
    max_tasks: ["number", 150],
    // Slack-compatible incoming webhook for the run summary (empty: none).
    review_webhook_url: ["string", ""],
  }),
  { notes: "Credentials: Medusa secret API key (Basic Auth: the key as user, empty password) and NVIDIA API (an API key from build.nvidia.com). Web search runs in the backend (TAVILY_API_KEY in its env)." },
);
node(
  "Start",
  "n8n-nodes-base.code",
  2,
  [440, 100],
  code(
    `
const cfg = $('Config').first().json;
const [h, m] = String(cfg.window_end || "06:00").split(":").map(Number);
let deadline = $now.set({ hour: h, minute: m || 0, second: 0, millisecond: 0 });
if (deadline <= $now) deadline = deadline.plus({ days: 1 });
return [{ json: { started: $now.toISO(), deadline: deadline.toISO() } }];
`,
    "runOnceForAllItems",
  ),
);
node("Lint", "n8n-nodes-base.httpRequest", 4.2, [660, 100], medusa("POST", "lint", "{}"), { credentials: medusaCredentials, ...RETRY });
node("Refresh ledger", "n8n-nodes-base.httpRequest", 4.2, [880, 100], medusa("POST", "tasks/refresh", "{}"), { credentials: medusaCredentials, ...RETRY });
// ── The loop: one leased task at a time until the window ends ────────────────
node("Claim task", "n8n-nodes-base.httpRequest", 4.2, [1320, 100], medusa("POST", "tasks/claim", "{ limit: 1, lease_minutes: 60 }"), {
  credentials: medusaCredentials,
  ...RETRY,
});
// Limits are checked before claiming: a claimed task is always worked.
node("Continue?", "n8n-nodes-base.if", 2.2, [1210, 100], isTrue("continue", `$now.toISO() < $('Start').first().json.deadline && $runIndex < ${CONFIG}.max_tasks`));
node("Next task?", "n8n-nodes-base.if", 2.2, [1540, 100], isTrue("next", "$json.tasks.length > 0"));
node("Task", "n8n-nodes-base.code", 2, [1760, 200], code("return { ...$json.tasks[0] };"));
node(
  "Prompt",
  "n8n-nodes-base.httpRequest",
  4.2,
  [1980, 200],
  medusa("POST", `tasks/{{ ${TASK}.id }}/prompt`, `{ lease_token: ${TASK}.lease_token }`),
  { credentials: medusaCredentials, ...RETRY, onError: "continueErrorOutput" },
);
node("Evidence found?", "n8n-nodes-base.if", 2.2, [2200, 200], isTrue("evidence", "!$json.fallback"));
// First pass: the backend's prompt through NVIDIA Nemotron, JSON mode (the schema goes
// in the prompt; the backend validates the answer against it and checks quotes).
node(
  "First pass",
  "@n8n/n8n-nodes-langchain.chainLlm",
  1.7,
  [2420, 260],
  {
    promptType: "define",
    text: "={{ $json.messages[1].content + '\\n\\nAnswer with one JSON object only, following this JSON schema:\\n' + JSON.stringify($json.schema) }}",
    hasOutputParser: false,
    messages: { messageValues: [{ type: "SystemMessagePromptTemplate", message: "={{ $json.messages[0].content }}" }] },
  },
  { onError: "continueErrorOutput" },
);
node(
  "Submit first pass",
  "n8n-nodes-base.httpRequest",
  4.2,
  [2640, 100],
  medusa(
    "POST",
    `tasks/{{ ${TASK}.id }}/result`,
    `{ lease_token: ${TASK}.lease_token, model: 'nvidia:' + ${CONFIG}.first_pass_model, output: $json.text ?? $json, cost: { usd: 0, steps: 1 }, final: !(${CONFIG}.agent_fallback && ${RESEARCH}) }`,
  ),
  { credentials: medusaCredentials, ...RETRY, onError: "continueErrorOutput" },
);
node(
  "Nemotron (first pass)",
  "@n8n/n8n-nodes-langchain.lmChatNvidia",
  1,
  [2420, 460],
  nemotron("first_pass_model", { responseFormat: "json_object", temperature: 0, maxTokens: 16384, timeout: 300000 }),
  { credentials: nvidiaCredentials },
);
node("Settled?", "n8n-nodes-base.if", 2.2, [2860, 100], isTrue("settled", "$json.final !== false"));

// ── Fallback: the research agent, for research only ──────────────────────────
node("Fallback?", "n8n-nodes-base.if", 2.2, [2640, 420], isTrue("fallback", `${CONFIG}.agent_fallback && ${RESEARCH}`));
node(
  "Agent brief",
  "n8n-nodes-base.code",
  2,
  [3300, 300],
  code(`
const t = $('Task').first().json;
const what = t.kind === "RESEARCH_GENERATIONS"
  ? "List this model's generations (each with vehicles: [])."
  : 'Find the configurations of generation "' + t.generation + '" (return exactly that generation, under that name).';
return {
  prompt: [
    "Make: " + t.make, "Model: " + t.model, t.generation ? "Generation: " + t.generation : "",
    "", what,
    t.feedback ? "A reviewer noted: " + t.feedback : "",
    "Start with wiki_search and read_page (free); use web_search when Wikipedia is not enough. Validate with validate_catalog, then return the generations.",
  ].filter(Boolean).join("\\n"),
};
`),
);
node(
  "Research agent",
  "@n8n/n8n-nodes-langchain.agent",
  2,
  [3520, 300],
  { promptType: "define", text: "={{ $json.prompt }}", hasOutputParser: true, options: { systemMessage, maxIterations: 15 } },
  { onError: "continueErrorOutput" },
);
node(
  "Nemotron (agent)",
  "@n8n/n8n-nodes-langchain.lmChatNvidia",
  1,
  [3360, 560],
  nemotron("agent_model", { maxTokens: 16384, timeout: 600000, temperature: 0.1 }),
  { credentials: nvidiaCredentials },
);
node("Catalog generations", "@n8n/n8n-nodes-langchain.outputParserStructured", 1.2, [3900, 560], {
  schemaType: "manual",
  inputSchema: JSON.stringify(outputSchema, null, 2),
});
const tool = (name, position, description, parameters) =>
  node(name, "n8n-nodes-base.httpRequestTool", 4.2, position, { toolDescription: description, ...parameters }, { credentials: medusaCredentials });
tool(
  "wiki_search",
  [3480, 560],
  "Search Wikipedia (free). Returns article titles, URLs and snippets.",
  medusa("POST", "research/wiki-search", `{ query: $fromAI('query', 'e.g. "Dacia Sandero" or "Renault K engine"', 'string'), lang: $fromAI('lang', 'Wikipedia language: en or fr', 'string', 'en'), task_id: ${TASK}.id }`),
);
tool(
  "read_page",
  [3600, 560],
  "Read a page as markdown (free when possible). With focus (what you look for, e.g. 'engines power kW'), only the relevant passages come back.",
  medusa("POST", "research/read", `{ url: $fromAI('url', 'The page URL', 'string'), focus: $fromAI('focus', 'What you look for; empty for the whole page', 'string', ''), task_id: ${TASK}.id }`),
);
tool(
  "web_search",
  [3720, 560],
  "Search the web (costs a credit; use when Wikipedia is not enough). Returns results with their most relevant passages.",
  medusa("POST", "research/search", `{ query: $fromAI('query', 'e.g. "Dacia Sandero III fiche technique motorisations ch"', 'string'), task_id: ${TASK}.id }`),
);
// The draft goes as JSON text: n8n rejects an empty or stringified value for a 'json' tool
// input and fails the whole agent; the backend parses the text leniently instead.
tool(
  "validate_catalog",
  [3840, 560],
  "Check your draft answer against the catalog without writing anything: problems to fix, warnings (likely duplicates), what would be created and updated, contradicted existing values. Input: your answer as JSON text.",
  medusa(
    "POST",
    "research/validate",
    `{ task_id: ${TASK}.id, answer: $fromAI('answer', 'Your answer as JSON text (a string): {"generations": [...], "sources": [...], "notes": "..."}', 'string') }`,
  ),
);
node(
  "Agent file",
  "n8n-nodes-base.code",
  2,
  [3740, 300],
  code(`
const t = $('Task').first().json;
const { generations = [], sources = [], notes = "" } = $json.output ?? {};
return {
  sources,
  notes,
  file: {
    format: "vehicle-catalog@1",
    source: { name: "AI research agent", url: sources[0], retrieved_at: new Date().toISOString().slice(0, 10) },
    makes: [{ name: t.make, models: [{ name: t.model, generations }] }],
  },
};
`),
);
node(
  "Submit agent",
  "n8n-nodes-base.httpRequest",
  4.2,
  [4180, 300],
  medusa(
    "POST",
    `tasks/{{ ${TASK}.id }}/result`,
    `{ lease_token: ${TASK}.lease_token, model: 'nvidia:' + ${CONFIG}.agent_model, file: $('Agent file').first().json.file, sources: $('Agent file').first().json.sources, notes: $('Agent file').first().json.notes, cost: { usd: 0, steps: 1 }, final: true }`,
  ),
  { credentials: medusaCredentials, ...RETRY, onError: "continueErrorOutput" },
);
node(
  "Give up",
  "n8n-nodes-base.httpRequest",
  4.2,
  [3300, 560],
  medusa(
    "POST",
    `tasks/{{ ${TASK}.id }}/result`,
    `{ lease_token: ${TASK}.lease_token, error: $json.error?.message ?? (typeof $json.error === 'string' ? $json.error : null) ?? 'no first-pass answer and no agent fallback', final: true }`,
  ),
  { credentials: medusaCredentials, ...RETRY, onError: "continueRegularOutput" },
);
node(
  "Outcome",
  "n8n-nodes-base.code",
  2,
  [4400, 100],
  code(`
const t = $('Task').first().json;
return { task: t.id, kind: t.kind, label: [t.make, t.model, t.generation].filter(Boolean).join(" "), status: $json.status ?? "failed", reason: $json.reason ?? $json.error?.message ?? null };
`),
);

// ── Summary from the ledger ──────────────────────────────────────────────────
node(
  "Run summary",
  "n8n-nodes-base.httpRequest",
  4.2,
  [1760, -160],
  {
    url: `={{ ${CONFIG}.medusa_url }}/admin/vehicle-catalog/tasks/summary`,
    authentication: "genericCredentialType",
    genericAuthType: "httpBasicAuth",
    sendQuery: true,
    queryParameters: { parameters: [{ name: "since", value: "={{ $('Start').first().json.started }}" }] },
    options: {},
  },
  { credentials: medusaCredentials, ...RETRY },
);
node(
  "Summary text",
  "n8n-nodes-base.code",
  2,
  [1980, -160],
  code(
    `
const s = $input.first().json;
const lint = $('Lint').first().json;
const fmt = (o) => Object.entries(o ?? {}).map(([k, v]) => k + " " + v).join(", ") || "none";
const text = [
  "Catalog steward: " + s.ran + " task(s) run (" + fmt(s.by_status) + ").",
  "By kind: " + fmt(s.by_kind) + ".",
  "Rules: " + (lint.errors ?? 0) + " error(s), " + (lint.warnings ?? 0) + " warning(s), " + (lint.fixed ?? 0) + " fixed.",
  "Search credits: " + (s.credits ?? 0) + ". Model usage: NVIDIA's API dashboard.",
  "Waiting for review: " + s.waiting_review + " (Vehicles › Research in the admin).",
  ...(s.applied ?? []).slice(0, 15).map((a) => "• " + a),
].join("\\n");
return [{ json: { text, summary: s } }];
`,
    "runOnceForAllItems",
  ),
);
node("Notify?", "n8n-nodes-base.if", 2.2, [2200, -160], isTrue("notify", `!!${CONFIG}.review_webhook_url`));
node("Send summary", "n8n-nodes-base.httpRequest", 4.2, [2420, -240], {
  method: "POST",
  url: `={{ ${CONFIG}.review_webhook_url }}`,
  sendBody: true,
  specifyBody: "json",
  jsonBody: "={{ JSON.stringify({ text: $json.text }) }}",
  options: {},
});

// ── Connections ──────────────────────────────────────────────────────────────
const connections = {};
const link = (from, to, { output = 0, type = "main" } = {}) => {
  const outputs = (connections[from] ??= {})[type] ??= [];
  while (outputs.length <= output) outputs.push([]);
  outputs[output].push({ node: to, type, index: 0 });
};
link("Nightly", "Config");
link("Run now", "Config");
link("Config", "Start");
link("Start", "Lint");
link("Lint", "Refresh ledger");
link("Refresh ledger", "Continue?");
link("Continue?", "Claim task", { output: 0 });
link("Continue?", "Run summary", { output: 1 });
link("Claim task", "Next task?");
link("Next task?", "Task", { output: 0 });
link("Next task?", "Run summary", { output: 1 });
link("Task", "Prompt");
link("Prompt", "Evidence found?", { output: 0 });
link("Prompt", "Give up", { output: 1 });
link("Evidence found?", "First pass", { output: 0 });
link("First pass", "Submit first pass", { output: 0 });
link("First pass", "Fallback?", { output: 1 }); // the model call failed: the task is still leased
link("Nemotron (first pass)", "First pass", { type: "ai_languageModel" });
link("Evidence found?", "Fallback?", { output: 1 });
link("Submit first pass", "Settled?", { output: 0 });
link("Submit first pass", "Outcome", { output: 1 });
link("Settled?", "Outcome", { output: 0 });
link("Settled?", "Fallback?", { output: 1 });
link("Fallback?", "Agent brief", { output: 0 });
link("Fallback?", "Give up", { output: 1 });
link("Agent brief", "Research agent");
link("Research agent", "Agent file", { output: 0 });
link("Research agent", "Give up", { output: 1 });
link("Agent file", "Submit agent");
link("Submit agent", "Outcome", { output: 0 });
link("Submit agent", "Outcome", { output: 1 });
link("Give up", "Outcome");
link("Outcome", "Continue?");
link("Run summary", "Summary text");
link("Summary text", "Notify?");
link("Notify?", "Send summary", { output: 0 });
link("Nemotron (agent)", "Research agent", { type: "ai_languageModel" });
link("Catalog generations", "Research agent", { type: "ai_outputParser" });
for (const t of ["wiki_search", "read_page", "web_search", "validate_catalog"]) link(t, "Research agent", { type: "ai_tool" });

const workflow = {
  // Stable: re-importing (CLI) updates this workflow instead of adding a copy.
  id: "vehCatResearch01",
  name: "Vehicle catalog steward",
  active: false,
  nodes,
  connections,
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
