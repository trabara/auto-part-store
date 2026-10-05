# Medusa ERP

An ERP SaaS built on [Medusa v2](https://docs.medusajs.com). Each client runs its own Medusa instance with the capabilities their business needs: an auto-parts seller gets vehicles and fitment, others get different plugins.

## What's in the repo

| Path | What it is |
| --- | --- |
| `apps/backend` | The Medusa application (API + admin) |
| `packages/framework` | `@repo/framework`: define an entity once and get its database model, API, validation and admin screens |
| `packages/ui/dashboard` | `@repo/dashboard`: admin list, create, detail and edit templates |
| `packages/plugins/*` | One business capability per plugin (`@repo/plugin-automotive` today) |
| `packages/config` | Shared TypeScript, ESLint and Jest configuration |
| `packages/tooling/scripts` | Plugin dev watcher and the plugin generator |
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
yarn dev                  # backend with plugin hot reload
yarn check-types          # type check every workspace
yarn lint                 # lint every workspace
yarn check-layers         # dependency layer rules
yarn constraints          # dependency version rules
yarn gen:plugin <name>    # scaffold a new capability plugin
```

Tests: `yarn workspace <package> test` (framework, dashboard) or `test:unit` / `test:integration:http` (plugins). Integration tests need the local Postgres running; defaults are in each package's `.env.test.example`, and you can override them in a git-ignored `.env.test`.

## Adding a capability

```bash
yarn gen:plugin invoicing --entity Invoice
```

This creates `packages/plugins/invoicing` with an entity, its admin API and admin screens, and tests. The command prints the remaining steps (first migration, tests, enabling it in the app). See [AGENTS.md](AGENTS.md) for the conventions.

## Deployment

The backend image builds from the repository root:

```bash
docker build -f apps/backend/Dockerfile -t medusa-erp-backend .
```

Production runs on Kubernetes (OVHcloud), one namespace per tenant; see `infra/k8s`.
