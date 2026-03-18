output "project_id" {
  description = "Railway project ID"
  value       = railway_project.project.id
}

output "project_name" {
  description = "Railway project name"
  value       = railway_project.project.name
}

output "environment_id" {
  description = "Railway environment ID"
  value       = railway_project.project.default_environment.id
}

output "postgres_service_id" {
  description = "PostgreSQL service ID"
  value       = railway_service.postgres.id
}

output "redis_service_id" {
  description = "Redis service ID"
  value       = railway_service.redis.id
}

output "minio_service_id" {
  description = "MinIO service ID"
  value       = railway_service.minio.id
}

output "minio_api_url" {
  description = "MinIO API URL"
  value       = "https://${railway_service.minio.name}.up.railway.app"
}

output "minio_console_url" {
  description = "MinIO Console URL"
  value       = "https://${railway_service.minio.name}.console.up.railway.app"
}

output "medusa_service_id" {
  description = "Medusa backend service ID"
  value       = railway_service.medusa.id
}

output "medusa_url" {
  description = "Medusa backend URL"
  value       = "https://${railway_service.medusa.name}.railway.app"
}

output "storefront_service_id" {
  description = "Storefront service ID"
  value       = railway_service.storefront.id
}

output "storefront_url" {
  description = "Storefront URL"
  value       = "https://${railway_service.storefront.name}.railway.app"
}
