#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TENANT_NAME="${1:-}"
ENVIRONMENT="${2:-development}"

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [ENVIRONMENT]

Deploy a tenant to the specified environment.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, globex)
    ENVIRONMENT    Environment to deploy to (default: development)

Examples:
    $(basename "$0") acme              # Deploy acme tenant to development
    $(basename "$0") acme production    # Deploy acme tenant to production
USAGE
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

if [[ ! -d "$TENANT_DIR/secrets" ]]; then
    echo "Error: Secrets directory not found: $TENANT_DIR/secrets"
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

# Set default HOST_IP if not defined (for Docker Desktop compatibility)
HOST_IP="${HOST_IP:-$(hostname -I | awk '{print $1}')}"

# Kustomize namePrefix adds prefix to all resources including middleware metadata names
# Extract the actual service prefix from TENANT_NAME (first hyphen-separated part)
# For example: "demo-shared" -> "demo", "smap" -> "smap"
SERVICE_PREFIX=$(echo "$TENANT_NAME" | cut -d'-' -f1)

# Check if tenant uses shared template (has shared-config marker)
IS_SHARED=false
if [[ -f "$TENANT_DIR/config/shared.env" ]]; then
    IS_SHARED=true
fi

# Extract Docker host IPs from secrets for shared tier
if [[ "$IS_SHARED" == "true" ]]; then
    MEDUSA_SECRETS_FILE="$TENANT_DIR/secrets/medusa.env"
    if [[ -f "$MEDUSA_SECRETS_FILE" ]]; then
        set -a
        source "$MEDUSA_SECRETS_FILE"
        set +a
        
        # Extract PostgreSQL host from DATABASE_URL
        DOCKER_PG_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
        DOCKER_REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|redis://:[^@]*@\([^:]*\):.*|\1|p')
        
        # Replace database name in DATABASE_URL with tenant name
        # Format: postgresql://user:pass@host:port/TENANT_NAME?sslmode=...
        DATABASE_URL=$(echo "$DATABASE_URL" | sed "s|/[^?]*|/${TENANT_NAME}|")
        
        # Create database if it doesn't exist (for shared tier)
        echo "Creating database '$TENANT_NAME' if not exists..."
        PG_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
        PG_PASS=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
        PG_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
        
        # Create database using psql (install if needed)
        docker exec smap-shared-postgres psql -U medusa -c "CREATE DATABASE \"$TENANT_NAME\";" 2>/dev/null || echo "Database may already exist"
        
        echo "Shared tier detected - using Docker hosts:"
        echo "  PostgreSQL: $DOCKER_PG_HOST"
        echo "  Redis: $DOCKER_REDIS_HOST"
        echo "  Database: $TENANT_NAME"
    fi
fi

# Replace all domain placeholders
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT_DOMAIN/${TENANT_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/API_DOMAIN/${API_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/SHOP_DOMAIN/${SHOP_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/ADMIN_DOMAIN/${ADMIN_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_DOMAIN/${MINIO_DOMAIN}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_CONSOLE_DOMAIN/${MINIO_CONSOLE_DOMAIN}/g")

# Replace other placeholders
MANIFEST=$(echo "$MANIFEST" | sed "s/TRAEFIK_IP/${TRAEFIK_IP}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/HOST_IP/${HOST_IP}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/:IMAGE_TAG/:${IMAGE_TAG}/g")
MANIFEST=$(echo "$MANIFEST" | sed "s|REGISTRY/smap-store-|${REGISTRY}/smap-store-|g")

# Replace service hostnames (derived from namePrefix)
# For shared tier, use Docker host IPs extracted from secrets
if [[ "$IS_SHARED" == "true" ]]; then
    MANIFEST=$(echo "$MANIFEST" | sed "s/POSTGRES_HOST/${DOCKER_PG_HOST}/g")
    MANIFEST=$(echo "$MANIFEST" | sed "s/REDIS_HOST/${DOCKER_REDIS_HOST}/g")
    MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_HOST/${DOCKER_PG_HOST}/g")
    # Replace DATABASE_URL with tenant-specific database name
    MANIFEST=$(echo "$MANIFEST" | sed "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|g")
else
    MANIFEST=$(echo "$MANIFEST" | sed "s/POSTGRES_HOST/${SERVICE_PREFIX}-postgres/g")
    MANIFEST=$(echo "$MANIFEST" | sed "s/REDIS_HOST/${SERVICE_PREFIX}-redis/g")
    MANIFEST=$(echo "$MANIFEST" | sed "s/MINIO_HOST/${SERVICE_PREFIX}-minio/g")
fi

# Replace TENANT prefix in middleware names in IngressRoute routes (NOT the middleware metadata name)
# Kustomize namePrefix adds prefix to middleware metadata name, so we don't need to replace it
# The ingress route references use the prefixed name automatically from kustomize

# Replace service names in IngressRoute specs (kustomize namePrefix doesn't apply to nested service refs)
# Use SERVICE_PREFIX for correct service naming
MANIFEST=$(echo "$MANIFEST" | sed "s/    - name: medusa$/    - name: ${SERVICE_PREFIX}-medusa/g")

# Replace TENANT-medusa references (used in ConfigMaps for NEXT_PUBLIC_MEDUSA_BACKEND_URL)
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT-medusa/${SERVICE_PREFIX}-medusa/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/    - name: storefront$/    - name: ${SERVICE_PREFIX}-storefront/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/    - name: minio$/    - name: ${SERVICE_PREFIX}-minio/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/    - name: postgres$/    - name: ${SERVICE_PREFIX}-postgres/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/    - name: redis$/    - name: ${SERVICE_PREFIX}-redis/g")

# Replace middleware references in IngressRoute routes (kustomize namePrefix doesn't apply here)
# The base middleware name is "TENANT-admin-redirect" and "TENANT-api-app-redirect"
# After kustomize, these become "${SERVICE_PREFIX}-admin-redirect" etc.
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT-api-app-redirect/${SERVICE_PREFIX}-api-app-redirect/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT-admin-redirect/${SERVICE_PREFIX}-admin-redirect/g")

# Replace secret names for shared tier
if [[ "$IS_SHARED" == "true" ]]; then
    MANIFEST=$(echo "$MANIFEST" | sed "s/STOREFRONT_KEY_SECRET/storefront-key/g")
fi

# Replace namespace name
MANIFEST=$(echo "$MANIFEST" | sed "s/NAMESPACE_NAME/smap-store-${TENANT_NAME}/g")

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
