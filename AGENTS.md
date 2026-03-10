# AGENTS.md — snap-store

## Project Overview

Turborepo monorepo for an auto-parts e-commerce platform. Yarn 4 workspaces, Node >= 20.

| Workspace                      | Path                             | Stack                                         |
| ------------------------------ | -------------------------------- | --------------------------------------------- |
| `medusa`                       | `apps/medusa`                    | Medusa v2 (2.13.3) backend, PostgreSQL, Redis |
| `storefront`                   | `apps/storefront`                | Next.js 16, React 19, Tailwind CSS v4         |
| `@repo/common`                 | `packages/common`                | Shared controllers, services, schemas         |
| `@repo/ui`                     | `packages/ui`                    | Shared UI components                          |
| `@repo/tsconfig`               | `packages/tsconfig`              | Shared TypeScript configs                     |
| `@repo/eslint-config`          | `packages/eslint-config`         | Shared ESLint configs                         |
| `@repo/vehicle-fitment-plugin` | `plugins/vehicle-fitment-plugin` | Medusa plugin — vehicle fitment data          |

## Build / Lint / Test Commands

### Monorepo-wide (from root)

```bash
yarn build           # turbo run build (all workspaces)
yarn dev             # turbo run dev (all workspaces, persistent)
yarn lint            # turbo run lint
yarn format          # prettier --write "**/*.{ts,tsx,md}"
yarn check-types     # turbo run check-types
yarn clean           # remove node_modules, .turbo, .medusa, .next
```

### Storefront (`apps/storefront`)

```bash
yarn workspace storefront dev        # next dev
yarn workspace storefront build      # next build
yarn workspace storefront lint       # eslint (flat config)
```

### Medusa backend (`apps/medusa`)

```bash
yarn workspace medusa dev            # medusa develop
yarn workspace medusa build          # medusa build
yarn workspace medusa seed           # medusa exec ./src/scripts/seed.ts
```

### Tests (Medusa only — Jest + SWC)

```bash
# All integration HTTP tests
yarn workspace medusa test:integration:http

# All module integration tests
yarn workspace medusa test:integration:modules

# All unit tests
yarn workspace medusa test:unit

# Single test file — append -- --testPathPattern="<substring>"
yarn workspace medusa test:integration:http -- --testPathPattern="health"
yarn workspace medusa test:unit -- --testPathPattern="make.unit"
```

Test file conventions:

- Integration HTTP: `apps/medusa/integration-tests/http/*.spec.ts`
- Module integration: `apps/medusa/src/modules/*/__tests__/**/*.[jt]s`
- Unit tests: `apps/medusa/src/**/__tests__/**/*.unit.spec.[jt]s`

Uses `@medusajs/test-utils` (`medusaIntegrationTestRunner`) for HTTP integration tests.
Jest config: `apps/medusa/jest.config.js`. Setup file (`integration-tests/setup.js`) clears MikroORM MetadataStorage before each suite.

### Plugins

```bash
yarn workspace @repo/vehicle-fitment-plugin build   # medusa plugin:build
yarn workspace @repo/vehicle-fitment-plugin dev     # medusa plugin:develop
```

## Code Style & Formatting

### Prettier (storefront)

Config at `apps/storefront/.prettierrc`:

- No semicolons (`"semi": false`)
- Double quotes (`"singleQuote": false`)
- 2-space indent, trailing commas `es5`, arrow parens `always`

Root `yarn format` runs Prettier over `**/*.{ts,tsx,md}`.

### TypeScript

**Storefront**: Extends `@repo/tsconfig/nextjs.json` — strict, `noUncheckedIndexedAccess`, ES2022, bundler resolution. Path alias: `@/*` → `./src/*`.

**Medusa / Plugins**: ES2021, Node16 resolution, `strictNullChecks`, decorators enabled.

### ESLint

- Storefront: flat config (`eslint.config.mjs`) with `next/core-web-vitals` + `next/typescript`.
- Shared base (`@repo/eslint-config/base.js`): `@eslint/js` + `typescript-eslint` + Prettier compat + turbo plugin. All rules are warnings (via `eslint-plugin-only-warn`).

## Import Conventions

- **Storefront**: Use `@/` alias for all local imports. Group order (observed): `next/*` → `@/lib/*` → `@/modules/*` → `@repo/*` → third-party (lucide-react, etc.) → CSS.
- **Medusa / Plugins**: Relative imports for local files; `@medusajs/framework/*` for framework imports; `@repo/common` for shared utilities.
- No enforced sort order beyond the above grouping.

## Naming Conventions

- **Files**: kebab-case (`fitment-module.service.ts`, `product-item.tsx`).
- **React components**: PascalCase function, named export, kebab-case filename.
- **Types / Interfaces**: PascalCase. Interfaces prefixed with `I` (`ILogger`, `IErrorHandler`).
- **Zod schemas**: PascalCase + `Schema` suffix (`MakeSchema`). Inferred type matches name without suffix (`Make`). Input schemas: `CreateMakeInputSchema` → `CreateMakeInput`.
- **Constants**: UPPER_SNAKE_CASE for module keys (`FITMENT_MODULE`); `as const` for enum-like arrays.
- **Services**: PascalCase class + `.service.ts` file. Protected repo members use trailing underscore (`fitmentMakeRepository_`).
- **Controllers**: PascalCase + `Controller` suffix, extending `BaseController`.
- **Workflows / Steps**: kebab-case string IDs (`"create-fitments-workflow"`, `"create-fitments-step"`). Exported function names are camelCase (`createFitmentsWorkflow`, `createFitmentsStep`).

## React / Next.js Patterns

- App Router. Pages are `async` server components by default.
- `"use server"` directive at top of data-fetching modules (`src/lib/data/*.ts`).
- UI primitives in `src/components/ui/` — shadcn/ui style: CVA + Radix + `cn()` from `@/lib/util/cn` (or `@repo/ui/lib/utils`).
- Feature modules under `src/modules/{feature}/components/` and `.../templates/`. Templates are page-level compositions; components are reusable.
- Tailwind CSS v4 utility classes. Custom container class: `snap-container`.
- **Zustand**: use `createStore` from `zustand/vanilla` for SSR-safe stores (not the hook-based `create`). Separate `State`, `Actions`, and combined `Store` types. Export `INITIAL_*_STATE` constant.

## Medusa Backend Patterns

- **API routes**: `src/api/{store|admin}/{resource}/route.ts`. Export named HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`). Each handler instantiates the controller and calls one method.
- **Controllers**: Extend `BaseController` from `@repo/common`. Call `this.execute(async () => { ... }, "log message")`. Use `this.success()`, `this.created()`, `this.noContent()`. Resolve services with `this.req.scope.resolve(MODULE_KEY)`.
- **Modules**: `Module(KEY, { service })` from `@medusajs/framework/utils`. Service extends `MedusaService(Models)`. Export the string key constant (`FITMENT_MODULE = "fitment"`).
- **Data models**: `model.define(name, fields)` from `@medusajs/framework/utils`. Chain `.indexes([...])` for unique constraints, `.checks([...])` for DB-level check constraints.
- **Validation**: Zod schemas via `@medusajs/framework/zod`. Applied as middleware; accessed via `req.validatedBody`.
- **Middlewares**: Per-resource `middlewares.ts` files export arrays, aggregated in `src/api/middlewares.ts` via `defineMiddlewares({ routes: [...] })`.
- **Workflows**: `createWorkflow("id", fn)` + `createStep("id", handler, compensator)` from `@medusajs/framework/workflows-sdk`. Steps return `new StepResponse(data, compensationInput)`. Workflows return `new WorkflowResponse(data)`. Compensation functions handle rollback.
- **Links**: `defineLink(A.linkable.x, B.linkable.y)` from `@medusajs/framework/utils` for module relationship definitions. At runtime, resolve `ContainerRegistrationKeys.LINK` and call `link.create({...})`.

## Error Handling

- **Backend**: `BaseController.execute()` wraps actions in try/catch and delegates to `ApiErrorHandler`, which maps error messages to HTTP codes (404 for "not found", 400/401/403 otherwise, 500 default). Log context includes method, path, params.
- Throw `new Error("Entity not found")` — the error handler matches on "not found" substring.
- **Storefront**: `medusaError(error)` in `src/lib/util/error.ts` — inspects `error.response` (Axios-style) and re-throws with a normalized message.

## Shared Package (`@repo/common`)

Barrel export from `packages/common/src/index.ts`:

- `BaseController` — abstract class with `execute()`, `success()`, `created()`, `noContent()`, `handleError()`.
- `BaseSchema` / `BASE_MASK` — Zod base schema (id + timestamps). Use `BASE_MASK` with `.omit()` to derive create-input schemas.
- `ILogger` / `MedusaLoggerAdapter` — logging abstraction; instantiated from `req.scope` via `MedusaLoggerAdapter.fromScope(req.scope, className)`.
- `IErrorHandler` / `ApiErrorHandler` — centralized HTTP error mapping.

## Environment

- `.env` files: `apps/medusa/.env`, `apps/storefront/.env`. Template: `apps/medusa/.env.template`. Test env: `apps/medusa/.env.test`.
- Key vars: `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MINIO_*`, `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

## Docker

```bash
yarn docker:build    # Build containers
yarn docker:up       # Start production
yarn docker:dev      # Start development (with dev overrides)
yarn docker:down     # Stop containers
```

Config in `docker/` directory. Dev compose file is `docker/docker-compose.dev.yml`.
