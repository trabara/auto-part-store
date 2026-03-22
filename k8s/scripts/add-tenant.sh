#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TENANT_NAME="${1:-}"

usage() {
    cat <<EOF
Usage: $(basename "$0") <TENANT_NAME>

Create a new tenant from the tenant-template.

Arguments:
    TENANT_NAME    Name of the new tenant (e.g., acme, globex, mytek)

Examples:
    $(basename "$0") acme    # Create acme tenant
    $(basename "$0") mytek  # Create mytek tenant
EOF
    exit 1
}

if [[ -z "$TENANT_NAME" ]]; then
    echo "Error: TENANT_NAME is required"
    usage
fi

if [[ ! "$TENANT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "Error: TENANT_NAME must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"

if [[ -d "$TENANT_DIR" ]]; then
    echo "Error: Tenant directory already exists: $TENANT_DIR"
    exit 1
fi

echo "=== Creating new tenant: $TENANT_NAME ==="
echo ""

# Create tenant directory structure
mkdir -p "$TENANT_DIR/config"
mkdir -p "$TENANT_DIR/secrets"

# Copy tenant template kustomization
cp "$SCRIPT_DIR/../overlays/tenant-template/kustomization.yaml" "$TENANT_DIR/kustomization.yaml"

# Update kustomization.yaml for the new tenant
sed -i "s/namespace: smap-store-TENANT_NAME/namespace: smap-store-$TENANT_NAME/" "$TENANT_DIR/kustomization.yaml"
sed -i "s/namePrefix: TENANT_NAME-/namePrefix: $TENANT_NAME-/" "$TENANT_DIR/kustomization.yaml"
sed -i "s/namePrefix: smap-/namePrefix: $TENANT_NAME-/" "$TENANT_DIR/kustomization.yaml"
sed -i "s|localhost:5000/smap-store-|localhost:5000/smap-store-|g" "$TENANT_DIR/kustomization.yaml"
sed -i "s|localhost:5000/smap-store-|localhost:5000/smap-store-|g" "$TENANT_DIR/kustomization.yaml"

# Create config/domains.env from template
cp "$SCRIPT_DIR/../overlays/tenant-template/config/domains.env" "$TENANT_DIR/config/domains.env"
sed -i "s/tenant.localhost/${TENANT_NAME}.localhost/g" "$TENANT_DIR/config/domains.env"

# Generate secrets for each component
echo "Generating secrets..."

# Generate random passwords
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 24)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 16)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 12)
REVALIDATE_SECRET=$(openssl rand -hex 24)

# medusa.env
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

echo ""
echo "=== Tenant created successfully ==="
echo ""
echo "Directory: $TENANT_DIR"
echo ""
echo "Files created:"
echo "  - config/domains.env"
echo "  - secrets/medusa.env"
echo "  - secrets/postgres.env"
echo "  - secrets/redis.env"
echo "  - secrets/minio.env"
echo "  - secrets/storefront.env"
echo ""
echo "Next steps:"
echo ""
echo "1. Review secrets:"
echo "   cat $TENANT_DIR/secrets/*.env"
echo ""
echo "2. Deploy the tenant:"
echo "   $SCRIPT_DIR/deploy-tenant.sh $TENANT_NAME"
echo ""
echo "3. Access the tenant:"
echo "   - Shop: http://shop.${TENANT_NAME}.localhost"
echo "   - API:  http://api.${TENANT_NAME}.localhost/health"
echo "   - Admin: http://admin.${TENANT_NAME}.localhost/app"
echo ""
