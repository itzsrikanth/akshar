# Cloudflare R2 media delivery (OpenTofu)

Git-versioned infrastructure for Akshar pronunciation audio and other approved media objects. Provider-independent asset IDs and manifests live in the content tree; this stack only provisions the delivery bucket and public read origin.

**Status:** code is ready to apply against *your* Cloudflare account. No account was provisioned from this repository. Applying resources creates a billable Cloudflare R2 workspace; stay on Standard storage to use the free monthly allowance.

## Custom domain charges (answered)

| Item | Cost |
|---|---|
| Cloudflare Free plan zone (DNS) | $0 |
| Connecting an R2 **custom domain** to a bucket | $0 extra from Cloudflare |
| Domain name itself | You must **own** a domain — typically **~$10–15/year** from Cloudflare Registrar or another registrar, then add the zone to Cloudflare |
| Workers Paid plan | **Not required** for public R2 custom domains or `r2.dev` |
| R2 Standard free tier | 10 GB-month storage, 1M Class A, 10M Class B ops/month; **egress free** |

This pilot defaults to the managed **`*.r2.dev`** URL (`enable_r2_dev = true`). That origin is **rate-limited** and intended for development only. Toggle `enable_custom_domain` later when you have a domain on Cloudflare.

## Public-repo safety

This GitHub repo is public. Never commit:

- `CLOUDFLARE_API_TOKEN` or any API token
- R2 S3 access key ID / secret access key
- `terraform.tfvars`, `*.tfstate`, `.terraform/`

Local `.gitignore` in this directory excludes those. Create secrets only in your shell or a private secret store.

## Prerequisites

1. [OpenTofu](https://opentofu.org/) ≥ 1.6 (`tofu`) — Terraform ≥ 1.6 also works with these files.
2. A Cloudflare account with **R2 subscribed/enabled**. This is a one-time Dashboard step OpenTofu cannot do: **Storage & databases → R2 → Overview** → complete the free checkout. Until then the API returns `403` / code `10042` (`Please enable R2 through the Cloudflare Dashboard`).
3. An **Account API Token** with permissions to create/edit R2 buckets (and DNS edit if you later enable a custom domain). Prefer a narrowly scoped token; do not paste it into Git.
4. Python 3.12+ and `pip install -r scripts/requirements-media.txt` from the repo root for publish scripts.

## Apply (dev / r2.dev)

You need **two** local values (neither belongs in Git):

| What | Where | Purpose |
|---|---|---|
| Account ID (32 hex chars) | `terraform.tfvars` → `cloudflare_account_id` | Fills `/accounts/{id}/r2/buckets` in the API URL |
| API token | `export CLOUDFLARE_API_TOKEN=...` | Authenticates the request |

A 404 with `YOUR_CLOUDFLARE_ACCOUNT_ID` in the URL means the example placeholder was never replaced. **Exporting that placeholder string will not help** — edit `terraform.tfvars`. Find the real ID in the Cloudflare dashboard (R2 or account overview; also in the dashboard URL as `/…/<32-hex>/…`).

```bash
cd infra/cloudflare
cp terraform.tfvars.example terraform.tfvars
# REQUIRED: replace cloudflare_account_id with your real 32-char hex ID
#   cloudflare_account_id = "a1b2c3d4e5f6..."   # not YOUR_CLOUDFLARE_ACCOUNT_ID

export CLOUDFLARE_API_TOKEN="..."   # local shell only; token with R2 edit permission

tofu init
tofu plan
tofu apply
tofu output
```

Note `recommended_public_base_url` and `health_object_url` from the outputs.

## Future provider switch (design only — not coded)

R2 is the first delivery backend, not a permanent lock-in. When switching (e.g. to Azure Blob or S3):

1. Keep Git manifests and `assetId` / `objectKey` unchanged — they are provider-independent.
2. Add a sibling stack such as `infra/azure/` (or `infra/s3/`) instead of rewriting chapter YAML.
3. Point `R2_PUBLIC_BASE_URL` / mobile `EXPO_PUBLIC_MEDIA_*` at the new origin after copying objects (same keys).
4. `scripts/media_publish.py` already speaks the S3 API; a non-S3 backend would get a thin alternate uploader behind the same CLI flags — **not implemented until needed**.

Do not dual-run clouds “just in case”; switch when measured cost, region, or policy requires it.

## Create upload credentials (dashboard; not IaC)

OpenTofu intentionally does **not** create R2 access keys (secrets in state are easy to leak). In the Cloudflare dashboard:

1. R2 → Manage R2 API Tokens → Create API token  
2. Scope object read/write to the `akshar-media-dev` bucket only  
3. Export locally (never commit):

```bash
export R2_ACCOUNT_ID="..."          # same as cloudflare_account_id
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_BUCKET="$(tofu output -raw bucket_name)"
export R2_ENDPOINT="$(tofu output -raw s3_api_endpoint)"
export R2_PUBLIC_BASE_URL="$(tofu output -raw recommended_public_base_url)"
```

## Publish health probe

`scripts/media_publish.py` accepts either:

1. **Account API token (simplest after `tofu apply`)** — same class of token used for OpenTofu, with R2 object write:

```bash
export CLOUDFLARE_API_TOKEN="..."   # must be a real Cloudflare token, not a placeholder
# R2_ACCOUNT_ID / R2_BUCKET / R2_PUBLIC_BASE_URL auto-fill from tofu output when possible
python3 scripts/media_publish.py --health
python3 scripts/media_publish.py --verify-url "$(cd infra/cloudflare && tofu output -raw health_object_url)"
```

2. **R2 S3 API token** (dashboard → R2 → Manage R2 API Tokens):

```bash
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_BUCKET="$(cd infra/cloudflare && tofu output -raw bucket_name)"
export R2_ENDPOINT="$(cd infra/cloudflare && tofu output -raw s3_api_endpoint)"
export R2_PUBLIC_BASE_URL="$(cd infra/cloudflare && tofu output -raw recommended_public_base_url)"
python3 scripts/media_publish.py --health
```

Optional: put the exports in gitignored `infra/cloudflare/.env` (KEY=value). Never commit that file.

A `403 Authentication error` means the token in your shell is invalid or lacks R2 write — fix/replace `CLOUDFLARE_API_TOKEN` (or use S3 keys). A short/broken token left in `~/.zshrc` will keep failing.

Then set mobile (local only):

```bash
# apps/mobile/.env  (gitignored)
EXPO_PUBLIC_MEDIA_HEALTH_URL=https://<r2-dev-host>/health.json
```

Leave `EXPO_PUBLIC_MEDIA_HEALTH_URL` empty in committed `.env.example` until you intentionally ship a media origin.

## Toggle custom domain later

1. Register or transfer a domain; add it to Cloudflare DNS (Free plan is enough).
2. In `terraform.tfvars`:

```hcl
enable_custom_domain = true
custom_domain        = "media.example.com"
cloudflare_zone_id   = "YOUR_ZONE_ID"
# Optionally disable the rate-limited pilot origin:
enable_r2_dev        = false
```

3. `tofu apply`, then republish `health.json` if the hostname changed and update `EXPO_PUBLIC_MEDIA_HEALTH_URL`.

## Verify

```bash
curl -sS "$(tofu output -raw health_object_url)"
# expect: {"service":"akshar-media","schemaVersion":1}

# Unauthenticated writes must fail (no public PUT).
```

## Teardown

Buckets use `prevent_destroy`. To delete: empty the bucket, remove `lifecycle { prevent_destroy = true }`, then `tofu destroy`. Export objects first if you need a backup.

## Related

- [Pronunciation audio and object storage](../../docs/media-delivery.md)
- [Asset manifest schema](../../schema/media-asset-manifest.schema.json)
- [Publish script](../../scripts/media_publish.py)
