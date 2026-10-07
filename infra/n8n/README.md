# n8n: vehicle catalog research

`vehicle-catalog-research.json` is an n8n workflow (n8n 2.x) in which an AI agent researches the vehicle catalog on the web and creates or completes it through the Medusa admin API. It runs weekly, or on demand with **Run now**.

## How it works

1. **Least complete models**: `GET /admin/vehicle-catalog/coverage` gives the models with no generations first, then those with the fewest configurations (`models_per_run` of them, optionally one `make`).
2. For each model:
   - **Existing catalog** (`GET /admin/vehicle-catalog/export`) is summarized into the prompt, so the agent reuses the existing generation names (the natural key).
   - The **Research agent** (Claude) uses four tools: `web_search` and `read_page` (Tavily), `get_existing_catalog`, and `validate_catalog` (a dry-run import). It must validate its answer and fix every problem before returning generations and configurations, with its sources and notes for reviewers. The output schema comes from the catalog contract.
   - **Validate (dry run)** re-checks the result. When it is clean and adds something, **Apply (fill)** imports it with `mode=fill`:
     - missing generations and configurations are created;
     - values the catalog lacks are filled in (a missing code, an end year for a generation still listed as current);
     - **existing values are never overwritten**: contradictions are reported for review.
3. **Run summary** lists each model's outcome and optionally posts it to a Slack-compatible webhook. The outcomes are:
   - `applied`;
   - `applied, review contradictions`;
   - `problems`: nothing was written;
   - `nothing new`;
   - `failed`.

   The proposal, its sources and the notes stay in the n8n execution.

Guardrails:
- Imports are transactional: a file with any problem writes nothing.
- Configuration years must fit their generation's.
- An updated generation may not leave existing configurations outside its years.
- The agent may not use sites that forbid automated access. autoevolution.com is excluded.

## Setup

1. **Medusa secret API key.** In the admin, open Settings › Secret API Keys and create a key, for example "n8n catalog research". The key acts as an admin, so keep it in n8n's credential store only.
2. **Import the workflow.** In n8n, use Workflows › Import from file and pick `vehicle-catalog-research.json`. Alternatively, use the CLI:
   ```bash
   docker cp infra/n8n/vehicle-catalog-research.json n8n:/tmp/ && docker exec n8n n8n import:workflow --input=/tmp/vehicle-catalog-research.json
   ```
3. **Credentials.** Create these three, then select them on the nodes that show a warning:
   - *Medusa secret API key*: type **Basic Auth**, user = the secret key (`sk_…`), password empty. Used by the five Medusa nodes and tools.
   - *Tavily API key*: type **Header Auth**, name `Authorization`, value `Bearer tvly-…`. Used by `web_search` and `read_page`.
   - *Anthropic account*: Anthropic API key. Used by the Claude node, model `claude-sonnet-5-5`.
4. **Config node:**
   - `medusa_url`: Medusa as seen from n8n. With n8n in Docker and Medusa on the host, that is `http://host.docker.internal:9000`; in Kubernetes, the backend service URL.
   - `make`: one make only, or empty for every make.
   - `models_per_run`, default 5.
   - `max_configurations`: -1 for any model.
   - `auto_apply`: set it to false to validate only and review everything.
   - `review_webhook_url`: optional.
5. Use **Run now** on one make with `models_per_run: 1`, check the execution and the catalog, then activate the workflow for the weekly run (Mondays 03:00, Africa/Tunis).

Each model costs one agent run, usually 10 to 30 tool calls: Tavily searches and page reads plus Claude tokens. Size `models_per_run` to your budget.

## Applying a reviewed proposal

To apply a reviewed proposal, take the `file` from the model's item in the **Needs review** node of the execution. Then either:
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
