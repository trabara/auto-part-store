#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
TENANT_NAME=""
TIER="auto"

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [OPTIONS]

Regenerate secrets for an existing tenant.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, demo-shared)

Options:
    -t, --tier TIER     Deployment tier: "dedicated", "shared", or "auto" (default: auto)
    -h, --help          Show this help message

Examples:
    $(basename "$0") acme              # Regenerate dedicated tier secrets (auto-detect)
    $(basename "$0") demo-shared -t shared  # Force regenerate as shared tier
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

if [[ "$TIER" != "dedicated" && "$TIER" != "shared" && "$TIER" != "auto" ]]; then
    echo "Error: Invalid tier '$TIER'. Must be 'dedicated', 'shared', or 'auto'."
    exit 1
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"
SECRETS_DIR="$TENANT_DIR/secrets"

if [[ ! -d "$SECRETS_DIR" ]]; then
    echo "Error: Tenant secrets directory not found: $SECRETS_DIR"
    echo "Use add-tenant.sh first to create the tenant."
    exit 1
fi

# Auto-detect tier
if [[ "$TIER" == "auto" ]]; then
    if [[ -f "$TENANT_DIR/config/shared.env" ]]; then
        TIER="shared"
    else
        TIER="dedicated"
    fi
fi

echo "=== Regenerating secrets for tenant: $TENANT_NAME ==="
echo "Tier: $TIER"
echo ""

# Generate random passwords
if [[ "$TIER" == "shared" ]]; then
    # SHARED TIER - Uses Docker host
    DOCKER_HOST="${SHARED_PG_HOST:-$(hostname -I | awk '{print $1}')}"
    
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 16)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
    REVALIDATE_SECRET=$(openssl rand -hex 24)

    # Backup old secrets
    echo "Backing up old secrets..."
    mkdir -p "$SECRETS_DIR/.backup"
    cp "$SECRETS_DIR/"*.env "$SECRETS_DIR/.backup/" 2>/dev/null || true

    # medusa.env for shared tier
    cat > "$SECRETS_DIR/medusa.env" << SECRETSEOF
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
    cat > "$SECRETS_DIR/storefront.env" << SECRETSEOF
REVALIDATE_SECRET=${REVALIDATE_SECRET}
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_STOREFRONT_URL=http://${TENANT_NAME}.localhost
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

    # Backup old secrets
    echo "Backing up old secrets..."
    mkdir -p "$SECRETS_DIR/.backup"
    cp "$SECRETS_DIR/"*.env "$SECRETS_DIR/.backup/" 2>/dev/null || true

    # medusa.env for dedicated tier
    cat > "$SECRETS_DIR/medusa.env" << SECRETSEOF
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
    cat > "$SECRETS_DIR/postgres.env" << SECRETSEOF
POSTGRES_USER=medusa
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=medusa-v2
SECRETSEOF

    # redis.env
    cat > "$SECRETS_DIR/redis.env" << SECRETSEOF
REDIS_PASSWORD=${REDIS_PASSWORD}
SECRETSEOF

    # minio.env
    cat > "$SECRETS_DIR/minio.env" << SECRETSEOF
MINIO_ROOT_USER=${TENANT_NAME}minio
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
SECRETSEOF

    # storefront.env
    cat > "$SECRETS_DIR/storefront.env" << SECRETSEOF
REVALIDATE_SECRET=${REVALIDATE_SECRET}
SECRETSEOF
fi

echo ""
echo "=== Secrets regenerated successfully ==="
echo ""
echo "Old secrets backed up to: $SECRETS_DIR/.backup/"
echo ""
echo "Next steps:"
echo ""
echo "1. Deploy to apply new secrets:"
echo "   $SCRIPT_DIR/deploy-tenant.sh $TENANT_NAME --tier $TIER"
echo ""
echo "2. Note: This will rotate all credentials."
echo "   Existing data may need to be re-initialized."
