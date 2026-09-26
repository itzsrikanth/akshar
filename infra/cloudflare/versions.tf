terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # Local state by default (gitignored). For shared/prod later, configure a remote
  # backend that is NOT this public GitHub repo (e.g. Cloudflare R2 + lock, or
  # encrypted private storage). Never commit *.tfstate.
}
