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

variable "medusa_root_dir" {
  description = "Root directory for Medusa in monorepo (empty = deploy from root)"
  type        = string
  default     = "" # Deploy from monorepo root for Yarn workspaces
}

variable "storefront_root_dir" {
  description = "Root directory for Storefront in monorepo (empty = deploy from root)"
  type        = string
  default     = "" # Deploy from monorepo root for Yarn workspaces
}

variable "medusa_build_command" {
  description = "Build command for Medusa (optional)"
  type        = string
  default     = "yarn workspace medusa build"
}

variable "storefront_build_command" {
  description = "Build command for Storefront (optional)"
  type        = string
  default     = "yarn workspace storefront build"
}

variable "medusa_start_command" {
  description = "Start command for Medusa"
  type        = string
  default     = "cd apps/medusa && medusa start"
}

variable "storefront_start_command" {
  description = "Start command for Storefront"
  type        = string
  default     = "cd apps/storefront && node server.js"
}

variable "medusa_image_source" {
  description = "Docker image for Medusa (e.g., docker.io/org/medusa:latest)"
  type        = string
  default     = ""
}

variable "storefront_image_source" {
  description = "Docker image for Storefront (e.g., docker.io/org/storefront:latest)"
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
