terraform {
  required_version = ">= 1.0"

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6"
    }
  }
}

provider "railway" {
  # Token can be provided via RAILWAY_TOKEN env var
  # or by specifying it here: token = "your-railway-token"
}
