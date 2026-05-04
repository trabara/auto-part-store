# AGENTS.md — Coding Agent Reference

## Project Structure

Turborepo monorepo. **Package manager:** Yarn 4 Berry (node-modules linker). **Node >= 20.**

```
apps/backend/          — Medusa v2 backend (workspace name: **backend**, NOT medusa)
apps/storefront/       — Next.js 16 storefront (React 19, Tailwind v4, next-intl)
packages/core/         — @trabara/core: schemas, dtos, validations, contracts, interfaces
packages/common/       — @trabara/common: BaseController, error handler, logger
packages/domain/plugins/  — @repo/{fitment,rbac,invoice,media,analytics}-plugin (Medusa plugins)
packages/domain/modules/  — @repo/domain-modules: shared models used across plugins
packages/ui/admin/     — @repo/admin (source-linked, no build)
packages/ui/hooks/     — @repo/hooks (source-linked, no build)
packages/ui/icons/     — @repo/icons (source-linked, no build)
packages/config/tsconfig/    — @repo/tsconfig
packages/config/eslint-config/ — @repo/eslint-config
packages/tooling/scripts/    — @repo/scripts (plugin-dev-init, plugin-dev-watch)
```

---

## Commands (run from repo root unless noted)

```bash
yarn install                          # install deps
yarn build                            # build all packages + apps
yarn check-types                      # type-check all packages
yarn lint                             # lint all packages
yarn format                           # prettier --write **/*.{ts,tsx,md}
yarn dev                              # dev (backend + storefront hot reload)
yarn clean                            # remove node_modules, .turbo, .next, .medusa

# Backend (workspace name is "backend")
yarn workspace backend dev
yarn workspace backend build
yarn workspace backend medusa:db:migrate
yarn workspace backend medusa:db:generate
yarn workspace backend seed
yarn workspace backend medusa:user:create  # creates admin@example.com / supersecret

# Storefront
yarn workspace storefront dev
yarn workspace storefront build

# Plugin dev (syncs built output into apps/backend)
yarn workspace @repo/fitment-plugin build
yarn workspace @repo/fitment-plugin dev
```

---

## Testing

Tests live in **`apps/backend`** and **`packages/domain/plugins/*`**. No storefront tests.

```bash
# Backend — run from repo root
yarn workspace backend test:unit
yarn workspace backend test:integration:http
yarn workspace backend test:integration:modules

# Single test file — run from apps/backend/
TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules npx jest \
  --testPathPattern="path/to/my.unit.spec.ts" --runInBand --forceExit --passWithNoTests

TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules npx jest \
  --testPathPattern="path/to/my.spec.ts" --runInBand --forceExit

# Plugin tests (fitment/invoice/media have all three; rbac/analytics only have test:unit)
yarn workspace @repo/fitment-plugin test:unit
yarn workspace @repo/fitment-plugin test:integration:http
yarn workspace @repo/fitment-plugin test:integration:modules
yarn workspace @repo/rbac-plugin test:unit
```

**Test runner:** Jest 29 + `@swc/jest`. Environment: `node`.

`TEST_TYPE` controls which glob jest uses:

| `TEST_TYPE`           | Glob                                       |
| --------------------- | ------------------------------------------ |
| `unit`                | `**/src/**/__tests__/**/*.unit.spec.[jt]s` |
| `integration:http`    | `**/integration-tests/http/*.spec.[jt]s`   |
| `integration:modules` | `**/src/modules/*/__tests__/**/*.[jt]s`    |

- Integration tests use `medusaIntegrationTestRunner` from `@medusajs/test-utils`. The `afterAll` in `integration-tests/setup.js` drops the temp DB via `pg-god`.
- Required env vars for tests come from `.env.test` (backend) or `integration-tests/setup-env.js` (plugins).
- **Plugins have two `.env.test` files**: root-level (`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`) and `integration-tests/.env.test` (loaded by `setup-env.js` — adds `LOG_LEVEL=error`). Both must exist.
- `DB_TEMP_NAME` is NOT in any `.env.test` — auto-generated as `medusa-integration-{workerId}-{chunk}`. If a test run is killed, stale DBs matching this pattern may be left on Postgres.
- Backend `.env.test` uses explicit `DB_PORT=5432`; plugin `.env.test` files do not set `DB_PORT`.
- `rbac` and `analytics` plugins only have `test:unit` — no integration test scripts.

---

## Code Style

**Prettier** (`.prettierrc`): `semi: false`, `singleQuote: false`, `tabWidth: 2`, `trailingComma: "es5"`, `arrowParens: "always"`.

**ESLint v9 flat config** (`eslint.config.mjs` in each workspace):

- Backend/plugins extend `@repo/eslint-config/base` (`@typescript-eslint/recommended` + `turbo` plugin + `eslint-config-prettier`)
- Storefront extends `@repo/eslint-config/next-js` (wraps `@next/eslint-plugin-next`)
- All violations are **warnings** via `eslint-plugin-only-warn` — zero errors policy
- Each workspace's `eslint.config.mjs` adds: `@typescript-eslint/no-explicit-any: "off"` — `any` is allowed everywhere
- Unused vars rule: `@typescript-eslint/no-unused-vars: ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]`

---

## TypeScript

| Context           | Config                                               | Key settings                                                                                                        |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Backend / plugins | `packages/config/tsconfig/plugin.json`               | `target: ES2021`, `module: Node16`, `strictNullChecks: true`, `emitDecoratorMetadata: true`, out: `.medusa/server/` |
| Storefront        | `packages/config/tsconfig/nextjs.json` → `base.json` | `strict: true`, `noUncheckedIndexedAccess: true`, `module: ESNext`, `moduleResolution: Bundler`, `noEmit: true`     |
| `@trabara/core`   | own `tsconfig.json` + `tsconfig.esm.json`            | dual CJS + ESM output                                                                                               |

**Conventions:**

- Prefer `import type { Foo }` for type-only imports
- Derive types from Zod: `type Foo = z.infer<typeof FooSchema>` — never hand-write duplicates
- Use `Infer<typeof Model>` from `@medusajs/framework/types` for data model types
- Name types: `*Input`, `*Output`, `*Params`, `*Response`
- **Never re-export types from `"use server"` files** — Next.js/Turbopack treats all named exports as callable server actions; type-only re-exports produce no runtime value and fail the build

---

## Import Conventions

- Order: external packages → `@repo/*` / `@trabara/*` workspace packages → relative
- Storefront: use `@/` alias (maps to `src/`); never use relative paths crossing module boundaries
- Medusa framework: always use sub-path imports:
  ```ts
  import {
    createWorkflow,
    WorkflowResponse,
  } from "@medusajs/framework/workflows-sdk";
  import {
    MedusaService,
    InjectManager,
    MedusaContext,
  } from "@medusajs/framework/utils";
  import { model } from "@medusajs/framework/utils";
  import { z } from "@medusajs/framework/zod";
  import {
    createFindParams,
    createOperatorMap,
  } from "@medusajs/medusa/api/utils/validators";
  ```
- `@trabara/core` sub-paths: `@trabara/core/schemas`, `/dtos`, `/validations`, `/contracts`, `/interfaces`, `/infra`
- `@trabara/common` for `BaseController`, `ILogger`, `IErrorHandler`

---

## Naming Conventions

| Construct                | Convention               | Example                     |
| ------------------------ | ------------------------ | --------------------------- |
| Files                    | `kebab-case`             | `fitment-module.service.ts` |
| Classes                  | `PascalCase`             | `FitmentModuleService`      |
| Interfaces               | `IPascalCase`            | `IFitmentCrud`              |
| Functions / methods      | `camelCase`              | `createFitments`            |
| React components         | `PascalCase`             | `ProductGridItem`           |
| Zod schemas              | `PascalCaseSchema`       | `CreateFitmentInputSchema`  |
| Zod-inferred types       | `PascalCase` (same name) | `CreateFitmentInput`        |
| Medusa workflows         | `camelCaseWorkflow`      | `createFitmentsWorkflow`    |
| Medusa workflow steps    | `camelCaseStep`          | `createFitmentsStep`        |
| Medusa models            | `PascalCase`             | `AuthzRole`                 |
| Constants / module keys  | `UPPER_SNAKE_CASE`       | `FITMENT_MODULE`            |
| Private class properties | trailing underscore      | `fitmentRepository_`        |

---

## Architecture Patterns

### Backend / Plugin structure

```
packages/domain/plugins/<name>/src/
  modules/<name>/
    index.ts          ← exports module definition, service, MODULE_KEY
    constant.ts       ← UPPER_SNAKE_CASE module key
    schema.ts         ← all Zod schemas + inferred types (co-located)
    models/           ← model.define(...)
    services/         ← extends MedusaService(Models)
    migrations/       ← Migration*.ts
  workflows/
    create-foo.ts     ← createStep + createWorkflow (compensation included)
  api/<scope>/<resource>/
    route.ts          ← thin: new FooController(req, res).method()
    middlewares.ts    ← validateAndTransformBody/Query + Zod schema
  api/_controllers/
    foo.controller.ts ← extends BaseController from @trabara/common
```

- Route files are always thin — only instantiate the controller and delegate
- Services: public methods use `@InjectManager`, private implementations use `@InjectTransactionManager`
- Workflow steps always include a compensation function as the third argument to `createStep`
- Shared models reused across plugins live in `packages/domain/modules/` (`@repo/domain-modules`)
- Plugins build to `.medusa/server/` (not `dist/`). Build command: `medusa plugin:build`.
- **Turbo `dev` depends on `^dev:init`** — plugins must complete `dev:init` (outputs `.medusa/server/**`) before running `dev`. Run `yarn workspace @repo/<name>-plugin dev:init` first if the output directory is missing.
- **Vite deduplication**: `medusa-config.ts` force-dedupes `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-i18next`. Any new plugin contributing admin UI must not bundle its own copy of these — omit them from its bundle or the admin will crash with "No QueryClient / not in Router context".

### Error handling (backend)

```ts
// In a controller method:
async create(): Promise<void> {
  await this.execute(async () => {
    const input = CreateFooSchema.parse(this.req.validatedBody)
    const service = this.req.scope.resolve<FooService>(FOO_MODULE)
    const result = await service.createFoo(input)
    this.created({ foo: result })
  }, "Foo created")
}
```

- `this.execute()` catches all errors and delegates to `ApiErrorHandler`
- Response helpers: `this.success(data)`, `this.created(data)`, `this.noContent()`, `this.notFound(msg)`, `this.badRequest(msg)`, `this.unauthorized(msg)`, `this.forbidden(msg)`
- Log via `this.logger.info(...)` / `this.logger.error(...)` — never `console.log`

### Storefront patterns

- All pages under `src/app/[locale]/` (Next.js App Router + `next-intl`)
- Server actions in `src/lib/data/` marked `"use server"` — only export async functions, never types
- Client components marked `"use client"` at top of file
- UI primitives: `src/components/ui/` (shadcn/ui: Radix + CVA + Tailwind v4)
- Domain modules: `src/modules/<domain>/` (components, hooks, templates, store)
- Global client state: **Zustand** vanilla store (`createStore`)
- Server state / infinite scroll: **React Query** via `@repo/hooks`
- SDK calls: `sdk.client.fetch(...)` from `@medusajs/js-sdk`

---

## Environment Variables

| File                     | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `apps/backend/.env`      | Backend runtime (copy from `.env.template`) |
| `apps/backend/.env.test` | Test DB credentials + JWT secret            |
| `apps/storefront/.env`   | Storefront (`NEXT_PUBLIC_*` vars)           |

Key backend vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `MINIO_*`, `TENANT_NAME`.

---

## CI / CD

- **CI** (`.github/workflows/ci.yml`): triggers on PRs to `main`/`develop` only. Runs `yarn lint` + `yarn check-types`; Docker build+push to `obha507/{medusa,storefront}` only on non-PR events (i.e., merge).
- **Deploy** (`.github/workflows/deploy.yml`): manual `workflow_dispatch` only. Uses Terraform at `iac/railway/`. Generates secrets at deploy time via `openssl rand`.
- **Release** (`.github/workflows/release.yml`): triggers on push to `main`. Uses changesets; publishes packages to GitHub Packages (`https://npm.pkg.github.com`) under `@trabara` scope. Requires `NODE_AUTH_TOKEN=${{ secrets.GITHUB_TOKEN }}`.
- Turbo remote cache: `TURBO_TEAM` + `TURBO_TOKEN` build args
