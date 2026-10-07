# n8n: vehicle catalog research

`vehicle-catalog-research.json` is an n8n workflow (n8n 2.x) in which an AI agent researches the vehicle catalog on the web and creates or completes it through the Medusa admin API. It runs weekly, or on demand with **Run now**.

## How it works

1. **Research tasks** (`GET /admin/vehicle-catalog/tasks`) gives the next `tasks_per_run` focused tasks, most useful first:
   - **generations**: a model with no generations yet;
   - **configurations**: one generation with at most `max_configurations` configurations (empty ones first, most recent first). Each task comes with the model's generations and the configurations the catalog already has.
2. For each task:
   - **Task prompt** turns the task into a short brief: which generation, its catalog years, and the existing configurations to match exactly.
   - The **Research agent** (Claude Sonnet 5.5 through OpenRouter) uses three tools:
     - `web_search`: 5 results with their most relevant passages;
     - `read_page`: a page as markdown, either only the passages matching a `focus` or the whole page cut at 30k characters;
     - `validate_catalog`: a dry-run import of its generations.

     It must validate and fix every problem before answering. The output schema comes from the catalog contract, and every field the import would otherwise default (doors, drive, transmission…) must be stated.
   - **Build catalog file** keeps the answer within the task: only the given generation for a configurations task, and no configurations for a generations task.
   - **Validate (dry run)** re-checks the file, and **Decide** applies it only when all of these hold:
     - no problems;
     - no warnings (likely duplicates);
     - it adds something;
     - `auto_apply` is on.
   - **Apply (fill)** imports with `mode=fill`:
     - missing generations and configurations are created;
     - values the catalog lacks are filled in, such as a missing code or an end year;
     - **existing values are never overwritten**, and blank values never count as information.
3. **Run summary** lists each task's outcome and optionally posts it to a Slack-compatible webhook. The outcomes are:
   - `applied`;
   - `applied, review contradictions`;
   - `possible duplicates`;
   - `problems`;
   - `nothing new`;
   - `failed`.

   Proposals that weren't applied stay in the execution with their sources and notes.

The import refuses (nothing is written):
- configurations outside their generation's years as the catalog has them;
- generation or configuration updates that would break that rule;
- a configuration that collides with an existing identical one;
- duplicate references.

It warns about likely duplicates, which go to review:
- a new generation overlapping an existing one by more than a year (the same generation under another name);
- a new configuration with the same fuel, power, body, doors, drive and transmission as an existing one but described differently (for example without its engine code).

Imports are transactional. The agent may not use sites that forbid automated access; autoevolution.com is excluded.

## Setup

1. **Medusa secret API key.** In the admin, open Settings › Secret API Keys and create a key, for example "n8n catalog research". It acts as an admin, so keep it in n8n's credential store only.
2. **Start n8n and import the workflow.** n8n is part of the local infrastructure: service `n8n` in `infra/docker/docker-compose.infra.yml`, at http://localhost:5678. On the first visit, create the owner account.
   ```bash
   docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.infra.yml up -d n8n
   yarn n8n:import        # this folder is mounted at /workflows in the container
   ```
   Re-importing replaces the workflow (same id), and its credentials have to be selected again. Without the compose service, use Workflows › Import from file.
3. **Credentials.** Create these, then select them on the nodes that show a warning:
   - *Medusa secret API key*: type **Basic Auth**, user = the secret key (`sk_…`), password empty. Used by Research tasks, Validate (dry run), Apply (fill) and `validate_catalog`.
   - *Tavily API key*: type **Header Auth**, name `Authorization`, value `Bearer tvly-…`. Used by `web_search` and `read_page`.
   - *OpenRouter account*: your OpenRouter API key (`sk-or-…`). Used by **Chat model (OpenRouter)**, model `anthropic/claude-sonnet-5.5`. Any OpenRouter model with tool calling can replace it.
4. **Config node:**
   - `medusa_url`: Medusa as seen from n8n.
     - Medusa on the host (`yarn dev`): `http://host.docker.internal:9000`, the default.
     - Medusa in compose: `http://medusa:9000`.
     - Kubernetes: the backend service URL.
   - `make`: one make only, or empty for every make.
   - `tasks_per_run`: default 10.
   - `max_configurations`: 0 means empty generations only; raise it to complete thin ones.
   - `auto_apply`: set it to false to validate only.
   - `review_webhook_url`: optional.
5. Run **Run now** with `tasks_per_run: 1` and check the execution and the catalog, then activate the workflow (Mondays 03:00, Africa/Tunis).

**Cost.** A task is one agent run, usually 5 to 15 steps: Tavily searches and reads, at 2 credits each, plus model tokens. The agent's context is re-sent on every step, which is why tool responses are trimmed. Expect roughly $0.20 to $0.60 per task with Sonnet 5.5. Size `tasks_per_run` accordingly, or pick a cheaper OpenRouter model.

## Applying a reviewed proposal

Take the `file` from the task's item in the **Outcome** node of the execution. Fix what the review found (for example, copy an existing configuration's values to match it), then either:
- post it with `mode=overwrite`, which writes the contradicting values too:
  ```bash
  curl -u "$MEDUSA_SECRET_KEY:" -H 'content-type: application/json' \
    -X POST 'http://localhost:9000/admin/vehicle-catalog/import?mode=overwrite&dry_run=true' -d @proposal.json
  ```
  then repeat without `dry_run=true`;
- or save it under `packages/domains/automotive/data/vehicle-catalog/` and run the import script with `overwrite` (see that folder's README).

## Changing the workflow

The JSON file is generated: edit `build-workflow.mjs` and the agent's instructions in `prompts/researcher.md`, then rebuild:

```bash
yarn workspace @repo/module-vehicle build && node infra/n8n/build-workflow.mjs
```

Rebuild after changing the catalog format (`CatalogGenerationSchema`), since the agent's output schema derives from it. Changes made in the n8n editor are not written back here: export the workflow and port them to the builder.
