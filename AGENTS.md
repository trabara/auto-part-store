# AGENTS.md — Coding Agent Reference

## Project Structure

Turborepo monorepo. **Package manager:** Yarn 4 Berry (node-modules linker). **Node >= 20.**

```
apps/backend/          — Medusa v2 backend (workspace name: medusa)
apps/storefront/       — Next.js 16 storefront (React 19, Tailwind v4, next-intl)
packages/core/         — @trabara/core: schemas, dtos, validations, contracts, interfaces
packages/domain/       — @repo/{fitment,rbac,invoice,analytics}-plugin (Medusa plugins)
packages/infra/common/ — @repo/common: BaseController, error handler, logger
packages/infra/cache/  — @trabara/cache
packages/infra/queue/  — @trabara/queue
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

# Backend (workspace name is "medusa")
yarn workspace medusa dev
yarn workspace medusa build
yarn workspace medusa medusa:db:migrate
yarn workspace medusa medusa:db:generate
yarn workspace medusa seed
yarn workspace medusa medusa:user:create   # creates admin@example.com / supersecret

# Storefront
yarn workspace storefront dev
yarn workspace storefront build

# Plugin dev (syncs built output into apps/backend)
yarn workspace @repo/fitment-plugin build
yarn workspace @repo/fitment-plugin dev
```

---

## Testing

Tests live in **`apps/backend`** and **`packages/domain/*`**. No storefront tests.

```bash
# Backend — run from repo root
yarn workspace medusa test:unit
yarn workspace medusa test:integration:http
yarn workspace medusa test:integration:modules

# Single test file — run from apps/backend/
TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules npx jest \
  --testPathPattern="path/to/my.unit.spec.ts" --runInBand --forceExit

TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules npx jest \
  --testPathPattern="path/to/my.spec.ts" --runInBand --forceExit

# Plugin tests (each plugin has its own jest.config.js)
yarn workspace @repo/rbac-plugin test:unit
yarn workspace @repo/fitment-plugin test:integration:http
```

- **Test runner:** Jest 29 + `@swc/jest`. Environment: `node`.
- `TEST_TYPE` controls which glob jest uses: `unit` → `src/**/__tests__/**/*.unit.spec.[jt]s`, `integration:http` → `integration-tests/http/*.spec.[jt]s`
- Integration tests use `medusaIntegrationTestRunner` from `@medusajs/test-utils`. The `afterAll` in `integration-tests/setup.js` drops the temp DB via `pg-god`.
- Required env vars for tests come from `.env.test` (backend) or `integration-tests/setup-env.js` (plugins).

---

## Code Style

**Prettier** (`.prettierrc`): `semi: false`, `singleQuote: false`, `tabWidth: 2`, `trailingComma: "es5"`, `arrowParens: "always"`.

**ESLint v9 flat config** (`.mjs` files):

- Backend/plugins extend `@repo/eslint-config` (`@typescript-eslint/recommended` + `turbo` plugin)
- Storefront uses `eslint-config-next`
- All violations are **warnings** via `eslint-plugin-only-warn` — zero errors policy
- `@typescript-eslint/no-explicit-any` is **off** — `any` is allowed
- Unused vars/args prefixed with `_` are ignored

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
- `@repo/common` for `BaseController`, `ILogger`, `IErrorHandler`

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
src/
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
  _controllers/
    foo.controller.ts ← extends BaseController from @repo/common
```

- Route files are always thin — only instantiate the controller and delegate
- Services: public methods use `@InjectManager`, private implementations use `@InjectTransactionManager`
- Workflow steps always include a compensation function as the third argument to `createStep`

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

- **CI** (`.github/workflows/ci.yml`): `yarn lint` + `yarn check-types` on PRs; Docker build+push to `obha507/{medusa,storefront}` on merge
- **Deploy** (`.github/workflows/deploy.yml`): Railway via Terraform
- Turbo remote cache: `TURBO_TEAM` + `TURBO_TOKEN` build args
