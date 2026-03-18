locals {
  medusa_domain        = "${railway_service.medusa.name}.up.railway.app"
  storefront_domain    = "${railway_service.storefront.name}.up.railway.app"
  minio_api_domain     = "${railway_service.minio.name}.up.railway.app"
  minio_console_domain = "${railway_service.minio.name}.console.up.railway.app"
}

# Shared Registry Credentials (for pulling private ghcr.io images)
resource "railway_shared_variable" "registry_token" {
  count          = var.registry_token != "" ? 1 : 0
  name           = "RAILWAY_DOCKER_REGISTRY_TOKEN"
  project_id     = local.project_id
  environment_id = local.environment_id
  value          = var.registry_token
}

resource "railway_shared_variable" "registry_username" {
  count          = var.registry_token != "" ? 1 : 0
  name           = "RAILWAY_DOCKER_REGISTRY_USERNAME"
  project_id     = local.project_id
  environment_id = local.environment_id
  value          = var.registry_username
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
      value = "@railway:ref:postgres/DATABASE_URL"
    },
    {
      name  = "REDIS_URL"
      value = "@railway:ref:redis/REDIS_URL"
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
