#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
TENANT_NAME=""
ENVIRONMENT="development"
TIER="auto"

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [OPTIONS]

Deploy a tenant to the specified environment.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, globex, demo-shared)

Options:
    -t, --tier TIER     Deployment tier: "dedicated" or "shared" (default: auto-detect from tenant config)
    -e, --env ENV       Environment to deploy to (default: development)
    -h, --help          Show this help message

Examples:
    $(basename "$0") acme              # Deploy acme tenant (auto-detect tier)
    $(basename "$0") demo-shared --tier shared   # Deploy as shared tier
    $(basename "$0") acme --env production --tier dedicated
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
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        -*)
            echo "Unknown option: $1"
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

# Auto-detect tier from config if set to "auto" or not explicitly provided
if [[ "$TIER" == "auto" ]] || [[ ! -f "$TENANT_DIR/config/shared.env" && "$TIER" == "dedicated" ]]; then
    if [[ -f "$TENANT_DIR/config/shared.env" ]]; then
        TIER="shared"
    else
        TIER="dedicated"
    fi
fi

# Validate tier
if [[ "$TIER" != "dedicated" && "$TIER" != "shared" ]]; then
    echo "Error: Invalid tier '$TIER'. Must be 'dedicated' or 'shared'."
    exit 1
fi

IS_SHARED=false
if [[ "$TIER" == "shared" ]]; then
    IS_SHARED=true
    
    # Create shared.env marker if it doesn't exist
    if [[ ! -f "$TENANT_DIR/config/shared.env" ]]; then
        echo "SHARED=true" > "$TENANT_DIR/config/shared.env"
        echo "Created shared.env marker file"
    fi
fi

echo "=== Deploying tenant: $TENANT_NAME ==="
echo "Tier: $TIER"
echo "Environment: $ENVIRONMENT"
echo ""

echo "Building manifest with kustomize..."

# Determine which template to use based on tier
if [[ "$IS_SHARED" == "true" ]]; then
    KUSTOMIZE_DIR="$TENANT_DIR"
else
    KUSTOMIZE_DIR="$TENANT_DIR"
fi

MANIFEST=$(kubectl kustomize "$KUSTOMIZE_DIR")

# Load domain variables from domains.env
set -a
source "$DOMAINS_FILE"
set +a

# SERVICE_PREFIX is the full TENANT_NAME (kustomize namePrefix uses the full name)
SERVICE_PREFIX="${TENANT_NAME}"

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

        # Create database if it doesn't exist (shared PostgreSQL)
        echo "Ensuring database '$TENANT_NAME' exists..."
        docker exec smap-shared-postgres psql -U medusa -d postgres -c \
            "SELECT 1 FROM pg_database WHERE datname = '${TENANT_NAME}'" | grep -q 1 || \
            docker exec smap-shared-postgres psql -U medusa -d postgres -c "CREATE DATABASE \"${TENANT_NAME}\";"
        echo "Database '$TENANT_NAME' ready."

        # HOST_IP for shared tier is the Docker bridge gateway (accessible from K8s pods)
        HOST_IP="${DOCKER_PG_HOST}"

        echo "Shared tier - using Docker hosts:"
        echo "  PostgreSQL: $DOCKER_PG_HOST"
        echo "  Redis: $DOCKER_REDIS_HOST"
        echo "  MinIO: $DOCKER_PG_HOST"
        echo "  Database: $TENANT_NAME"
    fi
else
    # Dedicated tier - use K8s node IP
    HOST_IP="${HOST_IP:-$(kubectl get node -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null)}"
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
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT-api-app-redirect/${SERVICE_PREFIX}-api-app-redirect/g")
MANIFEST=$(echo "$MANIFEST" | sed "s/TENANT-admin-redirect/${SERVICE_PREFIX}-admin-redirect/g")

# Replace secret names (storefront-key is used by both dedicated and shared tiers)
MANIFEST=$(echo "$MANIFEST" | sed "s/STOREFRONT_KEY_SECRET/storefront-key/g")

# Replace namespace name
MANIFEST=$(echo "$MANIFEST" | sed "s/NAMESPACE_NAME/smap-store-${TENANT_NAME}/g")

# Wait for namespace to be fully deleted if it exists and is terminating
NAMESPACE="smap-store-${TENANT_NAME}"
if kubectl get namespace "$NAMESPACE" &>/dev/null; then
    echo "Waiting for namespace $NAMESPACE to be fully deleted..."
    kubectl wait --for=delete namespace/"$NAMESPACE" --timeout=120s 2>/dev/null || true
    # Force delete if still exists
    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        echo "Force deleting namespace $NAMESPACE..."
        kubectl get namespace "$NAMESPACE" -o json | python3 -c "import sys,json; d=json.load(sys.stdin); d['spec']['finalizers']=[]; print(json.dumps(d))" | kubectl replace --raw "/api/v1/namespaces/$NAMESPACE/finalize" -f - &>/dev/null || true
        sleep 5
    fi
fi

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
