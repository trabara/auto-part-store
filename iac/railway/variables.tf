variable "project_name" {
  description = "Name of the Railway project"
  type        = string
  default     = "smap-store"
}

variable "environment_name" {
  description = "Name of the Railway environment"
  type        = string
  default     = "production"
}

variable "postgres_image_source" {
  description = "Docker image for PostgreSQL (e.g., docker.io/org/postgres:latest)"
  type        = string
  default     = ""
}

variable "postgres_database" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "medusa-v2"
}

variable "postgres_port" {
  description = "PostgreSQL port"
  type        = string
  default     = "5432"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "redis_image_source" {
  description = "Docker image for Redis (e.g., docker.io/org/redis:latest)"
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Redis port"
  type        = string
  default     = "6379"
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "minio_image_source" {
  description = "Docker image for MinIO (e.g., docker.io/org/minio:latest)"
  type        = string
  default     = ""
}

variable "minio_bucket" {
  description = "MinIO/S3 bucket name"
  type        = string
  default     = ""
  sensitive   = true
}

variable "minio_access_key" {
  description = "MinIO/S3 access key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "minio_secret_key" {
  description = "MinIO/S3 secret key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "minio_endpoint" {
  description = "MinIO/S3 endpoint (e.g., s3.amazonaws.com for AWS)"
  type        = string
  default     = "s3.amazonaws.com"
}

variable "medusa_image_source" {
  description = "Docker image for Medusa (e.g., docker.io/org/medusa:latest)"
  type        = string
  default     = ""
}

variable "medusa_admin_user_email" {
  description = "Email address for the Medusa admin user"
  type        = string
  default     = ""
}

variable "medusa_admin_user_password" {
  description = "Password for the Medusa admin user"
  type        = string
  default     = ""
  sensitive   = true
}

variable "storefront_image_source" {
  description = "Docker image for Storefront (e.g., docker.io/org/storefront:latest)"
  type        = string
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret for Medusa"
  type        = string
  default     = ""
  sensitive   = true
}

variable "cookie_secret" {
  description = "Cookie secret for Medusa"
  type        = string
  default     = ""
  sensitive   = true
}

variable "revalidate_secret" {
  description = "Revalidate secret for Storefront"
  type        = string
  default     = ""
  sensitive   = true
}
