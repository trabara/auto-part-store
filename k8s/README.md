# Kubernetes Configuration (k3s)

Lightweight Kubernetes manifests optimized for k3s cluster.

## k3s-Specific Features

- **Traefik** ingress controller (built-in to k3s)
- **local-path** StorageClass for persistent volumes
- No external dependencies required

## Prerequisites

```bash
# Install k3s
curl -sfL https://get.k3s.io | sh -

# Verify storage class
kubectl get storageclass
# Should show: local-path (primary)
```

## Structure

```
k8s/
├── base/                    # Base manifests
│   ├── 00-namespace.yaml    # Namespace
│   ├── postgres.yaml         # PostgreSQL StatefulSet
│   ├── redis.yaml           # Redis Deployment
│   ├── minio.yaml           # MinIO Deployment
│   ├── medusa.yaml          # Medusa backend
│   ├── storefront.yaml       # Next.js storefront
│   ├── medusa-init.yaml     # Init Job (migrations, seed, secret)
│   ├── network-policies.yaml # Network security
│   ├── ingress.yaml          # Traefik Ingress routes
│   └── kustomization.yaml
├── overlays/
│   ├── production/           # Production (3 replicas)
│   └── staging/             # Staging (2 replicas)
└── kustomization.yaml
```

## Local Registry Setup

Images are built locally and pushed to a local Docker registry:

```bash
# Build images
docker build -t smap-store-medusa:latest apps/medusa
docker build -t smap-store-storefront:latest apps/storefront

# Start local registry
docker run -d --name registry --network host -v /tmp/registry:/var/lib/registry registry:2

# Tag and push images
docker tag smap-store-medusa:latest localhost:5000/smap-store-medusa:latest
docker push localhost:5000/smap-store-medusa:latest
docker tag smap-store-storefront:latest localhost:5000/smap-store-storefront:latest
docker push localhost:5000/smap-store-storefront:latest

# Load into k3s (if not using registry)
sudo ctr -a /run/k3s/containerd/containerd.sock -n k8s.io images import /tmp/smap-images.tar
```

## Deploy

```bash
# Apply all manifests (single command)
kubectl apply -k k8s/base/

# Watch deployment progress
kubectl get pods -n smap-store -w
```

Deployment order:

1. Infrastructure services start (postgres, redis, minio)
2. `minio-init` Job creates `medusa` bucket with download policy
3. Medusa deployment starts (waiting for postgres/redis)
4. `medusa-init` Job runs migrations, seeds data, creates admin user, and creates the publishable key secret
5. Storefront deployment waits for valid secret, then starts serving

## DNS Configuration

Add to `/etc/hosts` for local testing:

```
<NODE_IP> api.localhost
<NODE_IP> localhost
<NODE_IP> admin.localhost
<NODE_IP> minio.localhost
<NODE_IP> minio-console.localhost
```

## Access Points

| URL                            | Service    | Description           |
| ------------------------------ | ---------- | --------------------- |
| http://api.localhost           | medusa     | Admin/Store API       |
| http://localhost          | storefront | E-commerce storefront |
| http://admin.localhost         | medusa     | Admin dashboard       |
| http://minio.localhost         | minio      | S3-compatible storage |
| http://minio-console.localhost | minio      | MinIO management      |

## Init Job (medusa-init)

The `medusa-init` Job runs automatically on deployment to:

1. Wait for postgres and redis to be ready
2. Run database migrations
3. Run seed script (products, regions, etc.)
4. Create admin user (`MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD`)
5. Extract publishable API key from database
6. Create `storefront-key` Kubernetes secret

```bash
# View init job logs
kubectl logs job/medusa-init -n smap-store -f

# Check secret was created
kubectl get secret storefront-key -n smap-store -o jsonpath='{.data.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY}' | base64 -d
```

## MinIO Initialization (minio-init)

The `minio-init` Job runs automatically to initialize MinIO storage:

1. Wait for MinIO service to be ready
2. Configure MinIO client (mc) alias
3. Create `medusa` bucket
4. Set download policy (public read for file storage)

```bash
# View minio-init job logs
kubectl logs job/minio-init -n smap-store -f

# List buckets
kubectl exec -it deploy/minio -- mc ls myminio/
```

## Storefront Dependency Management

The Storefront deployment includes an init container that waits for the `storefront-key` secret with a valid publishable key before starting. This ensures:

- Storefront never starts without a valid API key
- The secret is automatically created by the `medusa-init` Job
- No manual secret creation required

## Admin Credentials

After deployment, admin credentials are set via `medusa-secret`:

```bash
# Get admin email
kubectl get configmap medusa-config -n smap-store -o jsonpath='{.data.ADMIN_EMAIL}'

# Default credentials (from medusa-secret):
# Email: admin@smap-store.local
# Password: supersecret
```

## Verify Deployment

```bash
# Check all pods
kubectl get pods -n smap-store

# Check services
kubectl get svc -n smap-store

# Check ingress
kubectl get ingress -n smap-store

# Test medusa health
kubectl exec -n smap-store deployment/medusa -- wget -qO- http://localhost:9000/health

# View medusa logs
kubectl logs -l app=medusa -n smap-store -f

# View storefront logs
kubectl logs -l app=storefront -n smap-store -f
```

## Resource Limits

| Service    | CPU Req | CPU Lim | Mem Req | Mem Lim | Replicas |
| ---------- | ------- | ------- | ------- | ------- | -------- |
| medusa     | 100m    | 500m    | 256Mi   | 1Gi     | 2        |
| storefront | 50m     | 300m    | 128Mi   | 512Mi   | 2        |
| postgres   | 100m    | 1       | 256Mi   | 1Gi     | 1        |
| redis      | 50m     | 200m    | 64Mi    | 256Mi   | 1        |
| minio      | 100m    | 500m    | 256Mi   | 1Gi     | 1        |

## Networking

| Service    | Port      | Purpose         |
| ---------- | --------- | --------------- |
| medusa     | 9000      | API             |
| storefront | 3000      | Web             |
| postgres   | 5432      | Database        |
| redis      | 6379      | Cache           |
| minio      | 9000/9001 | Storage/Console |

## Troubleshooting

```bash
# Restart deployments
kubectl rollout restart deployment/medusa -n smap-store
kubectl rollout restart deployment/storefront -n smap-store

# Check events
kubectl get events -n smap-store --sort-by='.lastTimestamp'

# Describe resources
kubectl describe pod -l app=medusa -n smap-store

# Exec into container
kubectl exec -it deploy/medusa -n smap-store -- sh

# Re-run init jobs (useful for fresh deployments)
kubectl delete job minio-init -n smap-store
kubectl delete job medusa-init -n smap-store
kubectl apply -f k8s/base/minio-init.yaml
kubectl apply -f k8s/base/medusa-init.yaml

# Full redeploy
kubectl delete namespace smap-store
kubectl apply -k k8s/base/
```

## Secrets

All secrets are defined in the manifests with placeholder values. Update these in `medusa.yaml` for production:

| Secret            | Keys                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| medusa-secret     | DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD |
| postgres-secret   | POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB                                                                                                   |
| redis-secret      | REDIS_PASSWORD                                                                                                                                  |
| minio-secret      | MINIO_ROOT_USER, MINIO_ROOT_PASSWORD                                                                                                            |
| storefront-secret | REVALIDATE_SECRET                                                                                                                               |

---

# Multi-Tenant Deployment (Production-Grade)

This section covers the production multi-tenant deployment architecture.

## Architecture Tiers

### PRO TIER (Dedicated Infrastructure)
Each tenant gets dedicated PostgreSQL, Redis, and MinIO instances.

| Resource | CPU | RAM | Storage |
|----------|-----|-----|---------|
| Medusa | 100m | 256Mi | - |
| Storefront | 50m | 128Mi | - |
| Redis | 50m | 64Mi | - |
| MinIO | 100m | 256Mi | 5Gi |
| PostgreSQL | 100m | 256Mi | 5Gi |
| **Per Tenant** | **400m** | **~1Gi** | **10Gi** |

### SHARED TIER (Managed Services)
All tenants share managed PostgreSQL, Redis, and S3 storage.

| Resource | CPU | RAM |
|----------|-----|-----|
| Medusa | 100m | 256Mi |
| Storefront | 50m | 128Mi |
| **Per Tenant** | **150m** | **~400Mi** |

## Directory Structure

```
k8s/
├── base/                         # Base manifests
├── overlays/
│   ├── tenant-template/          # PRO TIER overlay
│   │   ├── patches/
│   │   ├── secrets/
│   │   └── config/
│   └── tenant-shared-template/   # SHARED TIER overlay
│       ├── patches/
│       ├── secrets/
│       └── config/
└── tenants/
    ├── smap/                     # PRO TIER tenant
    ├── mytek/                    # PRO TIER tenant
    └── demo-shared/              # SHARED TIER tenant
```

## Deploying a Tenant

### PRO TIER (Dedicated)

```bash
# 1. Create tenant directory
mkdir -p k8s/tenants/my-new-tenant/{secrets,config}

# 2. Copy template files from existing tenant
cp k8s/tenants/smap/kustomization.yaml k8s/tenants/my-new-tenant/
cp -r k8s/tenants/smap/secrets k8s/tenants/my-new-tenant/
cp -r k8s/tenants/smap/config k8s/tenants/my-new-tenant/

# 3. Edit tenant-specific files
# - Update TENANT_NAME in config/domains.env
# - Update secrets in secrets/*.env
# - Rename TENANT references in kustomization.yaml

# 4. Deploy
./k8s/scripts/deploy-tenant.sh my-new-tenant
```

### SHARED TIER (Managed Services)

```bash
# 1. Create tenant directory
mkdir -p k8s/tenants/my-shared-tenant/{secrets,config}

# 2. Copy template files from demo-shared
cp k8s/tenants/demo-shared/kustomization.yaml k8s/tenants/my-shared-tenant/
cp -r k8s/tenants/demo-shared/secrets k8s/tenants/my-shared-tenant/
cp -r k8s/tenants/demo-shared/config k8s/tenants/my-shared-tenant/

# 3. Edit tenant-specific files
# - Update TENANT_NAME in config/domains.env
# - Update SHARED_DB_* and SHARED_REDIS_* in secrets/medusa.env
# - Update SHARED_SPACES_* for S3 storage

# 4. Deploy
./k8s/scripts/deploy-tenant.sh my-shared-tenant
```

## Required Managed Services

For SHARED TIER, provision the following:

### PostgreSQL (DigitalOcean Managed PostgreSQL)

```bash
# Create database
# Connection format: postgresql://user:password@host:port/database

# Grant permissions for tenant database
GRANT ALL PRIVILEGES ON DATABASE tenant_db TO shared_user;
```

### Redis (DigitalOcean Managed Redis)

```bash
# Connection format: redis://:password@host:port
```

### S3/Spaces (DigitalOcean Spaces)

```bash
# Create bucket: smap-store-shared
# Or use tenant-specific prefixes within the bucket
```

## Cost Comparison

| Tier | Per Tenant | 10 Tenants | Infrastructure |
|------|------------|------------|----------------|
| PRO | ~$37/mo | ~$370/mo | Dedicated DB/storage |
| SHARED | ~$12/mo | ~$79/mo | Managed services |

**Minimum DOKS Cluster**: 2x s-2vcpu-4gb = $24/mo + $10 management = $34/mo

## Quick Reference

| Command | Description |
|---------|-------------|
| `./k8s/scripts/deploy-tenant.sh <name>` | Deploy tenant |
| `kubectl get pods -n smap-store-<name>` | Check tenant pods |
| `kubectl logs -n smap-store-<name> -l app=medusa` | View tenant logs |

