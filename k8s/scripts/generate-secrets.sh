#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TENANT_NAME="${1:-}"

usage() {
    cat <<EOF
Usage: $(basename "$0") <TENANT_NAME>

Regenerate secrets for an existing tenant.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, globex, mytek)

Examples:
    $(basename "$0") acme    # Regenerate acme secrets
    $(basename "$0") mytek  # Regenerate mytek secrets
EOF
    exit 1
}

if [[ -z "$TENANT_NAME" ]]; then
    echo "Error: TENANT_NAME is required"
    usage
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"
SECRETS_DIR="$TENANT_DIR/secrets"

if [[ ! -d "$SECRETS_DIR" ]]; then
    echo "Error: Tenant secrets directory not found: $SECRETS_DIR"
    echo "Use add-tenant.sh first to create the tenant."
    exit 1
fi

echo "=== Regenerating secrets for tenant: $TENANT_NAME ==="
echo ""

# Generate random passwords
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 16)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
REVALIDATE_SECRET=$(openssl rand -hex 24)

# medusa.env
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

echo "=== Secrets regenerated successfully ==="
echo ""
echo "Next steps:"
echo ""
echo "1. Deploy to apply new secrets:"
echo "   $SCRIPT_DIR/deploy-tenant.sh $TENANT_NAME"
echo ""
echo "2. Note: This will rotate all credentials."
echo "   Existing data may need to be re-initialized."
