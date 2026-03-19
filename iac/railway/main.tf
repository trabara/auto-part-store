locals {
  project_id     = railway_project.project.id
  environment_id = railway_project.project.default_environment.id
}

resource "railway_project" "project" {
  name = var.project_name

  default_environment = {
    name = var.environment_name
  }
}

# PostgreSQL Database
resource "railway_service" "postgres" {
  name       = "postgres"
  project_id = local.project_id

  source_image = "obha507/postgres-ssl:latest"
  # volume = {
  #   name       = "postgres-data"
  #   mount_path = "/var/lib/postgresql/data"
  # }
}

# Redis
resource "railway_service" "redis" {
  name       = "redis"
  project_id = local.project_id

  source_image = "redis"
}

# MinIO Object Storage
resource "railway_service" "minio" {
  name       = "minio"
  project_id = local.project_id

  source_image = "minio/minio:latest"
}

# Medusa Backend Service
resource "railway_service" "medusa" {
  name       = "medusa"
  project_id = local.project_id

  source_image = var.medusa_image_source
}

# TCP Proxy for Medusa
resource "railway_tcp_proxy" "medusa" {
  service_id       = railway_service.medusa.id
  environment_id   = local.environment_id
  application_port = 9000
}

# Storefront Service
resource "railway_service" "storefront" {
  name       = "storefront"
  project_id = local.project_id

  source_image = var.storefront_image_source
}

# TCP Proxy for Storefront
resource "railway_tcp_proxy" "storefront" {
  service_id       = railway_service.storefront.id
  environment_id   = local.environment_id
  application_port = 3000
}
