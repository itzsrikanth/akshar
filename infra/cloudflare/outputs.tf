locals {
  public_base_url = coalesce(
    try("https://${cloudflare_r2_custom_domain.media[0].domain}", null),
    try("https://${cloudflare_r2_managed_domain.media_r2_dev[0].domain}", null),
  )
}

output "bucket_name" {
  description = "R2 bucket name for uploads and IAM scoping."
  value       = cloudflare_r2_bucket.media.name
}

output "bucket_location" {
  description = "Configured location hint (honored on first create)."
  value       = var.bucket_location
}

output "s3_api_endpoint" {
  description = "S3-compatible endpoint for boto3/aws CLI uploads (account-scoped)."
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

output "r2_dev_domain" {
  description = "Managed r2.dev hostname when enable_r2_dev is true (no https:// prefix)."
  value       = try(cloudflare_r2_managed_domain.media_r2_dev[0].domain, null)
}

output "r2_dev_public_base_url" {
  description = "HTTPS base URL for free-tier pilot GETs (rate-limited)."
  value = (
    length(cloudflare_r2_managed_domain.media_r2_dev) > 0
    ? "https://${cloudflare_r2_managed_domain.media_r2_dev[0].domain}"
    : null
  )
}

output "custom_domain" {
  description = "Custom domain FQDN when enabled."
  value       = try(cloudflare_r2_custom_domain.media[0].domain, null)
}

output "custom_domain_public_base_url" {
  description = "HTTPS base URL for production GETs when custom domain is enabled."
  value = (
    length(cloudflare_r2_custom_domain.media) > 0
    ? "https://${cloudflare_r2_custom_domain.media[0].domain}"
    : null
  )
}

output "recommended_public_base_url" {
  description = "Prefer custom domain when present; otherwise r2.dev."
  value       = local.public_base_url
}

output "health_object_url" {
  description = "Expected public URL for the media health probe after scripts/media_publish.py --health."
  value       = local.public_base_url != null ? "${local.public_base_url}/health.json" : null
}
