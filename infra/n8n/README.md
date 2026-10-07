# n8n: the vehicle catalog steward

`vehicle-catalog-research.json` is an n8n workflow (n8n 2.x) that maintains the vehicle catalog every night. It does three things:
- **Fills gaps:** models without generations, generations without configurations.
- **Verifies records:** each entity against its source, on a cycle set by its trust tier.
- **Applies rules** to every entity.

It runs a local model first (Ollama, free) and a cloud agent (OpenRouter) only as a budget-paced fallback.

The backend holds the logic: the rules, the task ledger, prompts, quote checks and the apply policy (vehicle module and automotive domain, `/admin/vehicle-catalog/*`). The workflow runs the models and reports.

## A night (01:00 until `window_end`, or Run now)

1. **Lint** (`POST /lint`) checks every make, model, generation, engine, configuration and reference against the rules: duplicates, implausible values, naming. Stray spaces are fixed automatically; other errors and warnings become **cleanup tasks** in the review queue, each with a proposed fix or merge.
2. **Refresh ledger** (`POST /tasks/refresh`) queues what the catalog needs, ranked by value. Models sold new in Tunisia come first, then recent generations:
   - research for gaps;
   - verification of a *model unit* (the model and its generations) or a *generation unit* (its configurations and their engines) once one of its records is due. Draft and research records are due after 90 days, reference after 365, licensed after 730, and staff edits never.
3. **Warm up model** loads the local model.
4. **The loop**, one leased task at a time until `window_end` or `max_tasks`:
   - **Prompt** (`POST /tasks/:id/prompt`): the backend finds the evidence (pages the catalog already cites, else Wikipedia's best match), condenses it to what the task needs (about 3k tokens, since a CPU reads every token), and returns the messages and the JSON schema of the answer.
   - **Local model**: Ollama `/api/chat`, constrained to the schema, with thinking off. The model copies values as written ("85 ch", "1.461 L") and quotes its evidence verbatim.
   - **Submit local** (`POST /tasks/:id/result`): the backend parses the answer, converts units, and checks every quote against the cached page; claims whose quote isn't found are dropped. It then applies the policy:
     - **Research:** a dry run, then an import in `merge` mode at RESEARCH tier when clean; otherwise kept for review (problems, likely duplicates, mostly assumed values).
     - **Verification:** confirmed records are stamped (`verified_at`, the source; draft rises to research). Draft or blank values are corrected, other contradictions go to review (engines always, because they are shared), and missing records are added.
   - **Fallback** (research only, `cloud_fallback`): when the local attempt didn't apply, or found no evidence, and the month is within budget (OpenRouter `/api/v1/key`), the **cloud agent** researches with the backend's gateway tools:
     - `wiki_search` and `read_page` (free);
     - `web_search` (Tavily, 1 credit);
     - `validate_catalog`.

     It uses `cloud_cheap` normally (NVIDIA Nemotron 3 Super, $0.08/$0.45 per million tokens) and `cloud_strong` (Nemotron 3 Ultra, $0.50/$2.20) for tasks that failed twice, while the month is below `escalate_below` of the budget. The cost of each run is recorded on the task.
   - **Backoff:** a failed task waits 2^attempts days (at most 60) before its next try, one with no data waits 90 days, and a review waits for a person.
5. **Summary** (`GET /tasks/summary`): outcomes, spend and reviews waiting, posted to the webhook if set.

**Trust tiers:** DRAFT < RESEARCH < REFERENCE < LICENSED < HUMAN.
- Imports replace a value only from a higher tier, and never a staff edit (admin edits pin HUMAN).
- A blank end year means "still produced", so only a higher tier fills it.
- Every catalog record shows its tier, last verification and sources (Provenance panel).

**Review queue:** Vehicles › Research in the admin, filtered by status *To review*. Each task shows the report, the finding or proposal, the pages read and the cost.
- **Approve** applies the proposal (at REFERENCE tier), the corrections, or the fix. Duplicate configurations are merged, with fitments and garage entries re-pointed.
- **Reject** closes it with feedback that the next run receives, and the finding stays quiet for 180 days.

## Setup

1. **Local services.** n8n and Ollama are part of the local infrastructure:
   ```bash
   docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.infra.yml up -d n8n ollama
   yarn ollama:pull      # qwen3.5:4b, about 3 GB, once
   yarn n8n:import       # this folder is mounted at /workflows in the n8n container
   ```
   This Mac runs Ollama on the CPU (no usable GPU), so give Docker Desktop 10–12 GB of memory: Settings › Resources. Re-importing replaces the workflow, and its credentials have to be selected again.
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
   - *OpenRouter account*: your OpenRouter key. Give it a **$20 monthly limit** in OpenRouter: that is the hard cap, and the workflow also stops at `monthly_budget_usd`.
5. **Config node:**
   - `medusa_url`, `ollama_url`, `local_model`;
   - `cloud_fallback`, `cloud_cheap`, `cloud_strong`, `escalate_below`;
   - `monthly_budget_usd`;
   - `window_end`, `max_tasks`;
   - `review_webhook_url`.
6. Run **Run now** with `max_tasks: 5` and check the ledger, the catalog and the review queue, then activate the workflow.

**Throughput and cost on this Mac** (Intel i7, 4 cores, CPU only): about 1–3 minutes per local task, so 100–150 tasks a night. The cloud agent costs about $0.05–0.35 per research task it takes over; most tasks never reach it.

## Changing the workflow

The JSON file is generated: edit `build-workflow.mjs` and the fallback agent's instructions in `prompts/researcher.md`, then rebuild. The local prompts are built by the backend (`buildPrompt` in `@repo/module-vehicle/core`).

```bash
yarn workspace @repo/module-vehicle build && node infra/n8n/build-workflow.mjs
```
