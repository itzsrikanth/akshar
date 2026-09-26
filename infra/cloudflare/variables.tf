variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID (Dashboard → Workers & Pages / R2 → account id in the URL or sidebar). 32 hex chars. Not secret, but keep real values in gitignored *.tfvars — do not leave the example placeholder."

  validation {
    condition = (
      length(var.cloudflare_account_id) == 32
      && can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
      && var.cloudflare_account_id != "YOUR_CLOUDFLARE_ACCOUNT_ID"
    )
    error_message = "Set cloudflare_account_id in terraform.tfvars to your real 32-char hex account ID (Dashboard). Do not leave YOUR_CLOUDFLARE_ACCOUNT_ID. Exporting CLOUDFLARE_API_TOKEN alone is not enough — this variable fills the /accounts/{id}/… URL."
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment suffix used in bucket naming."
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  type        = string
  description = "Short project prefix for resource names."
  default     = "akshar"
}

variable "bucket_location" {
  type        = string
  description = "R2 location hint (best-effort on first create). Prefer apac for India-facing workloads."
  default     = "apac"

  validation {
    condition = contains(
      ["apac", "eeur", "enam", "weur", "wnam", "oc"],
      var.bucket_location
    )
    error_message = "bucket_location must be a supported R2 location hint."
  }
}

variable "enable_r2_dev" {
  type        = bool
  description = "Enable the Cloudflare-managed *.r2.dev public development URL (rate-limited; not for production)."
  default     = true
}

variable "enable_custom_domain" {
  type        = bool
  description = "Attach a custom domain for production public delivery (requires a Cloudflare zone)."
  default     = false
}

variable "custom_domain" {
  type        = string
  description = "FQDN for public media delivery when enable_custom_domain is true (e.g. media.example.com)."
  default     = ""
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Zone ID for custom_domain when enable_custom_domain is true."
  default     = ""
}

variable "custom_domain_min_tls" {
  type        = string
  description = "Minimum TLS version for the custom domain."
  default     = "1.2"

  validation {
    condition     = contains(["1.0", "1.1", "1.2", "1.3"], var.custom_domain_min_tls)
    error_message = "custom_domain_min_tls must be 1.0, 1.1, 1.2, or 1.3."
  }
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Browser origins allowed to GET media (native apps do not need CORS). Use localhost for Expo web / local tools."
  default = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19006",
  ]
}
