#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
TENANT_NAME=""
TIER="auto"
KEEP_SECRETS=false

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [OPTIONS]

Destroy a tenant: delete Kubernetes namespace, drop shared-tier database, clean up.

Arguments:
    TENANT_NAME    Name of the tenant to destroy

Options:
    -t, --tier TIER         Tier: "dedicated", "shared", or "auto" (default: auto-detect)
    -k, --keep-secrets      Keep the tenant directory (don't delete config/secrets)
    -h, --help              Show this help message

Examples:
    $(basename "$0") smap-shared              # Destroy shared tenant
    $(basename "$0") smap-dedicated --tier dedicated # Destroy dedicated tier tenant
    $(basename "$0") smap-shared --keep-secrets # Destroy but keep config
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
        -k|--keep-secrets)
            KEEP_SECRETS=true
            shift
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
NAMESPACE="smap-store-${TENANT_NAME}"

# Auto-detect tier
if [[ "$TIER" == "auto" ]]; then
    if [[ -f "$TENANT_DIR/config/shared.env" ]]; then
        TIER="shared"
    else
        TIER="dedicated"
    fi
fi

echo "=== Destroying tenant: $TENANT_NAME ==="
echo "Tier: $TIER"
echo "Namespace: $NAMESPACE"
echo ""

# Step 1: Delete Kubernetes namespace (deletes all resources in it)
if kubectl get namespace "$NAMESPACE" &>/dev/null; then
    echo "Deleting namespace $NAMESPACE..."
    kubectl delete namespace "$NAMESPACE" --wait=false
    echo "Namespace deletion initiated."
else
    echo "Namespace $NAMESPACE not found, skipping."
fi

# Step 2: For shared tier - drop database
if [[ "$TIER" == "shared" ]]; then
    echo "Cleaning up shared PostgreSQL resources..."
    
    if docker exec smap-shared-postgres psql -U medusa -d postgres \
        -c "SELECT 1 FROM pg_database WHERE datname = '${TENANT_NAME}'" 2>/dev/null | grep -q 1; then
        
        echo "Terminating active connections to database '${TENANT_NAME}'..."
        docker exec smap-shared-postgres psql -U medusa -d postgres -c \
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TENANT_NAME}' AND pid <> pg_backend_pid();" 2>/dev/null || true
        
        echo "Dropping database '${TENANT_NAME}'..."
        docker exec smap-shared-postgres psql -U medusa -d postgres -c "DROP DATABASE \"${TENANT_NAME}\";"
        echo "Database '${TENANT_NAME}' dropped."
    else
        echo "Database '${TENANT_NAME}' not found, skipping."
    fi
fi

# Step 3: Remove tenant directory (unless --keep-secrets)
if [[ "$KEEP_SECRETS" == "true" ]]; then
    echo "Keeping tenant directory: $TENANT_DIR"
else
    if [[ -d "$TENANT_DIR" ]]; then
        echo "Removing tenant directory: $TENANT_DIR"
        rm -rf "$TENANT_DIR"
        echo "Tenant directory removed."
    else
        echo "Tenant directory not found: $TENANT_DIR"
    fi
fi

echo ""
echo "=== Tenant '$TENANT_NAME' destroyed ==="
