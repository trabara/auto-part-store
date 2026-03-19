locals {
  medusa_domain        = "${railway_service.medusa.name}.up.railway.app"
  storefront_domain    = "${railway_service.storefront.name}.up.railway.app"
  minio_api_domain     = "${railway_service.minio.name}.up.railway.app"
  minio_console_domain = "${railway_service.minio.name}.console.up.railway.app"

  # Internal Railway connection strings
  postgres_internal_host = "${railway_service.postgres.name}.railway.internal"
  redis_internal_host    = "${railway_service.redis.name}.railway.internal"
  database_url           = "postgres://${var.project_name}:${var.postgres_password}@${local.postgres_internal_host}:${var.postgres_port}/${var.postgres_database}"
  redis_url              = "redis://${local.redis_internal_host}:6379"
}

# Database environment variables
resource "railway_variable_collection" "postgres" {
  environment_id = local.environment_id
  service_id     = railway_service.postgres.id

  variables = [
    {
      name  = "DATABASE_URL",
      value = local.database_url
    },
    {
      name  = "POSTGRES_USER"
      value = var.project_name
    },
    {
      name  = "PGUSER"
      value = var.project_name
    },
    {
      name  = "PGPASSWORD"
      value = var.postgres_password
    },
    {
      name  = "POSTGRES_PASSWORD",
      value = var.postgres_password
    },
    {
      name  = "PGHOST"
      value = local.postgres_internal_host
    },
    {
      name  = "PGPORT"
      value = var.postgres_port
    },
    {
      name  = "PGDATABASE"
      value = var.postgres_database
    },
    {
      name  = "POSTGRES_DB"
      value = var.postgres_database
    },
    {
      name  = "PGDATA"
      value = "/var/lib/postgresql/data/pgdata"
    },
    # {
    #   name  = "RAILWAY_DEPLOYMENT_DRAINING_SECONDS"
    #   value = "60"
    # },
    # {
    #   name  = "SSL_CERT_DAYS"
    #   value = "820"
    # }
  ]
}

resource "railway_variable_collection" "redis" {
  environment_id = local.environment_id
  service_id     = railway_service.redis.id

  variables = [
    {
      name  = "REDISHOST",
      value = local.redis_internal_host
    },
    {
      name  = "REDIS_HOST",
      value = local.redis_internal_host
    },
    { name  = "REDISUSER",
      value = var.project_name
    },
    {
      name  = "REDIS_USER",
      value = var.project_name
    },
    {
      name  = "REDISPORT",
      value = var.redis_port
    },
    { name  = "REDIS_PORT",
      value = var.redis_port
    },
    {
      name  = "REDISPASSWORD",
      value = var.redis_password
    },
    {
      name  = "REDIS_PASSWORD",
      value = var.redis_password
    },
    {
      name  = "REDIS_URL",
      value = local.redis_url
    }
  ]

}

# MinIO environment variables
resource "railway_variable_collection" "minio" {
  environment_id = local.environment_id
  service_id     = railway_service.minio.id

  variables = [
    {
      name  = "MINIO_ROOT_USER"
      value = var.minio_access_key
    },
    {
      name  = "MINIO_ROOT_PASSWORD"
      value = var.minio_secret_key
    },
    {
      name  = "MINIO_DEFAULT_BUCKETS"
      value = var.minio_bucket
    }
  ]
}

# Medusa environment variables using variable collection (single deployment)
resource "railway_variable_collection" "medusa" {
  environment_id = local.environment_id
  service_id     = railway_service.medusa.id

  variables = [
    {
      name  = "DATABASE_URL"
      value = local.database_url
    },
    {
      name  = "REDIS_URL"
      value = local.redis_url
    },
    {
      name  = "MINIO_ENDPOINT"
      value = local.minio_api_domain
    },
    {
      name  = "MINIO_BUCKET"
      value = var.minio_bucket
    },
    {
      name  = "MINIO_ACCESS_KEY"
      value = var.minio_access_key
    },
    {
      name  = "MINIO_SECRET_KEY"
      value = var.minio_secret_key
    },
    {
      name  = "MINIO_USE_SSL"
      value = "true"
    },
    {
      name  = "MINIO_REGION"
      value = "us-east-1"
    },
    {
      name  = "STORE_CORS"
      value = "https://${local.storefront_domain}"
    },
    {
      name  = "ADMIN_CORS"
      value = "https://${local.storefront_domain}"
    },
    {
      name  = "AUTH_CORS"
      value = "https://${local.storefront_domain}"
    },
    {
      name  = "JWT_SECRET"
      value = var.jwt_secret
    },
    {
      name  = "COOKIE_SECRET"
      value = var.cookie_secret
    },
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "ADMIN_USER_EMAIL"
      value = var.medusa_admin_user_email
    },
    {
      name  = "ADMIN_USER_PASSWORD"
      value = var.medusa_admin_user_password
    }
  ]
}

# Storefront environment variables using variable collection (single deployment)
resource "railway_variable_collection" "storefront" {
  environment_id = local.environment_id
  service_id     = railway_service.storefront.id

  variables = [
    {
      name  = "MEDUSA_BACKEND_URL"
      value = "https://${local.medusa_domain}"
    },
    {
      name  = "NEXT_PUBLIC_BASE_URL"
      value = "https://${local.storefront_domain}"
    },
    {
      name  = "NEXT_PUBLIC_MEDUSA_BACKEND_URL"
      value = "https://${local.medusa_domain}"
    },
    {
      name  = "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"
      value = "@railway:ref:medusa/MEDUSA_PUBLISHABLE_KEY"
    },
    {
      name  = "REVALIDATE_SECRET"
      value = var.revalidate_secret
    },
    {
      name  = "NODE_ENV"
      value = "production"
    }
  ]
}
