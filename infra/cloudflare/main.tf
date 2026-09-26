locals {
  bucket_name = "${var.project_name}-media-${var.environment}"

  custom_domain_ready = (
    var.enable_custom_domain
    && length(trimspace(var.custom_domain)) > 0
    && length(trimspace(var.cloudflare_zone_id)) > 0
  )
}

check "custom_domain_inputs" {
  assert {
    condition     = !var.enable_custom_domain || local.custom_domain_ready
    error_message = "enable_custom_domain=true requires non-empty custom_domain and cloudflare_zone_id."
  }
}

resource "cloudflare_r2_bucket" "media" {
  account_id    = var.cloudflare_account_id
  name          = local.bucket_name
  location      = var.bucket_location
  storage_class = "Standard"

  lifecycle {
    prevent_destroy = true
  }
}

# Abort abandoned multipart uploads only — do not auto-delete published audio.
resource "cloudflare_r2_bucket_lifecycle" "media" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.media.name

  rules = [
    {
      id      = "abort-incomplete-multipart"
      enabled = true
      conditions = {
        prefix = ""
      }
      abort_multipart_uploads_transition = {
        condition = {
          type    = "Age"
          max_age = 7 * 24 * 60 * 60
        }
      }
    }
  ]
}

resource "cloudflare_r2_bucket_cors" "media" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.media.name

  rules = [
    {
      id = "browser-get"
      allowed = {
        methods = ["GET", "HEAD"]
        origins = var.cors_allowed_origins
        headers = ["Content-Type", "Range"]
      }
      expose_headers  = ["Content-Length", "Content-Type", "ETag", "Accept-Ranges"]
      max_age_seconds = 3600
    }
  ]
}

# Free-tier pilot public origin (rate-limited). Disable once a custom domain is live.
resource "cloudflare_r2_managed_domain" "media_r2_dev" {
  count = var.enable_r2_dev ? 1 : 0

  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.media.name
  enabled     = true
}

# Production toggle: requires a domain you own on a Cloudflare zone (~registrar cost only).
resource "cloudflare_r2_custom_domain" "media" {
  count = local.custom_domain_ready ? 1 : 0

  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.media.name
  domain      = var.custom_domain
  zone_id     = var.cloudflare_zone_id
  enabled     = true
  min_tls     = var.custom_domain_min_tls
}
