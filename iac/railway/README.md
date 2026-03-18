# Railway Terraform IaC

Infrastructure as Code for deploying smap-store to Railway using Terraform.

## Project Structure

This monorepo contains:

- `apps/medusa` - Medusa v2 backend
- `apps/storefront` - Next.js 16 storefront
- `packages/*` - Shared packages
- `plugins/*` - Medusa plugins

## Prerequisites

1. **Terraform** >= 1.0 installed
2. **Railway account** with an API token

## Setup

### 1. Get Railway Token

Generate a Railway API token from your [Railway account settings](https://railway.app/account).

### 2. Configure Environment

```bash
export RAILWAY_TOKEN="your-railway-token"
```

### 3. Configure Variables

Create a `terraform.tfvars` file:

```hcl
project_name         = "smap-store"
environment_name    = "production"
github_repo         = "your-org/smap-store"
branch              = "main"
medusa_root_dir     = "apps/medusa"
storefront_root_dir = "apps/storefront"
```

## Usage

```bash
cd iac/railway
terraform init
terraform plan
terraform apply
```

## Architecture

This Terraform configuration creates:

| Service    | Type     | Source                            |
| ---------- | -------- | --------------------------------- |
| postgres   | Database | railwayapp-templates/postgres-ssl |
| redis      | Cache    | redis template                    |
| medusa     | App      | GitHub (monorepo)                 |
| storefront | App      | GitHub (monorepo)                 |

### Monorepo Deployment

Both Medusa and Storefront deploy from the **same GitHub repository** but use different root directories:

- Medusa: `apps/medusa`
- Storefront: `apps/storefront`

This is configured via `railway_deployment_trigger` resources with `root_directory` set for each service.

### Service Communication

Services communicate via Railway's private network:

- PostgreSQL: `@railway:ref:postgres/DATABASE_URL`
- Redis: `redis://redis.railway.internal:6379`

### Environment Variables

**Medusa:**

- `DATABASE_URL` - from PostgreSQL
- `REDIS_URL` - from Redis
- `MINIO_*` - S3 configuration
- `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`
- `JWT_SECRET`, `COOKIE_SECRET`

**Storefront:**

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_BASE_URL`
- `REVALIDATE_SECRET`

## Notes

- **Secrets**: Sensitive variables (`JWT_SECRET`, `COOKIE_SECRET`, etc.) should be updated in Railway dashboard for production.
- **MinIO**: Railway provides ephemeral storage. For file uploads, use AWS S3, Cloudflare R2, or another S3-compatible provider.
- **Build Commands**: Configured via `BUILD_CMD` and `START_CMD` variables:
  - Medusa: `yarn workspace medusa build` → `medusa start`
  - Storefront: `yarn workspace storefront build` → `node server.js`
