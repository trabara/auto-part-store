#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"
SECRETS_FILE="${1:-}"

usage() {
    cat <<EOF
Usage: $(basename "$0") [SECRETS_FILE]

Generate a new secrets.env file with random passwords.

Arguments:
    SECRETS_FILE    Path to secrets.env file to generate (optional)

Examples:
    $(basename "$0")                                   # Generate to stdout
    $(basename "$0") k8s/tenants/acme/secrets/secrets.env  # Generate to file
EOF
    exit 1
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
fi

generate_password() {
    tr -dc 'A-Za-z0-9!@#$%^&*' < /dev/urandom | head -c 32
}

generate_minio_user() {
    tr -dc 'a-z0-9' < /dev/urandom | head -c 16
}

generate_hex() {
    tr -dc 'a-f0-9' < /dev/urandom | head -c 32
}

DB_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)
MINIO_ROOT_USER=$(generate_minio_user)
MINIO_ROOT_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_hex)
COOKIE_SECRET=$(generate_hex)
REVALIDATE_SECRET=$(generate_hex)

SECRETS_CONTENT="# Generated on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Run 'openssl rand -base64 32' to generate new values

# Database
DB_USERNAME=medusa
DB_PASSWORD=${DB_PASSWORD}

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# MinIO
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}

# Medusa
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# Storefront
REVALIDATE_SECRET=${REVALIDATE_SECRET}

# Configuration
TENANT_DOMAIN=CHANGE_ME.localhost
TRAEFIK_IP=10.43.173.17
IMAGE_TAG=latest
REGISTRY=localhost:5000
"

if [[ -n "${SECRETS_FILE:-}" ]]; then
    echo "$SECRETS_CONTENT" > "$SECRETS_FILE"
    echo "Generated secrets file: $SECRETS_FILE"
    echo ""
    echo "IMPORTANT: Review and update TENANT_DOMAIN and other values as needed."
else
    echo "$SECRETS_CONTENT"
fi
