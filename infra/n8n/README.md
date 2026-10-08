# n8n: the vehicle catalog steward

`vehicle-catalog-research.json` is an n8n workflow (n8n 2.x) that maintains the vehicle catalog every night. It does three things:
- **Fills gaps:** models without generations, generations without configurations.
- **Verifies records:** each entity against its source, on a cycle set by its trust tier.
- **Applies rules** to every entity.

Every model call goes through **OmniRoute**, the OpenAI-compatible AI gateway running in Docker (`omniroute`, port 20128): a first pass on each task, and a research agent as a fallback. OmniRoute picks the provider (routing combos such as `auto/cheap`, with fallback across providers, including a local Ollama), and its per-key spend quota caps the cost.

The backend holds the logic: the rules, the task ledger, prompts, quote checks and the apply policy (vehicle module and automotive domain, `/admin/vehicle-catalog/*`). The workflow runs the models and reports.

## A night (01:00 until `window_end`, or Run now)

1. **Lint** (`POST /lint`) checks every make, model, generation, engine, configuration and reference against the rules: duplicates, implausible values, naming. Stray spaces are fixed automatically; other errors and warnings become **cleanup tasks** in the review queue, each with a proposed fix or merge.
2. **Refresh ledger** (`POST /tasks/refresh`) queues what the catalog needs, ranked by value. Models sold new in Tunisia come first, then recent generations:
   - research for gaps;
   - verification of a *model unit* (the model and its generations) or a *generation unit* (its configurations and their engines) once one of its records is due. Draft and research records are due after 90 days, reference after 365, licensed after 730, and staff edits never.
3. **The loop**, one leased task at a time until `window_end` or `max_tasks`:
   - **Prompt** (`POST /tasks/:id/prompt`): the backend finds the evidence (pages the catalog already cites, else Wikipedia's best match), condenses it to what the task needs (about 3k tokens: fewer tokens, lower cost), and returns the messages and the JSON schema of the answer.
   - **First pass**: the prompt goes to OmniRoute (`first_pass_model`, default `auto/cheap`) in JSON mode, through n8n's OpenAI Chat Model node. The model copies values as written ("85 ch", "1.461 L") and quotes its evidence verbatim.
   - **Submit first pass** (`POST /tasks/:id/result`): the backend parses the answer, converts units, and checks every quote against the cached page; claims whose quote isn't found are dropped. It then applies the policy:
     - **Research:** a dry run, then an import in `merge` mode at RESEARCH tier when clean; otherwise kept for review (problems, likely duplicates, mostly assumed values).
     - **Verification:** confirmed records are stamped (`verified_at`, the source; draft rises to research). Draft or blank values are corrected, other contradictions go to review (engines always, because they are shared), and missing records are added.
   - **Fallback** (research only, `agent_fallback`): when the first pass didn't apply, or found no evidence, the **research agent** (`agent_model` through OmniRoute) researches with the backend's gateway tools:
     - `wiki_search` and `read_page` (free);
     - `web_search` (Tavily, 1 credit);
     - `validate_catalog`.

     Search credits are recorded on the task; model spend is in OmniRoute's dashboard.
   - **Backoff:** a failed task waits 2^attempts days (at most 60) before its next try, one with no data waits 90 days, and a review waits for a person.
4. **Summary** (`GET /tasks/summary`): outcomes, search credits and reviews waiting, posted to the webhook if set.

**Trust tiers:** DRAFT < RESEARCH < REFERENCE < LICENSED < HUMAN.
- Imports replace a value only from a higher tier, and never a staff edit (admin edits pin HUMAN).
- A blank end year means "still produced", so only a higher tier fills it.
- Every catalog record shows its tier, last verification and sources (Provenance panel).

**Review queue:** Vehicles › Research in the admin, filtered by status *To review*. Each task shows the report, the finding or proposal, the pages read and the cost.
- **Approve** applies the proposal (at REFERENCE tier), the corrections, or the fix. Duplicate configurations are merged, with fitments and garage entries re-pointed.
- **Reject** closes it with feedback that the next run receives, and the finding stays quiet for 180 days.

## Setup

1. **Services.** n8n is part of the local infrastructure; OmniRoute runs in its own container (reached at `http://host.docker.internal:20128/v1`):
   ```bash
   docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.infra.yml up -d n8n
   yarn n8n:import       # this folder is mounted at /workflows in the n8n container
   ```
   Re-importing replaces the workflow, and its credentials have to be selected again.

   *Optional, a local model behind OmniRoute:* `docker compose … up -d ollama` and `yarn ollama:pull` (qwen3.5:4b), then add Ollama as a provider in OmniRoute at `http://host.docker.internal:11434`. On a Mac without a usable GPU it runs on the CPU (1–3 minutes per task).
2. **Backend env** (`apps/backend/.env`):
   - `TAVILY_API_KEY`: optional; Wikipedia and direct fetches are free;
   - `WEB_RESEARCH_USER_AGENT`;
   - `WEB_RESEARCH_BLOCKED_DOMAINS`: optional.
3. **Database:**
   - `yarn workspace backend medusa:db:migrate`;
   - once, the provenance backfill, which gives existing records their tier and sources and sets `on_sale_new`:
     ```bash
     # from apps/backend
     npx medusa exec ../../packages/domains/automotive/.medusa/server/src/scripts/backfill-catalog-provenance.js \
       ../../packages/domains/automotive/data/vehicle-catalog
     ```
4. **Credentials in n8n:**
   - *Medusa secret API key*: **Basic Auth**, the `sk_…` key as user, password empty. Create the key in the admin under Settings › Secret API Keys.
   - *OmniRoute*: type **OpenAI**, the API key from OmniRoute's dashboard, URL `http://host.docker.internal:20128/v1`. Give that key a **monthly spend quota** in OmniRoute: that is the hard cap.
5. **Config node:**
   - `medusa_url`, `omniroute_url`;
   - `first_pass_model`, `agent_model`: OmniRoute models or combos (`auto`, `auto/cheap`, `provider/model-id`);
   - `agent_fallback`;
   - `window_end`, `max_tasks`;
   - `review_webhook_url`.
6. Run **Run now** with `max_tasks: 5` and check the ledger, the catalog and the review queue, then activate the workflow.

**Cost:** a first pass sends about 4k tokens and gets 1–4k back; with a cheap combo that's a fraction of a cent per task. The research agent takes several steps, so it costs more, and only runs for research the first pass couldn't settle.

## Changing the workflow

The JSON file is generated: edit `build-workflow.mjs` and the fallback agent's instructions in `prompts/researcher.md`, then rebuild. The first-pass prompts are built by the backend (`buildPrompt` in `@repo/module-vehicle/core`).

```bash
yarn workspace @repo/module-vehicle build && node infra/n8n/build-workflow.mjs
```
