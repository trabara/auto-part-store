#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TENANT_NAME="${1:-}"

usage() {
    cat <<EOF
Usage: $(basename "$0") <TENANT_NAME>

Create a new tenant from the tenant-template.

Arguments:
    TENANT_NAME    Name of the new tenant (e.g., acme, globex)

Examples:
    $(basename "$0") acme    # Create acme tenant
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
mkdir -p "$TENANT_DIR/secrets"

# Copy tenant template files
cp "$SCRIPT_DIR/../overlays/tenant-template/kustomization.yaml" "$TENANT_DIR/kustomization.yaml"
cp "$SCRIPT_DIR/../overlays/tenant-template/patches/"*.yaml "$TENANT_DIR/" 2>/dev/null || true

# Update kustomization.yaml for the new tenant
sed -i "s/namespace: smap-store-TENANT_NAME/namespace: smap-store-$TENANT_NAME/" "$TENANT_DIR/kustomization.yaml"
sed -i "s/namePrefix: TENANT_NAME-/namePrefix: $TENANT_NAME-/" "$TENANT_DIR/kustomization.yaml"
sed -i "s|TENANT_NAME|${TENANT_NAME}|g" "$TENANT_DIR/kustomization.yaml"

# Generate secrets
echo "Generating secrets..."
"$SCRIPT_DIR/generate-secrets.sh" "$TENANT_DIR/secrets/secrets.env"

# Update TENANT_DOMAIN
sed -i "s|CHANGE_ME.localhost|${TENANT_NAME}.localhost|" "$TENANT_DIR/secrets/secrets.env"

echo ""
echo "=== Tenant created successfully ==="
echo ""
echo "Next steps:"
echo ""
echo "1. Review and update secrets:"
echo "   $TENANT_DIR/secrets/secrets.env"
echo ""
echo "2. Deploy the tenant:"
echo "   $SCRIPT_DIR/deploy-tenant.sh $TENANT_NAME"
echo ""
echo "3. Add to CI/CD (update ci/deploy.yml with tenant name)"
