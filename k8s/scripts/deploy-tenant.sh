#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TENANT_NAME="${1:-}"
ENVIRONMENT="${2:-development}"

usage() {
    cat <<EOF
Usage: $(basename "$0") <TENANT_NAME> [ENVIRONMENT]

Deploy a tenant to the specified environment.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, globex)
    ENVIRONMENT    Environment to deploy to (default: development)

Examples:
    $(basename "$0") acme              # Deploy acme tenant to development
    $(basename "$0") acme production    # Deploy acme tenant to production
EOF
    exit 1
}

if [[ -z "$TENANT_NAME" ]]; then
    echo "Error: TENANT_NAME is required"
    usage
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"
DOMAINS_FILE="$TENANT_DIR/config/domains.env"

if [[ ! -d "$TENANT_DIR" ]]; then
    echo "Error: Tenant directory not found: $TENANT_DIR"
    echo "Use add-tenant.sh to create a new tenant first."
    exit 1
fi

if [[ ! -f "$TENANT_DIR/secrets/secrets.env" ]]; then
    echo "Error: Secrets file not found: $TENANT_DIR/secrets/secrets.env"
    echo "Run generate-secrets.sh to create secrets first."
    exit 1
fi

if [[ ! -f "$DOMAINS_FILE" ]]; then
    echo "Error: Domains file not found: $DOMAINS_FILE"
    echo "Create config/domains.env for the tenant first."
    exit 1
fi

echo "=== Deploying tenant: $TENANT_NAME ==="
echo "Environment: $ENVIRONMENT"
echo ""

echo "Building manifest with kustomize..."
MANIFEST=$(kubectl kustomize "$TENANT_DIR")

# Load domain variables from domains.env
set -a
source "$DOMAINS_FILE"
set +a

# Replace all domain placeholders
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT_DOMAIN/${TENANT_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/API_DOMAIN/${API_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/SHOP_DOMAIN/${SHOP_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/ADMIN_DOMAIN/${ADMIN_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_DOMAIN/${MINIO_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_CONSOLE_DOMAIN/${MINIO_CONSOLE_DOMAIN}/g")

# Replace other placeholders
MANIFEST=$(echo "$MANIFEST" | sed "s/TRAEFIK_IP/${TRAEFIK_IP}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/:IMAGE_TAG/:${IMAGE_TAG}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s|REGISTRY/smap-store-|${REGISTRY}/smap-store-|g")

# Replace service hostnames (derived from namePrefix)
# The namePrefix in kustomization adds prefix to all resources including services
MANIFEST=$(echo "$MANIFEST" | sed "s/POSTGRES_HOST/${TENANT_NAME}-postgres/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/REDIS_HOST/${TENANT_NAME}-redis/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_HOST/${TENANT_NAME}-minio/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/STOREFRONT_KEY_SECRET/${TENANT_NAME}-storefront-key/g")

# Apply the manifest
echo "$MANIFEST" | kubectl apply -f -

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Check status with:"
echo "  kubectl get pods -n smap-store-$TENANT_NAME"
echo ""
echo "View logs with:"
echo "  kubectl logs -n smap-store-$TENANT_NAME -l app=medusa"
