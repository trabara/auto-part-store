# Medusa ERP

An ERP SaaS built on [Medusa v2](https://docs.medusajs.com). Each client runs its own Medusa instance with the capabilities their business needs: an auto-parts seller gets the automotive domain (vehicles, fitment, parts), others get different domains.

The code is layered: **modules** (reusable Medusa modules: one bounded context each) → **domains** (Medusa plugins: a business capability combining modules) → the **application** (which domains a tenant runs, via `composeApplication`), all on the **platform** (`@repo/framework`, `@repo/dashboard`).

## What's in the repo

| Path | What it is |
| --- | --- |
| `apps/backend` | The Medusa application (API + admin) |
| `packages/framework` | `@repo/framework`: define an entity once and get its database model, API, validation and admin screens |
| `packages/ui/dashboard` | `@repo/dashboard`: admin list, create, detail and edit templates |
| `packages/modules/*` | Reusable modules (`@repo/module-vehicle`, `-fitment`, `-parts`): tables, service, admin definition, translations |
| `packages/domains/*` | Business domains as Medusa plugins (`@repo/domain-automotive`): links, workflows, storefront API, admin pages |
| `packages/config` | Shared TypeScript, ESLint and Jest configuration |
| `packages/tooling/scripts` | Dev watcher, module migrations, the module and domain generators |
| `infra/docker`, `infra/k8s` | Local services and Kubernetes manifests |

## Getting started

Requirements: Node 20+, Yarn (via Corepack), Docker.

```bash
yarn install
docker compose -f infra/docker/docker-compose.infra.yml up -d   # Postgres, Redis, MinIO
cp apps/backend/.env.template apps/backend/.env                  # then fill in values
yarn build
yarn workspace backend medusa:db:migrate
yarn workspace backend medusa:user:create                        # admin@example.com
yarn dev
```

The admin is at http://localhost:9000/app.

## Everyday commands

```bash
yarn dev                  # backend with module and domain hot reload
yarn check-types          # type check every workspace
yarn lint                 # lint every workspace
yarn check-layers         # dependency layer rules
yarn constraints          # dependency version rules
yarn gen:module <name>    # scaffold a reusable module
yarn gen:domain <name> --modules a,b   # scaffold a domain over modules
```

Tests: `yarn workspace <package> test` (framework, dashboard) or `test:unit` (modules, domains) / `test:integration:http` (domains). Integration tests need the local Postgres running; defaults are in each package's `.env.test.example`, and you can override them in a git-ignored `.env.test`.

## Adding a capability

```bash
yarn gen:module invoicing --entity Invoice --path invoices   # packages/modules/invoicing
yarn gen:domain billing --modules invoicing                  # packages/domains/billing
```

The module gets an entity, its service, admin API, admin definition, typed translations and tests; the domain mounts it (routes, admin pages) and lists it in its manifest. Each command prints the remaining steps (first migration, tests, adding the domain to `composeApplication` in the app). See [AGENTS.md](AGENTS.md) for the conventions.

## Deployment

The backend image builds from the repository root:

```bash
docker build -f apps/backend/Dockerfile -t medusa-erp-backend .
```

Production runs on Kubernetes (OVHcloud), one namespace per tenant; see `infra/k8s`.
