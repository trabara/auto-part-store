# AGENTS.md — snap-store

## Project Overview

Turborepo monorepo for an auto-parts e-commerce platform. Yarn 4 workspaces, Node >= 20.

| Workspace                      | Path                             | Stack                                         |
| ------------------------------ | -------------------------------- | --------------------------------------------- |
| `medusa`                       | `apps/medusa`                    | Medusa v2 (2.13.1) backend, PostgreSQL, Redis |
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
yarn clean           # remove all node_modules, .turbo, .medusa
```

### Storefront (`apps/storefront`)

```bash
yarn workspace storefront dev        # next dev
yarn workspace storefront build      # next build
yarn workspace storefront lint       # eslint (flat config, next/core-web-vitals + next/typescript)
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

# Single test file (append -- followed by a path pattern)
yarn workspace medusa test:integration:http -- --testPathPattern="health"
yarn workspace medusa test:unit -- --testPathPattern="some-file"
```

Test file conventions:

- Integration HTTP: `apps/medusa/integration-tests/http/*.spec.ts`
- Module integration: `apps/medusa/src/modules/*/__tests__/**/*.[jt]s`
- Unit tests: `apps/medusa/src/**/__tests__/**/*.unit.spec.[jt]s`

Uses `@medusajs/test-utils` (`medusaIntegrationTestRunner`) for integration tests.
Jest config: `apps/medusa/jest.config.js`. Setup file clears MikroORM MetadataStorage.

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
- 2-space indent
- Trailing commas: `es5`
- Arrow parens: `always`

Root `yarn format` uses Prettier for `**/*.{ts,tsx,md}`.

### TypeScript

**Storefront**: Extends `@repo/tsconfig/nextjs.json` — strict mode, `noUncheckedIndexedAccess`, ES2022 target, bundler module resolution. Path alias: `@/*` -> `./src/*`.

**Medusa backend**: ES2021 target, Node16 module resolution, `strictNullChecks`, decorators enabled, JSX react-jsx.

**Plugins**: Same as Medusa backend config (decorators, Node16 resolution).

### ESLint

- Storefront: Flat config (`eslint.config.mjs`) with `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- Shared base: `@repo/eslint-config/base.js` — `@eslint/js` recommended + `typescript-eslint` recommended + Prettier compat + turbo plugin. All rules downgraded to warnings via `eslint-plugin-only-warn`.

### Import Conventions

- Storefront: Use `@/` path alias for all local imports (e.g., `@/lib/data/products`, `@/components/ui/button`).
- Medusa/Plugins: Relative imports for local files, `@medusajs/framework/*` for framework imports.
- Group order (observed pattern): framework/external imports first, then local `@/` or relative imports. No enforced sorting rule.

### Naming Conventions

- **Files**: kebab-case for all files (`fitment-module.service.ts`, `base.controller.ts`, `product-item.tsx`).
- **React components**: PascalCase function names, exported as named exports. File names are kebab-case.
- **Types/Interfaces**: PascalCase. Prefix interfaces with `I` (`ILogger`, `IErrorHandler`). Zod schemas use PascalCase with `Schema` suffix (`MakeSchema`, `CreateMakeInputSchema`). Inferred types match schema name without suffix (`Make`, `CreateMakeInput`).
- **Constants**: UPPER_SNAKE_CASE for module identifiers (`FITMENT_MODULE`), `as const` arrays for enum-like values.
- **Services**: PascalCase class name with descriptive suffix (`.service.ts`). Protected members use trailing underscore (`fitmentMakeRepository_`).
- **Controllers**: PascalCase class name with `Controller` suffix. Extend `BaseController` from `@repo/common`.

### React / Next.js Patterns

- Storefront uses Next.js App Router. Pages are async server components by default.
- `"use server"` directive for data-fetching modules (e.g., `src/lib/data/*.ts`).
- UI components in `src/components/ui/` — shadcn/ui style with CVA + Radix primitives + `cn()` utility.
- Feature modules organized under `src/modules/{feature}/components/` and `src/modules/{feature}/templates/`.
- Templates are page-level compositions; components are reusable pieces.
- Styling: Tailwind CSS v4 utility classes. Use `cn()` from `@/lib/util/cn` for conditional classes.
- State management: Zustand for client state.

### Medusa Backend Patterns

- **API routes**: File-based routing under `src/api/{store|admin}/{resource}/route.ts`. Export named HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`).
- **Controllers**: Instantiate controller in route handler, call method. Controllers extend `BaseController` (from `@repo/common`) which provides `execute()`, `success()`, `created()`, `noContent()`, `handleError()`.
- **Modules**: Defined with `Module()` from `@medusajs/framework/utils`. Service class extends `MedusaService(Models)`. Export module key constant (e.g., `FITMENT_MODULE`).
- **Data models**: Use `model.define()` from `@medusajs/framework/utils` with chained `.indexes()`.
- **Validation**: Zod schemas via `@medusajs/framework/zod`. Middleware applies validation to routes.
- **Middlewares**: Defined per resource in `middlewares.ts`, aggregated in `src/api/middlewares.ts` via `defineMiddlewares()`.
- **Workflows**: Use `createWorkflow` / `createStep` from `@medusajs/framework/workflows-sdk`. Steps include compensation functions for rollback.
- **Links**: Module links for cross-module relationships via `@medusajs/framework/modules-sdk` `Link`.

### Error Handling

- Backend: `BaseController.execute()` wraps actions in try/catch. `ApiErrorHandler` maps error types to HTTP status codes (404/400/401/403/500). Errors are logged with context.
- Storefront: `medusaError()` utility in `src/lib/util/error.ts` classifies Axios-style errors and re-throws with formatted messages.
- Throw `new Error("Entity not found")` for not-found cases — the error handler detects "not found" in the message.

### Shared Package (`@repo/common`)

Barrel export from `packages/common/src/index.ts`. Contains:

- `BaseController` — abstract controller with error handling, logging, response helpers.
- `BaseSchema` / `BASE_MASK` — Zod base schema with id, timestamps. `BASE_MASK` used for `.omit()` on create inputs.
- `ILogger` / `MedusaLoggerAdapter` — logging abstraction.
- `IErrorHandler` / `ApiErrorHandler` — centralized error handling.

## Environment

- `.env` files at `apps/medusa/.env` and `apps/storefront/.env`. Template at `apps/medusa/.env.template`.
- Test env: `apps/medusa/.env.test`.
- Key env vars: `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MINIO_*`, `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

## Docker

```bash
yarn docker:build    # Build containers
yarn docker:up       # Start production
yarn docker:dev      # Start development (with dev overrides)
yarn docker:down     # Stop containers
```

Config in `docker/` directory.
