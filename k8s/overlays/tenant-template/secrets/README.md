# Tenant Secrets

Each secret file contains only the keys needed by that component:

| File | Keys | Used By |
|------|------|---------|
| `medusa.env` | DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD | medusa deployment |
| `postgres.env` | POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB | postgres statefulset |
| `redis.env` | REDIS_PASSWORD | redis deployment |
| `minio.env` | MINIO_ROOT_USER, MINIO_ROOT_PASSWORD | minio deployment |
| `storefront.env` | REVALIDATE_SECRET | storefront deployment |
