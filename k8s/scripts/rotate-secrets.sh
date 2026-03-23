#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
TENANT_NAME=""
TIER="auto"

usage() {
    cat <<USAGE
Usage: $(basename "$0") <TENANT_NAME> [OPTIONS]

Rotate secrets for a tenant and trigger redeployment.

Arguments:
    TENANT_NAME    Name of the tenant (e.g., acme, demo-shared)

Options:
    -t, --tier TIER     Deployment tier: "pro", "shared", or "auto" (default: auto)
    -h, --help          Show this help message

Examples:
    $(basename "$0") acme              # Rotate PRO tier secrets (auto-detect)
    $(basename "$0") demo-shared -t shared  # Force rotate as shared tier
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

if [[ "$TIER" != "pro" && "$TIER" != "shared" && "$TIER" != "auto" ]]; then
    echo "Error: Invalid tier '$TIER'. Must be 'pro', 'shared', or 'auto'."
    exit 1
fi

TENANT_DIR="$SCRIPT_DIR/../tenants/$TENANT_NAME"

if [[ ! -d "$TENANT_DIR" ]]; then
    echo "Error: Tenant directory not found: $TENANT_DIR"
    exit 1
fi

# Auto-detect tier
if [[ "$TIER" == "auto" ]]; then
    if [[ -f "$TENANT_DIR/config/shared.env" ]]; then
        TIER="shared"
    else
        TIER="pro"
    fi
fi

echo "=== Rotating secrets for tenant: $TENANT_NAME ==="
echo "Tier: $TIER"
echo ""

# Generate new secrets
echo "Generating new secrets..."
"$SCRIPT_DIR/generate-secrets.sh" "$TENANT_NAME" -t "$TIER"

echo ""
echo "Applying new secrets to cluster..."
"$SCRIPT_DIR/deploy-tenant.sh" "$TENANT_NAME" --tier "$TIER"

echo ""
echo "=== Secrets rotated successfully ==="
echo ""
echo "Old secrets backed up to: $TENANT_DIR/secrets/.backup/"
