#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
TENANT_NAME=""
TIER="dedicated"

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [OPTIONS]

Create a new tenant from the tenant-template.

Arguments:
    TENANT_NAME    Name of the new tenant (e.g., acme, globex, demo-shared)

Options:
    -t, --tier TIER     Deployment tier: "dedicated" or "shared" (default: dedicated)
    -h, --help           Show this help message

Examples:
    $(basename "$0") acme              # Create dedicated tier tenant
    $(basename "$0") demo-shared -t shared  # Create SHARED tier tenant
USAGE
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tier)
            TIER="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [[ -z "$TENANT_NAME" ]]; then
                TENANT_NAME="$1"
            else
                echo "Unknown argument: $1"
                usage
            fi
            shift
            ;;
    esac
done

if [[ -z "$TENANT_NAME" ]]; then
    echo "Error: TENANT_NAME is required"
    usage
fi

if [[ "$TIER" != "dedicated" && "$TIER" != "shared" ]]; then
    echo "Error: Invalid tier '$TIER'. Must be 'dedicated' or 'shared'."
    exit 1
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"

if [[ -d "$TENANT_DIR" ]]; then
    echo "Error: Tenant directory already exists: $TENANT_DIR"
    exit 1
fi

if [[ ! "$TENANT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "Error: TENANT_NAME must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

echo "=== Creating new tenant: $TENANT_NAME ==="
echo "Tier: $TIER"
echo ""

# Create tenant directory structure
mkdir -p "$TENANT_DIR/config"
mkdir -p "$TENANT_DIR/secrets"

# Determine which template to use based on tier
if [[ "$TIER" == "shared" ]]; then
    TEMPLATE_OVERLAY="../../overlays/tenant-shared-template"
    echo "Using shared tier template"
else
    TEMPLATE_OVERLAY="../../overlays/tenant-template"
    echo "Using dedicated tier template"
fi

# Create tenant kustomization.yaml (references the template overlay)
cat > "$TENANT_DIR/kustomization.yaml" << KUSTOMIZEEOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: smap-store-${TENANT_NAME}

resources:
  - ${TEMPLATE_OVERLAY}

images:
  - name: medusa
    newName: localhost:5000/smap-store-medusa
    newTag: latest
  - name: storefront
    newName: localhost:5000/smap-store-storefront
    newTag: latest

configMapGenerator:
  - name: medusa-config
    behavior: replace
    envs:
      - config/medusa.env
  - name: storefront-config
    behavior: replace
    envs:
      - config/storefront.env

secretGenerator:
  - name: medusa-secret
    behavior: replace
    envs:
      - secrets/medusa.env
  - name: storefront-secret
    behavior: replace
    envs:
      - secrets/storefront.env
KUSTOMIZEEOF

# Add dedicated-tier-specific secret generators
if [[ "$TIER" != "shared" ]]; then
    cat >> "$TENANT_DIR/kustomization.yaml" << 'KUSTOMIZEEOF'
  - name: postgres-secret
    behavior: replace
    envs:
      - secrets/postgres.env
  - name: redis-secret
    behavior: replace
    envs:
      - secrets/redis.env
  - name: minio-secret
    behavior: replace
    envs:
      - secrets/minio.env
KUSTOMIZEEOF
fi

cat >> "$TENANT_DIR/kustomization.yaml" << KUSTOMIZEEOF

namePrefix: ${TENANT_NAME}-
KUSTOMIZEEOF

# Create config/domains.env
cat > "$TENANT_DIR/config/domains.env" << DOMAINSEOF
# Domain configuration for $TENANT_NAME
TENANT_DOMAIN=${TENANT_NAME}.localhost
API_DOMAIN=api.${TENANT_NAME}.localhost
SHOP_DOMAIN=${TENANT_NAME}.localhost
ADMIN_DOMAIN=admin.${TENANT_NAME}.localhost
MINIO_DOMAIN=minio.${TENANT_NAME}.localhost
MINIO_CONSOLE_DOMAIN=minio-console.${TENANT_NAME}.localhost

# Infrastructure
TRAEFIK_IP=127.0.0.1
HOST_IP=127.0.0.1
IMAGE_TAG=latest
REGISTRY=localhost:5000
DOMAINSEOF

# Create config/medusa.env (placeholder values replaced during deploy)
cat > "$TENANT_DIR/config/medusa.env" << CONFIGEOF
NODE_ENV=production
STORE_CORS=http://SHOP_DOMAIN
ADMIN_CORS=http://ADMIN_DOMAIN
AUTH_CORS=http://SHOP_DOMAIN
ADMIN_EMAIL=admin@TENANT_DOMAIN
ADMIN_URL=http://ADMIN_DOMAIN
MINIO_ENDPOINT=HOST_IP:9000
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
CONFIGEOF

# Create config/storefront.env (placeholder values replaced during deploy)
cat > "$TENANT_DIR/config/storefront.env" << CONFIGEOF
NEXT_PUBLIC_BASE_URL=http://SHOP_DOMAIN
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://TENANT-medusa:9000
NODE_ENV=production
CONFIGEOF

# Create shared.env marker for shared tier
if [[ "$TIER" == "shared" ]]; then
    echo "SHARED=true" > "$TENANT_DIR/config/shared.env"
fi

# Generate secrets based on tier
echo "Generating secrets..."

if [[ "$TIER" == "shared" ]]; then
    # SHARED TIER - Uses shared Docker containers
    # Use Docker bridge gateway IP - accessible from both host and K8s pods
    DOCKER_HOST="172.17.0.1"

    # Shared PostgreSQL medusa superuser password (matches Docker container)
    DB_PASSWORD="shared_db_pass_2026"
    # Shared Redis password (matches Docker container)
    REDIS_PASSWORD="shared_redis_pass_2026"
    # Generated secrets per tenant
    SHARED_DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
    MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 16)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
    REVALIDATE_SECRET=$(openssl rand -hex 24)

    # medusa.env for shared tier
    cat > "$TENANT_DIR/secrets/medusa.env" << SECRETSEOF
# SHARED TIER - Uses shared Docker containers
TENANT_NAME=${TENANT_NAME}

# PostgreSQL - medusa superuser (for migrations and runtime)
DATABASE_URL=postgresql://medusa:${DB_PASSWORD}@${DOCKER_HOST}:5432/${TENANT_NAME}?sslmode=disable

# Shared PostgreSQL - shared_user password (created by medusa-init via setup-shared-db.js)
SHARED_DB_PASS=${SHARED_DB_PASS}

# Redis (shared Docker container)
REDIS_URL=redis://:${REDIS_PASSWORD}@${DOCKER_HOST}:6379

# JWT and Cookie secrets
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# Shared MinIO
MINIO_ENDPOINT=${DOCKER_HOST}:9000
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY=smapadmin
MINIO_SECRET_KEY=${MINIO_PASSWORD}
MINIO_BUCKET=smap-store-shared

# Admin credentials
MEDUSA_ADMIN_EMAIL=admin@${TENANT_NAME}.localhost
MEDUSA_ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Required for Medusa (set to false for HTTP/Traefik)
COOKIE_SECURE=false

# K8s API host for init job (shared tier pods can't reach cluster IP 10.43.0.1)
KUBERNETES_API_HOST=172.17.0.1
KUBERNETES_API_PORT=6443
SECRETSEOF

    # storefront.env for shared tier
    cat > "$TENANT_DIR/secrets/storefront.env" << SECRETSEOF
REVALIDATE_SECRET=${REVALIDATE_SECRET}
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_STOREFRONT_URL=http://${TENANT_NAME}.localhost
KUBERNETES_API_HOST=172.17.0.1
KUBERNETES_API_PORT=6443
SECRETSEOF

else
    # DEDICATED TIER - Uses Kubernetes services
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 16)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
    REVALIDATE_SECRET=$(openssl rand -hex 24)

    # medusa.env for dedicated tier
    cat > "$TENANT_DIR/secrets/medusa.env" << SECRETSEOF
DATABASE_URL=postgresql://medusa:${DB_PASSWORD}@${TENANT_NAME}-postgres:5432/medusa-v2?sslmode=disable
REDIS_URL=redis://:${REDIS_PASSWORD}@${TENANT_NAME}-redis:6379
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
MINIO_ACCESS_KEY=${TENANT_NAME}minio
MINIO_SECRET_KEY=${MINIO_PASSWORD}
MINIO_BUCKET=medusa
MEDUSA_ADMIN_EMAIL=admin@${TENANT_NAME}.localhost
MEDUSA_ADMIN_PASSWORD=${ADMIN_PASSWORD}
COOKIE_SECURE=false
SECRETSEOF

    # postgres.env
    cat > "$TENANT_DIR/secrets/postgres.env" << SECRETSEOF
POSTGRES_USER=medusa
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=medusa-v2
SECRETSEOF

    # redis.env
    cat > "$TENANT_DIR/secrets/redis.env" << SECRETSEOF
REDIS_PASSWORD=${REDIS_PASSWORD}
SECRETSEOF

    # minio.env
    cat > "$TENANT_DIR/secrets/minio.env" << SECRETSEOF
MINIO_ROOT_USER=${TENANT_NAME}minio
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
SECRETSEOF

    # storefront.env
    cat > "$TENANT_DIR/secrets/storefront.env" << SECRETSEOF
REVALIDATE_SECRET=${REVALIDATE_SECRET}
SECRETSEOF
fi

echo ""
echo "=== Tenant created successfully ==="
echo ""
echo "Directory: $TENANT_DIR"
echo ""
echo "Files created:"
ls -la "$TENANT_DIR"
echo ""
echo "Secrets generated:"
ls -la "$TENANT_DIR/secrets"
echo ""
echo "Next steps:"
echo ""
echo "1. Review secrets:"
echo "   cat $TENANT_DIR/secrets/*.env"
echo ""
echo "2. Deploy the tenant:"
echo "   $SCRIPT_DIR/deploy-tenant.sh $TENANT_NAME --tier $TIER"
echo ""
echo "3. Access the tenant:"
echo "   - Shop: http://${TENANT_NAME}.localhost"
echo "   - API:  http://api.${TENANT_NAME}.localhost/health"
echo "   - Admin: http://admin.${TENANT_NAME}.localhost/app"
