// Builds the n8n workflow of the catalog steward (vehicle-catalog-research.json):
// a nightly loop over the backend's task ledger. The backend decides what to do
// (rules, ledger, prompts, checks, apply policy); this workflow runs the
// models: the local one (Ollama) first, the cloud agent (OpenRouter) as a
// budget-paced fallback for research it couldn't settle. The agent's output
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
const openRouterCredentials = { openRouterApi: { id: "", name: "OpenRouter account" } };
const nvidiaCredentials = { nvidiaApi: { id: "", name: "NVIDIA API" } };
const OLLAMA = `${CONFIG}.model_provider === 'ollama'`;
/** The first-pass model, as recorded on the task (provenance). */
const FIRST_MODEL = `(${OLLAMA} ? ${CONFIG}.local_model : 'nvidia:' + ${CONFIG}.nvidia_model)`;
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
const openRouterKey = () => ({
  url: "https://openrouter.ai/api/v1/key",
  authentication: "predefinedCredentialType",
  nodeCredentialType: "openRouterApi",
  options: {},
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
    // The first-pass model, which does every task it can: "nvidia" (the NVIDIA
    // Nemotron chat model node, NVIDIA's API) or "ollama" (a local model, on a
    // machine that can run one; pull it first: yarn ollama:pull).
    model_provider: ["string", "nvidia"],
    nvidia_model: ["string", "nvidia/nemotron-3-super-120b-a12b"],
    ollama_url: ["string", "http://ollama:11434"],
    local_model: ["string", "qwen3.5:4b"],
    // The cloud agent researches what the local model couldn't settle.
    cloud_fallback: ["boolean", true],
    // NVIDIA Nemotron through OpenRouter (tool calling and structured output).
    cloud_cheap: ["string", "nvidia/nemotron-3-super-120b-a12b"],
    // Tasks that failed twice get the strong model, while the month is below `escalate_below` of the budget.
    cloud_strong: ["string", "nvidia/nemotron-3-ultra-550b-a55b"],
    escalate_below: ["number", 0.6],
    // Cloud spend cap for the month (also set it as the OpenRouter key's limit).
    monthly_budget_usd: ["number", 20],
    // The run stops claiming at this time (workflow timezone) or after this many tasks.
    window_end: ["string", "06:00"],
    max_tasks: ["number", 150],
    // Slack-compatible incoming webhook for the run summary (empty: none).
    review_webhook_url: ["string", ""],
  }),
  { notes: "Credentials: Medusa secret API key (Basic Auth: the key as user, empty password), NVIDIA API (build.nvidia.com key) and OpenRouter. Web search runs in the backend (TAVILY_API_KEY in its env)." },
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
node("Ollama?", "n8n-nodes-base.if", 2.2, [1000, 100], isTrue("ollama", OLLAMA));
node(
  "Warm up model",
  "n8n-nodes-base.httpRequest",
  4.2,
  [1100, 0],
  {
    method: "POST",
    url: `={{ ${CONFIG}.ollama_url }}/api/generate`,
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify({ model: ${CONFIG}.local_model, keep_alive: '6h' }) }}`,
    options: { timeout: 600000 },
  },
  { onError: "continueRegularOutput" },
);

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
node("Use Ollama?", "n8n-nodes-base.if", 2.2, [2310, 160], isTrue("use-ollama", OLLAMA));
// NVIDIA path: the backend's prompt through the NVIDIA Nemotron chat model, JSON mode
// (the schema goes in the prompt; the backend validates the answer against it).
node(
  "Nemotron (first pass)",
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
  "NVIDIA Nemotron Chat Model",
  "@n8n/n8n-nodes-langchain.lmChatNvidia",
  1,
  [2420, 460],
  { model: `={{ ${CONFIG}.nvidia_model }}`, options: { responseFormat: "json_object", temperature: 0, maxTokens: 16384, timeout: 300000 } },
  { credentials: nvidiaCredentials },
);
node(
  "Local model",
  "n8n-nodes-base.httpRequest",
  4.2,
  [2420, 100],
  {
    method: "POST",
    url: `={{ ${CONFIG}.ollama_url }}/api/chat`,
    sendBody: true,
    specifyBody: "json",
    // One schema-constrained call, thinking off, the model kept loaded; a CPU needs time.
    jsonBody: `={{ JSON.stringify({ model: ${CONFIG}.local_model, messages: $json.messages, format: $json.schema, stream: false, think: false, keep_alive: '6h', options: { temperature: 0, num_ctx: 8192 } }) }}`,
    options: { timeout: 900000 },
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
    `{ lease_token: ${TASK}.lease_token, model: ${FIRST_MODEL}, output: $json.message?.content ?? $json.text ?? $json, cost: { usd: 0, steps: 1 }, final: !(${CONFIG}.cloud_fallback && ${RESEARCH}) }`,
  ),
  { credentials: medusaCredentials, ...RETRY, onError: "continueErrorOutput" },
);
node("Settled?", "n8n-nodes-base.if", 2.2, [2860, 100], isTrue("settled", "$json.final !== false"));

// ── Fallback: the cloud agent, for research only, within budget ──────────────
node("Fallback?", "n8n-nodes-base.if", 2.2, [2640, 420], isTrue("fallback", `${CONFIG}.cloud_fallback && ${RESEARCH}`));
node("Budget", "n8n-nodes-base.httpRequest", 4.2, [2860, 360], openRouterKey(), { credentials: openRouterCredentials, ...RETRY });
node(
  "Within budget?",
  "n8n-nodes-base.if",
  2.2,
  [3080, 360],
  isTrue("budget", `($json.data?.usage_monthly ?? 0) < ${CONFIG}.monthly_budget_usd && ($json.data?.limit_remaining == null || $json.data.limit_remaining > 0.05)`),
);
node(
  "Agent brief",
  "n8n-nodes-base.code",
  2,
  [3300, 300],
  code(`
const t = $('Task').first().json;
const cfg = $('Config').first().json;
const usage = $('Budget').first().json.data ?? {};
const strong = t.attempts >= 2 && (usage.usage_monthly ?? 0) < cfg.escalate_below * cfg.monthly_budget_usd;
const what = t.kind === "RESEARCH_GENERATIONS"
  ? "List this model's generations (each with vehicles: [])."
  : 'Find the configurations of generation "' + t.generation + '" (return exactly that generation, under that name).';
return {
  model: strong ? cfg.cloud_strong : cfg.cloud_cheap,
  usage_before: usage.usage ?? 0,
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
  "Chat model (OpenRouter)",
  "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
  1,
  [3360, 560],
  { model: "={{ $('Agent brief').first().json.model }}", options: { maxTokens: 16000, timeout: 600000, temperature: 0.1 } },
  { credentials: openRouterCredentials },
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
tool(
  "validate_catalog",
  [3840, 560],
  "Check your generations against the catalog without writing anything: problems to fix, warnings (likely duplicates), what would be created and updated, contradicted existing values.",
  medusa(
    "POST",
    "import",
    `{ format: 'vehicle-catalog@1', source: { name: 'research draft' }, makes: [{ name: ${TASK}.make, models: [{ name: ${TASK}.model, generations: $fromAI('generations', 'Your generations, exactly as you will return them', 'json') }] }] }`,
    { sendQuery: true, queryParameters: { parameters: [{ name: "dry_run", value: "true" }, { name: "mode", value: "merge" }] } },
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
node("Usage after", "n8n-nodes-base.httpRequest", 4.2, [3960, 300], openRouterKey(), { credentials: openRouterCredentials, ...RETRY });
node(
  "Submit agent",
  "n8n-nodes-base.httpRequest",
  4.2,
  [4180, 300],
  medusa(
    "POST",
    `tasks/{{ ${TASK}.id }}/result`,
    `{ lease_token: ${TASK}.lease_token, model: 'openrouter:' + $('Agent brief').first().json.model, file: $('Agent file').first().json.file, sources: $('Agent file').first().json.sources, notes: $('Agent file').first().json.notes, cost: { usd: Math.max(0, ($json.data?.usage ?? 0) - $('Agent brief').first().json.usage_before), steps: 1 }, final: true }`,
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
    `{ lease_token: ${TASK}.lease_token, error: $json.error?.message ?? (typeof $json.error === 'string' ? $json.error : null) ?? ($json.data ? 'cloud budget reached' : 'no first-pass answer and no cloud fallback'), final: true }`,
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
  "Cloud spend: $" + (s.usd ?? 0).toFixed(2) + ", search credits: " + (s.credits ?? 0) + ".",
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
link("Refresh ledger", "Ollama?");
link("Ollama?", "Warm up model", { output: 0 });
link("Ollama?", "Continue?", { output: 1 });
link("Warm up model", "Continue?");
link("Continue?", "Claim task", { output: 0 });
link("Continue?", "Run summary", { output: 1 });
link("Claim task", "Next task?");
link("Next task?", "Task", { output: 0 });
link("Next task?", "Run summary", { output: 1 });
link("Task", "Prompt");
link("Prompt", "Evidence found?", { output: 0 });
link("Prompt", "Give up", { output: 1 });
link("Evidence found?", "Use Ollama?", { output: 0 });
link("Use Ollama?", "Local model", { output: 0 });
link("Use Ollama?", "Nemotron (first pass)", { output: 1 });
link("Nemotron (first pass)", "Submit first pass", { output: 0 });
link("Nemotron (first pass)", "Fallback?", { output: 1 }); // the API failed: the task is still leased
link("NVIDIA Nemotron Chat Model", "Nemotron (first pass)", { type: "ai_languageModel" });
link("Evidence found?", "Fallback?", { output: 1 });
link("Local model", "Submit first pass", { output: 0 });
link("Local model", "Fallback?", { output: 1 }); // Ollama down: the task is still leased
link("Submit first pass", "Settled?", { output: 0 });
link("Submit first pass", "Outcome", { output: 1 });
link("Settled?", "Outcome", { output: 0 });
link("Settled?", "Fallback?", { output: 1 });
link("Fallback?", "Budget", { output: 0 });
link("Fallback?", "Give up", { output: 1 });
link("Budget", "Within budget?");
link("Within budget?", "Agent brief", { output: 0 });
link("Within budget?", "Give up", { output: 1 });
link("Agent brief", "Research agent");
link("Research agent", "Agent file", { output: 0 });
link("Research agent", "Give up", { output: 1 });
link("Agent file", "Usage after");
link("Usage after", "Submit agent");
link("Submit agent", "Outcome", { output: 0 });
link("Submit agent", "Outcome", { output: 1 });
link("Give up", "Outcome");
link("Outcome", "Continue?");
link("Run summary", "Summary text");
link("Summary text", "Notify?");
link("Notify?", "Send summary", { output: 0 });
link("Chat model (OpenRouter)", "Research agent", { type: "ai_languageModel" });
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
