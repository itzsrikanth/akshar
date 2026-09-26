provider "cloudflare" {
  # Auth via environment — never put tokens in *.tf files or this public repo.
  #   export CLOUDFLARE_API_TOKEN="..."   # Account token with R2 edit permissions
  # Optional if the token is account-scoped:
  #   export CLOUDFLARE_ACCOUNT_ID="..."
}
