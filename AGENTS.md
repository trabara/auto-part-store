# AGENTS.md — Coding Agent Reference

ERP SaaS on Medusa v2. Each client (tenant) runs its own Medusa instance. Layers, dependencies pointing down only:

- **application** (`apps/backend`): which domains a tenant runs, via `composeApplication`;
- **domains** (`packages/domains/*`, Medusa plugins): a business capability combining modules (links, cross-module workflows and hooks, queries, storefront routes, admin pages and widgets);
- **modules** (`packages/modules/*`, Medusa modules): one bounded context each (tables, service, admin definition, translations, admin API), reusable by any domain;
- **platform**: `@repo/framework` (SDK) and `@repo/dashboard` (admin UI kit).

## Layout

Turborepo + Yarn 4 (node-modules linker), Node >= 20.

```
apps/backend/                 Medusa app (workspace "backend"): config (composeApplication), scripts, no domain code
packages/framework/           @repo/framework — platform SDK, built to dist/ (cjs for Node, esm for Vite)
packages/ui/dashboard/        @repo/dashboard — admin templates, form engine, data table (source-linked)
packages/modules/<name>/      @repo/module-<name> — reusable Medusa module (today: vehicle, fitment, parts)
packages/domains/<name>/      @repo/domain-<name> — business domain, a Medusa plugin (today: automotive)
packages/config/              @repo/config — tsconfig (incl. module.json), eslint (layers.js, module-boundaries.js), jest presets
packages/tooling/scripts/     @repo/scripts — domain dev watcher, module-db-generate, gen-module, gen-domain
infra/docker, infra/k8s       local infra and Kubernetes manifests (target: Kubernetes on OVHcloud)
```

`@repo/framework` entries: `entity`, `core`, `utils`, `admin`, `medusa` are isomorphic (safe in admin code); `entity/server`, `http`, `orm`, `admin/plugins` are server-only.

Module packages build with `tsc` to CommonJS + declarations in `dist/` (Medusa `require()`s the module and runs `dist/migrations`). Their entries: `.` (the Medusa module, service, types), `/entities` and `/manifest` (isomorphic), `/http` (admin API, server), `/admin` (admin definition + translations), and for UI `/admin/ui` (fitment). Isomorphic and admin entries carry an `import` condition pointing at `src/` so the admin's Vite build compiles them from source (like `@repo/dashboard`); Node and TypeScript use `dist/`. Admin UI files (components, sections) are not built.

## Commands (repo root)

```bash
yarn install
yarn build                       # turbo build (framework, modules, domains, backend)
yarn dev                         # backend + module/domain watchers
yarn check-types                 # needs built deps; turbo runs ^build first
yarn lint                        # per-workspace lint (warnings only)
yarn check-layers                # dependency layers and module boundaries — fails on violations
yarn constraints                 # dependency versions — fails on drift
yarn gen:module <name> [--entity Name] [--path url] [--depends a,b]   # scaffold a module
yarn gen:domain <name> --modules a,b                                  # scaffold a domain over modules

yarn workspace backend dev
yarn workspace backend medusa:db:migrate
yarn workspace @repo/module-vehicle db:generate           # migration from entity changes (per module)
yarn workspace @repo/module-fitment test:unit
yarn workspace @repo/domain-automotive test:unit
yarn workspace @repo/domain-automotive test:integration:http
yarn workspace @repo/framework test
yarn workspace @repo/dashboard test
```

Local infrastructure (Postgres, Redis, MinIO): `docker compose -f infra/docker/docker-compose.infra.yml up -d`.

## Building a capability

1. `yarn gen:module invoicing --entity Invoice --path invoices` (a reusable module), then `yarn gen:domain billing --modules invoicing` (or mount it in an existing domain), and follow the printed steps. The app runs a domain by adding its manifest to `composeApplication({ domains: [...] })` in `apps/backend/medusa-config.ts`; that registers the domain's modules too, dependencies first, and fails at boot on a missing one.
2. Declare entities with `defineEntity` in the module's `src/entities/` (scalar Zod schema + `relations: (r) => ({ … })`), add them to `defineEntities` and to the `EntityRegistry` augmentation in `entities/index.ts`. Optional: `label: { fields, format }` for how records read in pickers, relation cells and titles (fields may traverse relations, e.g. `model.make.name`); `fields.image()` for image URLs with an upload widget. `messages: { unique: [{ on, message }], constraints: { name: message } }` gives readable errors for unique indexes and check / exclusion constraints (unique ones default to "A <entity> with this <columns> already exists."). `derived: { field: { from, compute } }` computes columns on every write (search keys, slugs; filters on them are normalized the same way); `readOnly: [...]` keeps server-managed fields out of the DTOs. Relations to other modules use `r.link(Target)`: stored in a Medusa link table by default, or as an indexed `${key}_id` column with `{ storage: "column" }` plus a read-only `defineLink` in the domain's `src/links/` (preferred for high-volume rows). Medusa models are declared with `defineEntity(Name, { schema, label, external: { module, url } })` so they can be link targets and pickers; the common ones (`ProductVariant`, `ProductOptionValue`, `Customer`) are in `@repo/framework/medusa`.
3. Models: `src/models/<module>.ts` exports `toModels(entities)` (Medusa only discovers models in non-index files of `models/`).
4. API: the module's `src/http.ts` lists exposed entities in `createEntityRoutes({ entities })`; the domain's route files (`src/api/admin/<path>/[entity]/…`) and middlewares mount it in one line each.
5. Admin: each module exports its definition and translations from `@repo/module-<name>/admin` (`src/admin/module.ts`: `defineModule({ path })`, one `m.crud(Entity, { path?, label?, steps?, relations? })` per feature; `src/admin/i18n/`: `defineTranslations(path, { en, fr, ar })`, `fr`/`ar` typed `SameShape<typeof en>` so a missing key fails `tsc`). The domain's `src/admin/i18n/index.ts` exports `toAdminI18n(...modules)`; its route pages mount a module with `translatedMenu(definition)` and `translationNs: "translation"` spelled out (Medusa reads it statically). Labels resolve through `useLabels()` (`entities.<Name>.fields|values`, `modules.<path>.features|steps`). Entity sets declare their API path (`defineEntities(..., { module, path })` → `/admin/<path>/<entity>`), so pickers reach entities of other modules.
6. Run the module's `db:generate` after entity changes and commit the migration.
7. Each module has a `src/manifest.ts` (`defineModuleManifest({ key, dependsOn, resolve })` from `@repo/framework/core`; keep `key` and `dependsOn` literal, the layer check reads them). A module imports only its own files, platform and third-party packages, and the `entities` entry of a module listed in `dependsOn` (`@repo/module-<dep>/entities`); never a domain or a file outside its package. When a module needs something only the domain knows, it declares a port and the domain registers the implementation: e.g. fitment's `provideConditionAttributes(...)` (`@repo/module-fitment/conditions`), fed by the automotive catalog `src/conditions/vehicle-attributes.ts`, registered server-side by `src/workflows/hooks/condition-attributes.ts` and admin-side by `src/admin/setup.ts` (imported by the pages and widgets that edit fitments). A domain lists its modules in `src/manifest.ts` (`defineDomainManifest({ name, resolve, modules })`, export `./manifest`).

Writes go through the framework's compensating workflows (`createEntitiesWorkflow`, …); DELETE is a soft delete. Linked ids (`r.link`) are checked on write: an unknown target is a 400. List routes accept `?q=` (every word must match one of the entity's `search` paths, by default its label's text fields). Records pointing at Medusa models are cleaned up when those are deleted (automotive: `removeOrphansWorkflow` in `src/workflows/remove-orphans.ts`, run by `src/subscribers/medusa-deletions.ts` and the one-off `src/scripts/remove-orphans.ts`). To do more on a write (e.g. keep a Medusa record in sync), register `onEntity(Name, { created, updated, deleting, deleted })` from `@repo/framework/entity/server`: hooks run inside the same workflow step, with compensation. Rules within one module go in the module's `src/hooks.ts` (imported by its `index.ts`) and call its service; hooks spanning modules go in the domain's `src/workflows/hooks/` (Medusa's workflow loader imports them). Server logic lives in module services (one module each: never resolve another module from a service); cross-module logic lives in the domain's workflows, hooks and `src/queries/`; routes only validate, call a service, workflow or query, and respond. Storefront routes live in the domain's `src/api/store/` (Medusa requires a publishable key; only published products in the key's sales channels are returned). Cross-module queries that may move to a search engine sit behind an interface in `src/queries/` (e.g. `FitmentSearch`). Detail pages take extra panels via `<Module sections={{ featureKey: [{ id, render }] }}>` in the domain's admin route page (keep UI code out of module definitions, which tests and the server also load; module UI goes in a separate `/admin/ui` entry); `hideInDetails` in a feature's overrides drops a field from the detail attributes. Admin widgets listing a parent's records use `<EntityPanel module feature parent={{ field, value }} rowActions? />` from `@repo/dashboard/module`.

## Rules enforced in CI

- **Layers** (`packages/config/eslint/layers.js`): framework never imports UI, modules or domains; isomorphic framework files never import server code; UI packages and admin code (domains' `src/admin`, modules' `src/admin`) use only isomorphic framework entries and admin-safe Medusa packages (`@medusajs/ui`, `icons`, `admin-sdk`, `js-sdk`, `framework/zod`); only apps import domains; server code of domains and modules never imports UI packages. Module boundaries (`packages/config/eslint/module-boundaries.js`): modules import only their own files and declared dependencies' `entities` entry, never a domain (see step 7). Type-only imports are always allowed.
- **Versions** (`yarn.config.cjs`): Medusa core packages pinned to one version (change `MEDUSA` there to upgrade), plus React, react-router-dom, zod; every other dependency uses one range across workspaces; internal packages use `workspace:*`.

## Testing

- Jest presets: `@repo/config/jest/base.cjs` (all packages), `@repo/config/jest/medusa.cjs` (apps, modules, domains; maps `@repo/module-*` imports to the modules' `src`).
- `TEST_TYPE` selects the suite: `unit` (`src/**/__tests__/**/*.unit.spec.ts`), `integration:http` (`integration-tests/http/*.spec.ts`), `integration:modules`.
- Integration tests use `medusaIntegrationTestRunner` and a per-worker temp database (dropped afterwards). Admin auth: `adminHeaders(getContainer())` from `@repo/config/jest/medusa-helpers.cjs`.
- Env: committed defaults in `.env.test.example` (match `infra/docker` defaults); put personal overrides in `.env.test` (git-ignored).
- Domains carry a test-only `medusa-config.ts` that loads their modules from source (`src/manifest.ts`), so the runner and the tests share one instance of each module. Module behaviour that needs a database is tested through a domain's integration tests; modules have unit tests.

## Conventions

- Prettier with default settings (no config file); ESLint flat configs extend `@repo/config/eslint/base.js`.
- Domain and module source use relative imports (or package entries), not `~/…` aliases: the built output keeps aliases and production Node can't resolve them.
- Medusa imports use sub-paths (`@medusajs/framework/utils`, `/workflows-sdk`, `/zod`, …).
- Derive types from schemas: `InferEntity<typeof Entity>`, `z.infer<typeof Schema>`; don't hand-write duplicates.
- Files kebab-case; entities and React components PascalCase; module keys `UPPER_SNAKE_CASE` constants.
- Admin code must not import server code (see Layers); `@repo/dashboard` is admin-only.

## Production notes

- `apps/backend/Dockerfile` (context: repo root) prunes the `backend` workspace, builds with turbo and copies built framework, module (`dist`) and domain (`.medusa`) artifacts next to `node_modules`.
- Medusa enables database SSL in production mode; local databases without SSL need `?sslmode=disable`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
