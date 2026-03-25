# AGENTS.md — smap-store

Turborepo monorepo for auto-parts e-commerce. Yarn 4 workspaces, Node >= 20.

## Workspace Overview

| Workspace                        | Path                              | Stack                                 |
| -------------------------------- | --------------------------------- | ------------------------------------- |
| `medusa`                         | `apps/medusa`                     | Medusa v2 (2.13.3), PostgreSQL, Redis |
| `storefront`                     | `apps/storefront`                 | Next.js 16, React 19, Tailwind CSS v4 |
| `@repo/common`                   | `packages/common`                 | Shared controllers, services          |
| `@repo/ui`                       | `packages/ui`                     | UI components (shadcn/ui)             |
| `@repo/vehicle-fitment-plugin`   | `plugins/vehicle-fitment-plugin`  | Fitment data, API routes, workflows   |
| `@agilo/medusa-analytics-plugin` | `plugins/medusa-analytics-plugin` | Analytics                             |

All custom backend logic (API routes, modules, workflows, subscribers) lives in **plugins**, not in `apps/medusa`.

## Build/Lint/Test Commands

```bash
# Monorepo
yarn build / yarn dev / yarn lint / yarn check-types / yarn format / yarn clean

# Storefront
yarn workspace storefront dev         # next dev (http://localhost:3000)
yarn workspace storefront lint        # eslint
yarn workspace storefront check-types # tsc --noEmit

# Medusa
yarn workspace medusa dev            # medusa develop (http://localhost:9000)
yarn workspace medusa seed:dev       # run seed script (dev mode)
yarn workspace medusa seed           # run seed script (prod mode)

# Docker
yarn docker:build / yarn docker:up / yarn docker:down / yarn docker:logs
```

Services: `api.localhost` (Medusa), `shop.localhost` (Storefront), `minio.localhost` (MinIO).

### Running Tests (Medusa)

Run all tests of a type:

```bash
yarn workspace medusa test:integration:http
yarn workspace medusa test:integration:modules
yarn workspace medusa test:unit
```

Run a single test file:

```bash
yarn workspace medusa test:unit -- --testPathPattern="make.unit"
yarn workspace medusa test:integration:http -- --testPathPattern="health"
```

Run specific test:

```bash
yarn workspace medusa test:unit -- --testPathPattern="create-product" --testNamePattern="should create"
```

Test locations: HTTP: `apps/medusa/integration-tests/http/*.spec.ts`, Modules: `apps/medusa/src/modules/*/__tests__/**`, Unit: `apps/medusa/src/**/__tests__/**/*.unit.spec.[jt]s`

## Code Style

### Formatting

| Scope          | Semicolons | Quotes | Indent  |
| -------------- | ---------- | ------ | ------- |
| Storefront     | No         | Double | 2-space |
| Medusa/Plugins | Yes        | Single | 4-space |

Storefront has `.prettierrc`; backend has no enforced formatter — follow conventions above.

### TypeScript & Imports

- **Storefront**: Strict, `noUncheckedIndexedAccess`, ES2022, path alias `@/*` → `./src/*`. Imports order: `next/*`, `react` → `@/lib/*` → `@/modules/*` → `@/repo/*` → third-party
- **Medusa/Plugins**: ES2021, Node16, `strictNullChecks`, decorators. Imports: relative; `@medusajs/framework/*` for framework; `@repo/common` for shared
- **@repo/ui**: `import { Button } from "@repo/ui/components/button"`, `import { cn } from "@repo/ui/lib/utils"`

### Naming Conventions

| Type             | Convention                                         | Example                     |
| ---------------- | -------------------------------------------------- | --------------------------- |
| Files            | kebab-case                                         | `fitment-module.service.ts` |
| React components | PascalCase function, named export, kebab-case file | `product-card.tsx`          |
| Types/Interfaces | PascalCase, prefix `I`                             | `ILogger`                   |
| Zod schemas      | PascalCase + `Schema`                              | `CreateProductSchema`       |
| Constants        | UPPER_SNAKE_CASE                                   | `FITMENT_MODULE`            |
| Services         | PascalCase + `.service.ts`. Protected: `_` suffix  | `fitmentMakeRepository_`    |
| Controllers      | PascalCase + `Controller`                          | `ProductController`         |
| Workflows/Steps  | kebab-case IDs, camelCase export                   | `createFitmentsWorkflow`    |

## React / Next.js Patterns

- Routes under `[locale]/`. Locales: `en`, `fr`, `ar` (RTL). Pages: `async` server components
- `"use server"` for data modules in `src/lib/data/*.ts`. State: Zustand `createStore` from `zustand/vanilla`
- UI: `@repo/ui` — CVA + Radix + `cn()` utility. Forms: `react-hook-form` + `zod` via `@hookform/resolvers`
- Route structure: `src/app/[locale]/page.tsx`, `src/app/[locale]/cart/page.tsx`, `src/app/[locale]/p/[handle]/page.tsx`

## Medusa Backend Patterns

```typescript
// API Routes: thin handlers delegating to controllers
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new MakeController(req, res);
  await controller.list();
}

// Controllers: extend BaseController from @repo/common
export class MakeController extends BaseController {
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { data, metadata } = await query.graph({...});
      this.success({ data, metadata });
    });
  }
}

// Services: MedusaService([Model1, Model2]) facade pattern
export const MY_MODULE = Module("my-module", { service: MyService });

// Workflows + Steps with compensation
const myStep = createStep("my-step", async (input, { container }) => {
  return new StepResponse(result, compensationData);
}, async (comp) => { /* rollback */ });
export const myWorkflow = createWorkflow("my-workflow", (input) => myStep(input));

// Middleware: registered in api/middlewares.ts
export const storeMakeMiddlewares: MiddlewareRoute[] = [{
  matcher: "/store/makes", method: "GET",
  middlewares: [validateAndTransformQuery(Schema, { defaults: [...], isList: true })],
}]
```

## Validation & Error Handling

Use `@medusajs/framework/zod`. Schemas in `schema.ts` per module. Access validated data via `req.validatedBody` / `req.validatedQuery`.

**Backend**: Throw `new Error("Entity not found")` — handler matches "not found" for 404. `ApiErrorHandler` from `@repo/common` maps errors to status codes (404, 400, 401, 403, 500). API returns `{ ...data }` not raw arrays; use `this.success(data)` in controllers.

**Storefront**: `medusaError(error)` from `src/lib/util/error.ts`. Chain `.catch(medusaError)`.

## @repo/common Exports

`BaseController`, `BaseSchema`, `BASE_MASK`, `ILogger`, `MedusaLoggerAdapter`, `IErrorHandler`, `ApiErrorHandler`

## Environment

`.env` files: `apps/medusa/.env`, `apps/storefront/.env`. Key vars: `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MINIO_*`, `MEDUSA_BACKEND_URL`

## Agent Skills (REQUIRED)

Load via `skill` tool.

| Skill                         | When to Use                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| `building-with-medusa`        | **MANDATORY** for backend work (modules, routes, workflows, data models) |
| `next-best-practices`         | Next.js, RSC patterns, data fetching                                     |
| `vercel-react-best-practices` | React/Next.js performance                                                |
| `frontend-design`             | UI components, pages                                                     |
| `storefront-best-practices`   | Storefront/checkout/cart/e-commerce features                             |
| `use-railway`                 | Deployment, infrastructure                                               |
