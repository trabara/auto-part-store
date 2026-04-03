# AGENTS.md — Coding Agent Reference

## Project Overview

Turborepo monorepo for a Medusa v2 e-commerce platform.

**Apps:**

- `apps/medusa` — Medusa v2 backend (Node, TypeScript, REST API + Admin)
- `apps/storefront` — Next.js 16 storefront (React 19, Tailwind v4, next-intl)

**Packages:**

- `packages/plugins/fitment-plugin` — Medusa plugin: fitment/vehicle data, entity media
- `packages/plugins/analytics-plugin` — Analytics Medusa plugin
- `packages/plugins/invoice-plugin` — Invoice Medusa plugin
- `packages/plugins/rbac-plugin` — RBAC Medusa plugin
- `packages/common` — Shared base classes (`BaseController`, error handlers, interfaces)
- `packages/config/tsconfig` — Shared tsconfig presets
- `packages/config/eslint-config` — Shared ESLint config
- `packages/ui/admin` — Shared admin UI components
- `packages/ui/hooks` — Shared React hooks (`@repo/hooks`)
- `packages/ui/icons` — Shared icon components (`@repo/icons`)

**Package manager:** Yarn 4 (Berry, PnP-less). Node >= 20 required.
**Build orchestrator:** Turborepo (`turbo.json`).

---

## Build / Dev Commands

Run all commands from the **repo root** unless otherwise noted.

```bash
# Install dependencies
yarn install

# Build all packages and apps
yarn build

# Type-check all packages
yarn check-types

# Lint all packages
yarn lint

# Format all TypeScript/TSX/MD files
yarn format

# Dev (hot reload) — starts backend + storefront
yarn dev

# Clean all build artifacts and node_modules
yarn clean
```

### Medusa Backend (`apps/medusa`)

```bash
# Build
yarn workspace medusa build

# Dev server (hot reload)
yarn workspace medusa dev

# DB migrations
yarn workspace medusa medusa:db:migrate

# Generate migration for a module change
yarn workspace medusa medusa:db:generate

# Seed database
yarn workspace medusa seed

# Create admin user
yarn workspace medusa medusa:user:create
```

### Storefront (`apps/storefront`)

```bash
yarn workspace storefront dev
yarn workspace storefront build
yarn workspace storefront lint
```

### Plugin development (e.g. fitment-plugin)

```bash
# Build plugin
yarn workspace @repo/fitment-plugin build

# Dev (watches and syncs to apps/medusa)
yarn workspace @repo/fitment-plugin dev
```

---

## Testing

Tests live in `apps/medusa`. There is **no test suite in the storefront**.

```bash
# Unit tests (matches src/**/__tests__/**/*.unit.spec.[jt]s)
yarn workspace medusa test:unit

# Integration tests — HTTP layer (matches integration-tests/http/*.spec.[jt]s)
yarn workspace medusa test:integration:http

# Integration tests — module layer (matches src/modules/*/__tests__/**/*.[jt]s)
yarn workspace medusa test:integration:modules
```

**Run a single test file:**

```bash
# From apps/medusa directory
TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern="path/to/my.unit.spec.ts" --runInBand --forceExit

TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern="path/to/my.spec.ts" --runInBand --forceExit
```

Test runner: **Jest 29** with `@swc/jest` transform. Environment: `node`.

**Plugins** have their own `jest.config.js` with the same `TEST_TYPE` convention. Run them from the plugin workspace:

```bash
yarn workspace @repo/rbac-plugin test:integration:http
```

Integration tests use `medusaIntegrationTestRunner` from `@medusajs/test-utils`. A global `afterAll` hook in `integration-tests/setup.js` drops the temporary database via `pg-god`. Required env vars for tests come from `.env.test`.

---

## Code Style

### Formatter: Prettier

Config in `apps/storefront/.prettierrc` (applied project-wide via root `yarn format`):

- `semi: false` — no semicolons
- `singleQuote: false` — double quotes
- `tabWidth: 2`
- `trailingComma: "es5"`
- `arrowParens: "always"`

### Linter: ESLint v9 (flat config)

- All ESLint configs use flat config `.mjs` files with `defineConfig([...])`
- Backend/plugins extend `packages/config/eslint-config/base.js` (`@typescript-eslint/recommended` + `turbo` plugin)
- Storefront uses `eslint-config-next` (core-web-vitals + typescript)
- All violations default to **warnings** via `eslint-plugin-only-warn`
- `@typescript-eslint/no-explicit-any` is **off** — `any` is allowed when necessary
- Unused vars/args prefixed with `_` are ignored

---

## TypeScript

### Backend / Plugins (`packages/config/tsconfig/plugin.json`)

- `target: ES2021`, `module: Node16`, `moduleResolution: Node16`
- `strictNullChecks: true` (not full `strict`)
- `emitDecoratorMetadata: true`, `experimentalDecorators: true`
- Output: `.medusa/server/`
- `src/admin/` is excluded from the plugin tsconfig (built separately by Medusa's admin bundler)

### Storefront (`packages/config/tsconfig/nextjs.json` → `base.json`)

- `strict: true`, `noUncheckedIndexedAccess: true`
- `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`
- `noEmit: true`
- Path alias: `@/*` → `./src/*`

### General TypeScript conventions

- Prefer explicit `type` imports: `import type { Foo } from "..."`
- Derive types from Zod schemas with `z.infer<typeof Schema>` — never hand-write duplicate types
- Use `Infer<typeof Model>` from `@medusajs/framework/types` for Medusa data model types
- Name input/output types `*Input`, `*Output`, `*Params`, `*Response`

---

## Import Conventions

- External packages first, then internal workspace packages (`@repo/*`), then relative imports
- Storefront uses `@/` alias for `src/`; never use relative paths from `src/`
- Medusa framework imports use sub-paths — never import from the root package:
  ```ts
  import {
    createWorkflow,
    WorkflowResponse,
  } from "@medusajs/framework/workflows-sdk";
  import {
    MedusaService,
    InjectManager,
    InjectTransactionManager,
    MedusaContext,
  } from "@medusajs/framework/utils";
  import { DAL, Context, Infer } from "@medusajs/framework/types";
  import { model } from "@medusajs/framework/utils";
  import { z } from "@medusajs/framework/zod";
  import {
    createFindParams,
    createOperatorMap,
  } from "@medusajs/medusa/api/utils/validators";
  ```

---

## Naming Conventions

| Construct                | Convention                          | Example                     |
| ------------------------ | ----------------------------------- | --------------------------- |
| Files                    | `kebab-case`                        | `fitment-module.service.ts` |
| Classes                  | `PascalCase`                        | `FitmentModuleService`      |
| Interfaces               | `IPascalCase`                       | `IFitmentCrud`              |
| Functions / methods      | `camelCase`                         | `createFitments`            |
| React components         | `PascalCase`                        | `ProductGridItem`           |
| Zod schemas              | `PascalCaseSchema`                  | `CreateFitmentInputSchema`  |
| Zod-inferred types       | `PascalCase` (same name, no suffix) | `CreateFitmentInput`        |
| Medusa workflows         | `camelCaseWorkflow`                 | `createFitmentsWorkflow`    |
| Medusa workflow steps    | `camelCaseStep`                     | `createFitmentsStep`        |
| Medusa models            | `PascalCase`                        | `Fitment`, `FitmentMake`    |
| Constants / module keys  | `UPPER_SNAKE_CASE`                  | `FITMENT_MODULE`            |
| Private class properties | trailing underscore                 | `fitmentRepository_`        |

---

## Architecture Patterns

### Medusa Backend

- **Modules** live in `src/modules/<name>/` with `index.ts`, `models/`, `services/`, `migrations/`
- **Workflows** live in `src/workflows/<domain>/` with `steps/` subdirectory
- **API routes** live in `src/api/<scope>/<resource>/route.ts` + `middlewares.ts`
- **Controllers** extend `BaseController` from `@repo/common` — never write raw `req`/`res` logic in route files
- Services extend `MedusaService(Models)` from `@medusajs/framework/utils`
- Complex services delegate to specialized private methods; public methods use `@InjectManager`, private implementations use `@InjectTransactionManager`
- Repository fields use trailing underscore: `this.fitmentRepository_`
- Use `@InjectManager` / `@InjectTransactionManager` / `@MedusaContext` decorators for DB context

#### Module structure example

```
src/modules/authz/
  index.ts            ← exports module definition + service + types
  constant.ts         ← AUTHZ_MODULE key, excluded routes, etc.
  schema.ts           ← all Zod schemas + inferred types
  middleware.ts       ← module-level Express middleware (if needed)
  models/
    role.ts           ← model.define(...)
    policy.ts
    ...
  services/
    authz.service.ts  ← extends MedusaService(Models)
  migrations/
    Migration*.ts
```

#### API route + controller pattern

```
src/api/admin/rbac/v2/roles/
  route.ts        ← thin: instantiate controller, call method
  middlewares.ts  ← validateAndTransformBody/Query per method+route
```

Route file is always thin — it only instantiates the controller and delegates:

```ts
// route.ts
export const GET = async (req, res) => new RoleController(req, res).list();
export const POST = async (req, res) => new RoleController(req, res).create();
```

Middleware file uses `defineMiddlewares` and wires `validateAndTransformBody` /
`validateAndTransformQuery` with the Zod schemas from `schema.ts`:

```ts
// middlewares.ts
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/rbac/v2/roles",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateRoleSchema)],
    },
    {
      matcher: "/admin/rbac/v2/roles",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(RoleFiltersSchema, {
          defaults: ["id", "name", "description", "created_at"],
          isList: true,
        }),
      ],
    },
  ],
});
```

#### Workflow + step pattern

```ts
// steps/create-roles-step.ts
const createRbacRolesStep = createStep(
  "create-rbac-roles-step",
  async (input: CreateRoleInput[], { container }) => {
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
    const roles = await service.createRoles(input);
    // Second arg to StepResponse is the compensation payload
    return new StepResponse({ roles }, { roleIds: roles.map((r) => r.id) });
  },
  async (compensation, { container }) => {
    if (!compensation) return;
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
    await service.deleteAuthzRoles(compensation.roleIds);
  },
);

// workflow
export const createRbacRolesWorkflow = createWorkflow(
  "create-rbac-roles-workflow",
  function (input: CreateRbacRolesWorkflowInput) {
    const { roles } = createRbacRolesStep(input);
    return new WorkflowResponse({ roles });
  },
);
```

#### Data model definition

```ts
// models/role.ts
import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

export const AuthzRole = model
  .define("authz_role", {
    id: model.id().primaryKey(),
    name: model.text(),
    description: model.text().nullable(),
    policies: model.hasMany(() => AuthzPolicy, { mappedBy: "role" }),
    members: model.hasMany(() => AuthzMember, { mappedBy: "role" }),
  })
  .cascades({ delete: ["policies", "members"] })
  .indexes([{ on: ["name"], unique: true, where: "deleted_at IS NULL" }]);

// Re-export the inferred type with the same name as the model constant
export type AuthzRole = Infer<typeof AuthzRole>;
```

#### Zod schema pattern

All schemas live in `schema.ts` co-located with the module. Types are derived via `z.infer`:

```ts
import { z } from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";

export const CreateRoleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  permissions: z.array(z.string()).min(1, "At least one policy is required"),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

// List filter schema
export const RoleFiltersSchema = createFindParams().extend({
  filters: z
    .object({
      id: createOperatorMap(z.string()),
      name: createOperatorMap(z.string()),
    })
    .optional(),
});
```

### Storefront

- Next.js App Router with `[locale]` dynamic segment for i18n (`next-intl`)
- Supported locales: `en-US` (default), `fr-FR`, `ar-TN` (Arabic is RTL)
- Locale stored in cookie `_medusa_locale` (7-day TTL)
- All pages live under `src/app/[locale]/`
- Server actions in `src/lib/data/` are marked `"use server"`
- Client components are marked `"use client"` at the top
- UI primitives in `src/components/ui/` (shadcn/ui pattern: Radix + CVA + Tailwind v4)
- Module-level code in `src/modules/<domain>/` (components, hooks, templates)
- **Zustand** (vanilla store via `createStore`) for global client state (e.g. cart)
- **React Query** via `@repo/hooks` for server state / infinite scroll
- SDK calls use `sdk.client.fetch(...)` from `@medusajs/js-sdk`; all data-fetching server actions live in `src/lib/data/`

#### Storefront server action pattern

```ts
// src/lib/data/products.ts
"use server"

import { sdk } from "@/lib/config"

export async function listProducts({ pageParam, queryParams }: ProductListParams) {
  const { products, metadata } = await sdk.client.fetch("/store/products/v2", {
    method: "GET",
    query: { ... },
  })
  return { ... }
}
```

#### Zustand store pattern

```ts
// src/modules/cart/store.ts
import { createStore } from "zustand/vanilla";

export const createCartStore = (initState: Partial<CartState> = {}) =>
  createStore<CartStore>()((set) => ({
    ...INITIAL_CART_STATE,
    ...initState,
    setCart: (cart) => set({ cart }),
    setSideSheetOpen: (isOpen) => set({ isSideSheetOpen: isOpen }),
  }));
```

#### Storefront UI component pattern (shadcn/ui + CVA)

```tsx
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", outline: "..." },
    size: { default: "...", sm: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### Validation

- All API input validated with **Zod** schemas co-located in `schema.ts` inside the module
- Storefront forms use **react-hook-form** + `@hookform/resolvers/zod`

---

## Error Handling

### Backend

- Controllers use `this.execute(async () => { ... }, "log message")` from `BaseController`
- `execute` wraps the action in try/catch; errors are delegated to `ApiErrorHandler` which maps them to HTTP status codes
- Use typed response helpers inside the action: `this.success(data)`, `this.created(data)`, `this.notFound(msg)`, `this.badRequest(msg)`, `this.noContent()`
- Log with `this.logger.info(...)` / `this.logger.error(...)` — never use `console.log`
- Throw plain `Error` or Medusa framework errors; the error handler maps them

```ts
async create(): Promise<void> {
  await this.execute(async () => {
    const validated = CreateRoleSchema.parse(this.req.validatedBody)
    const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE)
    const [role] = await service.createRoles([validated])
    this.created({ role })
  }, "Role created successfully")
}
```

### Storefront

- Server action errors should be caught and returned as typed error objects — not thrown to the client
- Use React error boundaries at the layout level for unexpected errors

---

## `BaseController` API Reference

`packages/common/src/controllers/base.controller.ts`

| Method                        | Status | Description                     |
| ----------------------------- | ------ | ------------------------------- |
| `this.execute(action, msg?)`  | —      | Runs action; catches all errors |
| `this.success(data, code?)`   | 200    | JSON response                   |
| `this.created(data)`          | 201    | JSON response                   |
| `this.noContent()`            | 204    | Empty response                  |
| `this.notFound(msg?)`         | 404    | JSON `{ message }`              |
| `this.badRequest(msg?)`       | 400    | JSON `{ message }`              |
| `this.unauthorized(msg?)`     | 401    | JSON `{ message }`              |
| `this.forbidden(msg?)`        | 403    | JSON `{ message }`              |
| `this.internalServerError()`  | 500    | JSON `{ message }`              |
| `this.handleError(err, ctx?)` | —      | Manual error dispatch           |
| `this.logger`                 | —      | Scoped `ILogger` instance       |

---

## medusa-config.ts

`apps/medusa/medusa-config.ts` configures:

- **Database:** `DATABASE_URL` (PostgreSQL)
- **Redis:** `REDIS_URL` (used for caching, locking, and event bus)
- **File storage:** MinIO via S3-compatible provider (`MINIO_*` env vars)
- **Auth:** emailpass provider
- **Plugins registered:** `@repo/analytics-plugin`, `@repo/fitment-plugin`, `@repo/invoice-plugin`, `@repo/rbac-plugin`
- **Feature flags:** `translation: true`

All plugins are resolved by package name. Plugin-specific options are passed in the `options` key.

---

## Environment Variables

| File                    | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `apps/medusa/.env`      | Backend runtime (copy from `.env.template`) |
| `apps/medusa/.env.test` | Test DB credentials + JWT secret            |
| `apps/storefront/.env`  | Storefront env (`NEXT_PUBLIC_*` vars)       |

Key backend vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `MINIO_FILE_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_REGION`, `MINIO_BUCKET`, `MINIO_ENDPOINT`, `TENANT_NAME`.

Turbo warns on undeclared env vars used in tasks (`turbo/no-undeclared-env-vars`).

---

## Plugin Architecture

Plugins are standard Medusa v2 plugins. Each plugin:

1. Has its own `package.json` with `@medusajs/medusa plugin:build` as the build script
2. Exports a default plugin config from its root `index.ts`
3. Declares its module(s), API routes, admin UI extensions, and workflows internally
4. Is registered in `apps/medusa/medusa-config.ts` under `plugins`

**UI packages (`@repo/admin`, `@repo/hooks`, `@repo/icons`) are source-linked** — no build step required; they are consumed directly as TypeScript source by the plugin/app that imports them.

**Plugin dev workflow** uses `@repo/scripts` (`plugin-dev-init` + `plugin-dev-watch`) to sync built output into `apps/medusa` during development.

---

## Fitment System

The fitment system is a core domain feature spanning backend and storefront.

**Data model (backend):** `Make → Model → Engine → Fitment` hierarchy. A `Fitment` record links a vehicle configuration (body style, drive, transmission, doors, year range) to a `Model` + `Engine`.

**Storefront hook:** `useFitment(form)` in `src/modules/fitment/hooks/use-fitment.ts` drives the vehicle selector UI. It uses `useActionState` + server actions to fetch makes, then derives models/engines from the selected state client-side.

**Product filtering:** All product list API calls pass `fitment_id` (read from a cookie) to the backend so products are filtered to the active vehicle.

---

## CI / CD

- **CI** (`.github/workflows/ci.yml`): runs on PRs to `main`/`develop`
  - `lint-and-typecheck`: `yarn lint` + `yarn check-types`
  - `build-and-push`: builds Docker images for `medusa` and `storefront`, pushes to Docker Hub (`obha507/medusa`, `obha507/storefront`) on non-PR events
- **Deploy** (`.github/workflows/deploy.yml`): Railway deployment via Terraform
- Docker images use per-app `Dockerfile`s under `apps/<service>/Dockerfile`
- Turbo remote cache is enabled via `TURBO_TEAM` + `TURBO_TOKEN` build args

---

## Workspace Package Imports

| Package               | Import path           |
| --------------------- | --------------------- |
| Common base classes   | `@repo/common`        |
| Shared hooks          | `@repo/hooks`         |
| Shared icons          | `@repo/icons`         |
| Admin UI components   | `@repo/admin`         |
| Shared tsconfigs      | `@repo/tsconfig`      |
| Shared ESLint configs | `@repo/eslint-config` |
