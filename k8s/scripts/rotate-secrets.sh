#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TENANT_NAME="${1:-}"

usage() {
    cat <<EOF
Usage: $(basename "$0") <TENANT_NAME>

Rotate secrets for a tenant and trigger redeployment.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, globex)

Examples:
    $(basename "$0") acme    # Rotate secrets and redeploy acme
EOF
    exit 1
}

if [[ -z "$TENANT_NAME" ]]; then
    echo "Error: TENANT_NAME is required"
    usage
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"

if [[ ! -d "$TENANT_DIR" ]]; then
    echo "Error: Tenant directory not found: $TENANT_DIR"
    exit 1
fi

echo "=== Rotating secrets for tenant: $TENANT_NAME ==="
echo ""

# Generate new secrets
echo "Generating new secrets..."
"$SCRIPT_DIR/generate-secrets.sh" "$TENANT_DIR/secrets/secrets.env"

# Copy TENANT_DOMAIN from old backup if exists
BACKUP_FILE="$TENANT_DIR/secrets/secrets.env.bak"
if [[ -f "$BACKUP_FILE" ]]; then
    OLD_DOMAIN=$(grep TENANT_DOMAIN "$BACKUP_FILE" | cut -d= -f2)
    sed -i "s|TENANT_DOMAIN=.*|TENANT_DOMAIN=${OLD_DOMAIN}|" "$TENANT_DIR/secrets/secrets.env"
    echo "Preserved TENANT_DOMAIN: $OLD_DOMAIN"
fi

# Copy TRAEFIK_IP and other config from old backup if exists
if [[ -f "$BACKUP_FILE" ]]; then
    for key in TRAEFIK_IP IMAGE_TAG REGISTRY; do
        OLD_VALUE=$(grep "^${key}=" "$BACKUP_FILE" | cut -d= -f2)
        if [[ -n "$OLD_VALUE" ]]; then
            sed -i "s|${key}=.*|${key}=${OLD_VALUE}|" "$TENANT_DIR/secrets/secrets.env"
        fi
    done
fi

echo ""
echo "Backing up old secrets..."
cp "$TENANT_DIR/secrets/secrets.env" "$BACKUP_FILE"

echo ""
echo "Applying new secrets to cluster..."
"$SCRIPT_DIR/deploy-tenant.sh" "$TENANT_NAME"

echo ""
echo "=== Secrets rotated successfully ==="
echo ""
echo "Old secrets backed up to: $BACKUP_FILE"
