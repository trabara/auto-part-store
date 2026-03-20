# AGENTS.md — smap-store

Turborepo monorepo for auto-parts e-commerce. Yarn 4 workspaces, Node >= 20.

## Workspace Overview

| Workspace                        | Path                              | Stack                                 |
| -------------------------------- | --------------------------------- | ------------------------------------- |
| `medusa`                         | `apps/medusa`                     | Medusa v2 (2.13.3), PostgreSQL, Redis |
| `storefront`                     | `apps/storefront`                 | Next.js 16, React 19, Tailwind CSS v4 |
| `@repo/common`                   | `packages/common`                 | Shared controllers, services          |
| `@repo/ui`                       | `packages/ui`                     | UI components (shadcn/ui)             |
| `@repo/icons`                    | `packages/icons`                  | SVG icons                             |
| `@repo/vehicle-fitment-plugin`   | `plugins/vehicle-fitment-plugin`  | Fitment data                          |
| `@agilo/medusa-analytics-plugin` | `plugins/medusa-analytics-plugin` | Analytics                             |

## Build/Lint/Test Commands

```bash
# Monorepo
yarn build           # turbo run build
yarn dev             # turbo run dev
yarn lint            # turbo run lint (storefront only)
yarn format          # prettier --write "**/*.{ts,tsx,md}"
yarn check-types     # turbo run check-types
yarn clean           # remove node_modules, .turbo, .medusa, .next

# Storefront
yarn workspace storefront dev        # next dev (http://localhost:3000)
yarn workspace storefront lint        # eslint
yarn workspace storefront check-types # tsc

# Medusa
yarn workspace medusa dev            # medusa develop (http://localhost:9000)
yarn workspace medusa seed           # run seed script

# Docker
yarn docker:build    # Build containers
yarn docker:up       # Start production
yarn docker:dev      # Start dev environment
yarn docker:down     # Stop containers
```

Services: `api.localhost` (Medusa), `shop.localhost` (Storefront), `minio.localhost` (MinIO).

### Running Tests (Medusa)

```bash
# HTTP integration tests
yarn workspace medusa test:integration:http -- --testPathPattern="health"

# Module integration tests
yarn workspace medusa test:integration:modules -- --testPathPattern="cart"

# Unit tests
yarn workspace medusa test:unit -- --testPathPattern="make.unit"

# Running a single test file:
yarn workspace medusa test:integration:http -- --testPathPattern="health.spec"
yarn workspace medusa test:integration:modules -- --testPathPattern="cart/confirm"
yarn workspace medusa test:unit -- --testPathPattern="make.unit"
```

Test locations: HTTP: `apps/medusa/integration-tests/http/*.spec.ts`, Modules: `apps/medusa/src/modules/*/__tests__/**`, Unit: `apps/medusa/src/**/__tests__/**/*.unit.spec.[jt]s`

## Code Style

### Storefront (Prettier: no semicolons, double quotes, 2-space indent)

### Medusa/Backend (semicolons, single quotes, 4-space indent)

### TypeScript

- **Storefront**: Strict, `noUncheckedIndexedAccess`, ES2022, path alias `@/*` → `./src/*`
- **Medusa/Plugins**: ES2021, Node16, `strictNullChecks`, decorators enabled

### Import Conventions

**Storefront** - Use `@/` alias, order: `next/*, react` → `@/lib/*` → `@/modules/*` → `@/repo/*` → third-party

**Medusa/Plugins** - Relative imports; `@medusajs/framework/*` for framework; `@repo/common` for shared

### Naming Conventions

| Type             | Convention                                         | Example                           |
| ---------------- | -------------------------------------------------- | --------------------------------- |
| Files            | kebab-case                                         | `fitment-module.service.ts`       |
| React components | PascalCase function, named export, kebab-case file | `product-card.tsx`                |
| Types/Interfaces | PascalCase, prefix `I`                             | `ILogger`                         |
| Zod schemas      | PascalCase + `Schema`                              | `CreateProductSchema`             |
| Constants        | UPPER_SNAKE_CASE                                   | `FITMENT_MODULE`                  |
| Services         | PascalCase + `.service.ts`. Protected: `_` suffix  | `fitmentMakeRepository_`          |
| Controllers      | PascalCase + `Controller`                          | `ProductController`               |
| Workflows/Steps  | kebab-case IDs, camelCase export                   | `createFitmentsWorkflow`          |
| API routes       | kebab-case folders                                 | `src/api/admin/products/route.ts` |

## React / Next.js Patterns

- Routes under `[locale]/`. Locales: `en`, `fr`, `ar` (RTL)
- Pages: `async` server components
- `"use server"` for data modules in `src/lib/data/*.ts`
- State: Zustand `createStore` from `zustand/vanilla`
- UI: `@repo/ui` — CVA + Radix + `cn()` utility

Route structure: `src/app/[locale]/page.tsx`, `src/app/[locale]/cart/page.tsx`, `src/app/[locale]/p/[handle]/page.tsx`

## Medusa Backend Patterns

```typescript
// API Routes: src/api/{store|admin}/{resource}/route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(200);
}

// Controllers: extend BaseController
export class ProductController extends BaseController {
  protected async execute() {
    return this.success({});
  }
}

// Services: MedusaService([Model1, Model2])
export const MY_MODULE = Module("my-module", { service: MyService });

// Workflows
const myStep = createStep("my-step", async (input, context) => {
  return new StepResponse(result, compensationData);
});
export const myWorkflow = createWorkflow("my-workflow", (input) =>
  myStep(input),
);

// Validation
const Schema = z.object({ name: z.string() });
// In route: req.validatedBody (Zod via middleware)
```

## Error Handling

**Backend**: Throw `new Error("Entity not found")` — handler matches "not found" for 404

**Storefront**: `medusaError(error)` from `src/lib/util/error.ts`. Chain `.catch(medusaError)`

## @repo/common Exports

`BaseController`, `BaseSchema`, `BASE_MASK`, `ILogger`, `MedusaLoggerAdapter`, `IErrorHandler`, `ApiErrorHandler`

## Environment

`.env` files: `apps/medusa/.env`, `apps/storefront/.env`

Key vars: `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MINIO_*`, `MEDUSA_BACKEND_URL`

## Agent Skills (REQUIRED)

Load via `skill` tool.

| Skill                         | When to Use                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| `building-with-medusa`        | **MANDATORY** for backend work (modules, routes, workflows, data models) |
| `next-best-practices`         | Next.js, RSC patterns, data fetching                                     |
| `vercel-react-best-practices` | React/Next.js performance                                                |
| `frontend-design`             | UI components, pages                                                     |
| `use-railway`                 | Deployment, infrastructure                                               |
