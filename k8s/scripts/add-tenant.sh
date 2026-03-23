#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
TENANT_NAME=""
TIER="pro"

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [OPTIONS]

Create a new tenant from the tenant-template.

Arguments:
    TENANT_NAME    Name of the new tenant (e.g., acme, globex, demo-shared)

Options:
    -t, --tier TIER     Deployment tier: "pro" or "shared" (default: pro)
    -h, --help           Show this help message

Examples:
    $(basename "$0") acme              # Create PRO tier tenant
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

if [[ "$TIER" != "pro" && "$TIER" != "shared" ]]; then
    echo "Error: Invalid tier '$TIER'. Must be 'pro' or 'shared'."
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
    echo "Using PRO tier template"
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

# Create shared.env marker for shared tier
if [[ "$TIER" == "shared" ]]; then
    echo "SHARED=true" > "$TENANT_DIR/config/shared.env"
fi

# Generate secrets based on tier
echo "Generating secrets..."

if [[ "$TIER" == "shared" ]]; then
    # SHARED TIER - Uses Docker host
    # Get Docker host IP (default to HOST_IP)
    DOCKER_HOST="${SHARED_PG_HOST:-$(hostname -I | awk '{print $1}')}"
    
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 16)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
    REVALIDATE_SECRET=$(openssl rand -hex 24)

    # medusa.env for shared tier
    cat > "$TENANT_DIR/secrets/medusa.env" << SECRETSEOF
# SHARED TIER - Uses shared Docker containers
TENANT_NAME=${TENANT_NAME}

# PostgreSQL (shared Docker container)
DATABASE_URL=postgresql://medusa:${DB_PASSWORD}@${DOCKER_HOST}:5432/${TENANT_NAME}?sslmode=disable

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
SECRETSEOF

    # storefront.env for shared tier
    cat > "$TENANT_DIR/secrets/storefront.env" << SECRETSEOF
REVALIDATE_SECRET=${REVALIDATE_SECRET}
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_STOREFRONT_URL=http://${TENANT_NAME}.localhost
SECRETSEOF

else
    # PRO TIER - Uses Kubernetes services
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 16)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
    REVALIDATE_SECRET=$(openssl rand -hex 24)

    # medusa.env for PRO tier
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
