# AGENTS.md — Coding Agent Reference

ERP SaaS on Medusa v2. Each client (tenant) runs its own Medusa instance; business capabilities ship as plugins built on `@repo/framework`.

## Layout

Turborepo + Yarn 4 (node-modules linker), Node >= 20.

```
apps/backend/                 Medusa app (workspace "backend"): config, scripts, no domain code
packages/framework/           @repo/framework — platform SDK, built to dist/ (cjs for Node, esm for Vite)
packages/ui/dashboard/        @repo/dashboard — admin templates, form engine, data table (source-linked)
packages/plugins/<name>/      @repo/plugin-<name> — one capability per plugin (today: automotive)
packages/config/              @repo/config — tsconfig, eslint (incl. layers.js), jest presets
packages/tooling/scripts/     @repo/scripts — plugin dev watcher, plugin generator
infra/docker, infra/k8s       local infra and Kubernetes manifests (target: Kubernetes on OVHcloud)
```

`@repo/framework` entries: `entity`, `core`, `utils`, `admin` are isomorphic (safe in admin code); `entity/server`, `http`, `orm`, `admin/plugins` are server-only.

## Commands (repo root)

```bash
yarn install
yarn build                       # turbo build (framework dist, plugins, backend)
yarn dev                         # backend + plugin watchers
yarn check-types                 # needs built deps; turbo runs ^build first
yarn lint                        # per-workspace lint (warnings only)
yarn check-layers                # dependency layers — fails on violations
yarn constraints                 # dependency versions — fails on drift
yarn gen:plugin <name> [--entity Name]   # scaffold a new plugin

yarn workspace backend dev
yarn workspace backend medusa:db:migrate
yarn workspace @repo/plugin-automotive db:generate        # migration from entity changes
yarn workspace @repo/plugin-automotive test:unit
yarn workspace @repo/plugin-automotive test:integration:http
yarn workspace @repo/framework test
yarn workspace @repo/dashboard test
```

Local infrastructure (Postgres, Redis, MinIO): `docker compose -f infra/docker/docker-compose.infra.yml up -d`.

## Building a capability

1. `yarn gen:plugin invoicing --entity Invoice`, then follow the printed steps.
2. Declare entities with `defineEntity` in `src/modules/<module>/entities/` (scalar Zod schema + `relations: (r) => ({ … })`), add them to `defineEntities` and to the `EntityRegistry` augmentation in `entities/index.ts`.
3. Models: `models/<module>.ts` exports `toModels(entities)` (Medusa only discovers models in non-index files of `models/`).
4. API: list exposed entities in `createEntityRoutes({ module, entities })`; route files and middlewares are one-liners.
5. Admin: one `m.crud(Entity, { label?, steps?, relations? })` per feature in `src/admin/modules/<module>.ts`; the catch-all page declares `items: sidebarItems(module)`.
6. Run `db:generate` after entity changes and commit the migration.

Writes go through the framework's compensating workflows (`createEntitiesWorkflow`, …); DELETE is a soft delete.

## Rules enforced in CI

- **Layers** (`packages/config/eslint/layers.js`): framework never imports UI or plugins; isomorphic framework files never import server code; UI packages and plugin admin code use only isomorphic framework entries and admin-safe Medusa packages (`@medusajs/ui`, `icons`, `admin-sdk`, `js-sdk`, `framework/zod`); only apps import plugins. Type-only imports are always allowed.
- **Versions** (`yarn.config.cjs`): Medusa core packages pinned to one version (change `MEDUSA` there to upgrade), plus React, react-router-dom, zod; every other dependency uses one range across workspaces; internal packages use `workspace:*`.

## Testing

- Jest presets: `@repo/config/jest/base.cjs` (all packages), `@repo/config/jest/medusa.cjs` (apps and plugins).
- `TEST_TYPE` selects the suite: `unit` (`src/**/__tests__/**/*.unit.spec.ts`), `integration:http` (`integration-tests/http/*.spec.ts`), `integration:modules`.
- Integration tests use `medusaIntegrationTestRunner` and a per-worker temp database (dropped afterwards). Admin auth: `adminHeaders(getContainer())` from `@repo/config/jest/medusa-helpers.cjs`.
- Env: committed defaults in `.env.test.example` (match `infra/docker` defaults); put personal overrides in `.env.test` (git-ignored).
- Plugins carry a test-only `medusa-config.ts` that loads their module for the runner.

## Conventions

- Prettier with default settings (no config file); ESLint flat configs extend `@repo/config/eslint/base.js`.
- Plugin source uses relative imports, not `~/…` aliases: the built output keeps aliases and production Node can't resolve them.
- Medusa imports use sub-paths (`@medusajs/framework/utils`, `/workflows-sdk`, `/zod`, …).
- Derive types from schemas: `InferEntity<typeof Entity>`, `z.infer<typeof Schema>`; don't hand-write duplicates.
- Files kebab-case; entities and React components PascalCase; module keys `UPPER_SNAKE_CASE` constants.
- Admin code must not import server code (see Layers); `@repo/dashboard` is admin-only.

## Production notes

- `apps/backend/Dockerfile` (context: repo root) prunes the `backend` workspace, builds with turbo and copies built framework/plugin artifacts next to `node_modules`.
- Medusa enables database SSL in production mode; local databases without SSL need `?sslmode=disable`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
