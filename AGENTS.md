# AGENTS.md — snap-store

## Project Overview

Turborepo monorepo for an auto-parts e-commerce platform. Yarn 4 workspaces, Node >= 20.

| Workspace                        | Path                              | Stack                                         |
| -------------------------------- | --------------------------------- | --------------------------------------------- |
| `medusa`                         | `apps/medusa`                     | Medusa v2 (2.13.3) backend, PostgreSQL, Redis |
| `storefront`                     | `apps/storefront`                 | Next.js 16, React 19, Tailwind CSS v4         |
| `@repo/common`                   | `packages/common`                 | Shared controllers, services, schemas         |
| `@repo/ui`                       | `packages/ui`                     | Shared UI components (shadcn/ui style)        |
| `@repo/icons`                    | `packages/icons`                  | Shared SVG icon React components              |
| `@repo/scripts`                  | `packages/scripts`                | Plugin dev scripts (init + watch)             |
| `@repo/tsconfig`                 | `packages/tsconfig`               | Shared TypeScript configs                     |
| `@repo/eslint-config`            | `packages/eslint-config`          | Shared ESLint configs                         |
| `@repo/vehicle-fitment-plugin`   | `plugins/vehicle-fitment-plugin`  | Medusa plugin — vehicle fitment data          |
| `@agilo/medusa-analytics-plugin` | `plugins/medusa-analytics-plugin` | Medusa plugin — analytics (orders, products)  |

## Build / Lint / Test Commands

### Monorepo (from root)

```bash
yarn build           # turbo run build (all workspaces)
yarn dev             # turbo run dev (all workspaces, persistent)
yarn lint            # turbo run lint
yarn format          # prettier --write "**/*.{ts,tsx,md}"
yarn check-types     # turbo run check-types
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

### Tests (Medusa — Jest + SWC)

```bash
yarn workspace medusa test:integration:http       # HTTP integration tests
yarn workspace medusa test:integration:modules    # Module integration tests
yarn workspace medusa test:unit                   # Unit tests

# Single test file — append -- --testPathPattern="<substring>"
yarn workspace medusa test:integration:http -- --testPathPattern="health"
yarn workspace medusa test:unit -- --testPathPattern="make.unit"
```

Test file locations:

- Integration HTTP: `apps/medusa/integration-tests/http/*.spec.ts`
- Module integration: `apps/medusa/src/modules/*/__tests__/**/*.[jt]s`
- Unit tests: `apps/medusa/src/**/__tests__/**/*.unit.spec.[jt]s`

Uses `@medusajs/test-utils` (`medusaIntegrationTestRunner`) for HTTP tests. Setup file clears MikroORM MetadataStorage before each suite.

## Code Style & Formatting

### Prettier (storefront)

Config at `apps/storefront/.prettierrc`: no semicolons, double quotes, 2-space indent, trailing commas `es5`, arrow parens `always`.

### TypeScript

- **Storefront**: Strict, `noUncheckedIndexedAccess`, ES2022, bundler resolution. Path alias: `@/*` → `./src/*`.
- **Medusa / Plugins**: ES2021, Node16 resolution, `strictNullChecks`, decorators enabled.

### ESLint

- Storefront: flat config (`eslint.config.mjs`) — `next/core-web-vitals` + `next/typescript`.
- Shared base (`@repo/eslint-config/base.js`): `@eslint/js` + `typescript-eslint` + Prettier compat. All rules are warnings (via `eslint-plugin-only-warn`).

## Import Conventions

- **Storefront**: Use `@/` alias for all local imports. Group order: `next/*` / `react` → `@/lib/*` → `@/modules/*` → `@repo/*` → third-party → CSS.
- **Medusa / Plugins**: Relative imports for local files; `@medusajs/framework/*` for framework imports; `@repo/common` for shared utilities.

## Naming Conventions

- **Files**: kebab-case (`fitment-module.service.ts`, `product-item.tsx`).
- **React components**: PascalCase function, named export, kebab-case filename.
- **Types / Interfaces**: PascalCase. Interfaces prefixed with `I` (`ILogger`, `IErrorHandler`).
- **Zod schemas**: PascalCase + `Schema` suffix (`MakeSchema`). Input schemas: `CreateMakeInputSchema` → `CreateMakeInput`.
- **Constants**: UPPER_SNAKE_CASE for module keys (`FITMENT_MODULE`); `as const` for enum-like arrays.
- **Services**: PascalCase class + `.service.ts` file. Protected repo members use trailing underscore (`fitmentMakeRepository_`).
- **Controllers**: PascalCase + `Controller` suffix, extending `BaseController`.
- **Workflows / Steps**: kebab-case string IDs (`"create-fitments-workflow"`). Exported function names are camelCase (`createFitmentsWorkflow`).

## React / Next.js Patterns

- **App Router** with `next-intl` i18n. All routes under `[locale]/` segment. Locales: `en` (default), `fr`, `ar` (RTL).
- Pages are `async` server components by default.
- Use `Link`, `redirect`, `usePathname`, `useRouter` from `@/i18n/navigation` (locale-aware wrappers), NOT from `next/link` or `next/navigation` directly.
- Translation messages in `apps/storefront/messages/{en,fr,ar}.json`. Use `getTranslations({ locale, namespace })` server-side.
- `"use server"` directive at top of data-fetching modules (`src/lib/data/*.ts`). Data is fetched via the Medusa JS SDK (`src/lib/config.ts`).
- UI primitives in `packages/ui/` — shadcn/ui style: CVA + Radix + `cn()` from `@repo/ui/lib/utils`.
- Feature modules under `src/modules/{feature}/components/` and `.../templates/`. Templates are page-level compositions; components are reusable.
- **Zustand**: `createStore` from `zustand/vanilla` for SSR-safe stores. Separate `State`, `Actions`, `Store` types. Export `INITIAL_*_STATE` constant. Provider at `src/modules/{feature}/components/provider.tsx`.

### Storefront Route Structure

```
src/app/[locale]/page.tsx              — Home
src/app/[locale]/cart/page.tsx         — Cart
src/app/[locale]/checkout/page.tsx     — Checkout
src/app/[locale]/order/[id]/page.tsx   — Order confirmation
src/app/[locale]/p/[handle]/page.tsx   — Product detail
src/app/[locale]/search/page.tsx       — Search results
src/app/[locale]/[...slug]/page.tsx    — Category product listing
```

## Medusa Backend Patterns

- **API routes**: `src/api/{store|admin}/{resource}/route.ts`. Export named HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`). Each handler instantiates the controller and calls one method.
- **Controllers**: Extend `BaseController` from `@repo/common`. Call `this.execute(async () => { ... }, "log message")`. Use `this.success()`, `this.created()`, `this.noContent()`. Resolve services with `this.req.scope.resolve(MODULE_KEY)`.
- **Modules**: `Module(KEY, { service })` from `@medusajs/framework/utils`. Service extends `MedusaService(Models)`. Export the string key constant (`FITMENT_MODULE = "fitment"`).
- **Data models**: `model.define(name, fields)` from `@medusajs/framework/utils`. Chain `.indexes([...])` for unique constraints, `.checks([...])` for DB-level check constraints.
- **Validation**: Zod schemas via `@medusajs/framework/zod`. Applied as middleware; accessed via `req.validatedBody`.
- **Middlewares**: Per-resource `middlewares.ts` files export arrays, aggregated in `src/api/middlewares.ts` via `defineMiddlewares({ routes: [...] })`.
- **Workflows**: `createWorkflow("id", fn)` + `createStep("id", handler, compensator)` from `@medusajs/framework/workflows-sdk`. Steps return `new StepResponse(data, compensationInput)`. Compensation functions handle rollback.
- **Links**: `defineLink(A.linkable.x, B.linkable.y)` from `@medusajs/framework/utils`. At runtime, resolve `ContainerRegistrationKeys.LINK` and call `link.create({...})`.

## Error Handling

- **Backend**: `BaseController.execute()` wraps in try/catch and delegates to `ApiErrorHandler`, which maps error messages to HTTP codes (404 for "not found" substring, 400/401/403 otherwise, 500 default).
- Throw `new Error("Entity not found")` — the error handler matches on "not found" substring.
- **Storefront**: `medusaError(error)` in `src/lib/util/error.ts` — inspects `error.response` and re-throws with a normalized message. SDK calls chain `.catch(medusaError)`.

## Shared Package (`@repo/common`)

Barrel export from `packages/common/src/index.ts`:

- `BaseController` — abstract class with `execute()`, `success()`, `created()`, `noContent()`, `handleError()`.
- `BaseSchema` / `BASE_MASK` — Zod base schema (id + timestamps). Use `BASE_MASK` with `.omit()` to derive create-input schemas.
- `ILogger` / `MedusaLoggerAdapter` — instantiated via `MedusaLoggerAdapter.fromScope(req.scope, className)`.
- `IErrorHandler` / `ApiErrorHandler` — centralized HTTP error mapping.

## Environment

- `.env` files: `apps/medusa/.env`, `apps/storefront/.env`. Template: `apps/medusa/.env.template`. Test env: `apps/medusa/.env.test`.
- Key vars: `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MINIO_*`, `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

## Docker

```bash
yarn docker:build    # Build containers
yarn docker:up       # Start production (Traefik + PG + Redis + MinIO + Medusa + Storefront)
yarn docker:dev      # Start development (with dev overrides)
yarn docker:down     # Stop containers
```

Services routed via Traefik: `api.localhost` (Medusa), `shop.localhost` (Storefront), `minio.localhost` (MinIO).

## Terraform IaC

Infrastructure as Code for deploying to Railway (PaaS). Located in `iac/railway/`.

### Setup

```bash
# Set Railway token
export RAILWAY_TOKEN="your-token"

# Initialize
cd iac/railway
terraform init

# Plan/Apply
terraform plan
terraform apply
```

### Configuration

Create `terraform.tfvars` to customize:

```hcl
project_name          = "snap-store"
environment_name      = "production"
medusa_github_repo    = "your-org/snap-store"
storefront_github_repo = "your-org/snap-store"
```

### Resources Created

- **Project**: Railway project
- **Environment**: Production environment
- **PostgreSQL**: Database (template: `railwayapp-templates/postgres-ssl`)
- **Redis**: Cache/events (template: `redis`)
- **Medusa**: Backend API service
- **Storefront**: Next.js frontend
- **TCP Proxies**: External access to services

See `iac/railway/README.md` for full details.
