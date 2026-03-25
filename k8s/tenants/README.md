# Tenant Secrets

This directory contains per-tenant configuration and secrets.

## Adding a New Tenant

1. Create a new directory for your tenant:

   ```bash
   mkdir -p k8s/tenants/<tenant-name>/secrets
   ```

2. Copy the template secrets file:

   ```bash
   cp k8s/overlays/tenant-template/secrets/secrets.env \
      k8s/tenants/<tenant-name>/secrets/secrets.env
   ```

3. Edit the secrets file with your tenant's values:

   ```bash
   # Generate secure passwords:
   ./k8s/scripts/generate-secrets.sh k8s/tenants/<tenant-name>/secrets/secrets.env
   ```

4. Create a kustomization.yaml for your tenant (or use the template):

   ```bash
   cp k8s/overlays/tenant-template/kustomization.yaml \
      k8s/tenants/<tenant-name>/kustomization.yaml
   ```

5. Edit the tenant's kustomization.yaml to set TENANT_NAME and paths

## Secrets Structure

Each `secrets.env` file should contain:

```bash
# Database
DB_USERNAME=medusa
DB_PASSWORD=<generated>

# Redis
REDIS_PASSWORD=<generated>

# MinIO
MINIO_ROOT_USER=<generated>
MINIO_ROOT_PASSWORD=<generated>

# Medusa
JWT_SECRET=<generated>
COOKIE_SECRET=<generated>

# Storefront
REVALIDATE_SECRET=<generated>

# Configuration
TENANT_DOMAIN=acme.localhost
TRAEFIK_IP=<your-traefik-ip>
IMAGE_TAG=latest
REGISTRY=<your-registry>
```

## Important

- **Never commit secrets.env files to git**
- **Rotate credentials regularly**
- **Use unique passwords per tenant**

## Deploying

```bash
# Deploy a tenant
./k8s/scripts/deploy-tenant.sh <tenant-name>

# Rotate secrets
./k8s/scripts/rotate-secrets.sh <tenant-name>
```
