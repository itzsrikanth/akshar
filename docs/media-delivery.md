# Pronunciation audio and object storage

← [Documentation index](README.md) · [Repository roadmap](roadmap.md) · [Mobile roadmap](../apps/mobile/docs/roadmap.md) · [OpenTofu R2 stack](../infra/cloudflare/README.md)

Status: researched September 13, 2026; **IaC + publish tooling landed September 19, 2026**; **sample-mode reader playback** uses a content-addressed R2 clip (plus bundled fallback) with Git chapter manifests and offline prefetch on chapter download. Real TTS generation is not implemented. Storage is shared infrastructure; reader controls are mobile work.

## Individual clips first; optional chapter packs later

Use one immutable audio object per pronunciation segment initially, addressed by a digest of normalized source text, language, voice/model/version, and synthesis settings. A segment is not necessarily a grammatical sentence: poems have lines and exercises may have shorter prompts. One source-language clip serves its transliterations too; an actual translated-language pronunciation is a different clip. Keep the source text/segment revision in the mapping so a corrected sentence cannot silently play stale audio.

Suggested object key: `audio/kn/<voice-id>/<hash-prefix>/<asset-hash>.m4a`. **Locked encoding:** see [audio-clip-encoding.md](audio-clip-encoding.md) — **24 kHz mono AAC `.m4a`**. Implemented helpers: [`scripts/media_asset_id.py`](../scripts/media_asset_id.py). Object-store prefixes organize objects; they do not require separate buckets or directories for every grade/student/chapter. **Do not mirror `content/books/...` paths in R2** — the bucket holds bytes (+ `health.json`) only. The book/edition/chapter/segment-to-asset mapping belongs in versioned Git manifests under [`content/media/manifests/`](../content/media/manifests/) ([`schema/media-asset-manifest.schema.json`](../schema/media-asset-manifest.schema.json)), allowing the same clip to be reused across adoption contexts without storing it twice. Retain immutable older assets while supported clients/editions reference them.

| Delivery form | Benefit | Trade-off | Decision |
|---|---|---|---|
| Individual segment clips | Simple cache/retry, exact end-of-file stop, cheap corrections, reuse across books | More requests for a whole chapter | Initial format |
| Chapter download bundle containing individual clips | Fewer requests for offline installation, same simple clip playback | Needs extraction, manifest verification, disk space, and bundle revision handling | Optional optimization after measurement |
| Chapter audio sprite plus cue manifest | One audio object with many named clips | Seek/decoder accuracy, stop timing, buffering, and whole-pack invalidation require device tests | Later experiment, not canonical storage |

Audio sprites are real: [Howler's official documentation](https://github.com/goldfire/howler.js#sprite-object-) describes named start/duration offsets. That browser-library feature is not automatically an Expo implementation. [Expo SDK 57 audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) exposes seeking and periodic playback status; do not assume a JavaScript timer produces sample-accurate endings. A future sprite manifest needs immutable asset identity, explicit units, start/end bounds, codec/duration, and checksums. Test first/last clips, rapid repeated taps, backgrounding, slow networks, and Android/iOS seek behavior before shipping. Never play another sentence while waiting for a late timer.

Use small chapter/section packs if experiments justify them, not one enormous textbook recording. Keep original segment clips as the editable/generation units and derive packs reproducibly. An individual clip can be downloaded for one tap; a chapter pack is justified by offline chapter download or measured request overhead, not by directory aesthetics.

## Provider decision (September 19, 2026)

**Pilot / free-tier delivery: Cloudflare R2 Standard**, provisioned with OpenTofu under [`infra/cloudflare/`](../infra/cloudflare/). Public reads start on the managed **`*.r2.dev`** URL (`enable_r2_dev = true`). That origin is rate-limited and is **not** production. A **custom domain** remains a later toggle (`enable_custom_domain`) once a domain is on a Cloudflare zone.

Azure Blob remains a viable credit-funded *compute/storage* option for experiments, but this repository’s versioned delivery IaC targets R2 so public egress stays free and the stack is not coupled to Visual Studio credit terms. Do not provision parallel clouds “just in case.” Keep asset IDs and manifests provider-independent so a future migration is an origin/base-URL change, not a chapter rewrite.

**Easy switch-over (option reserved, not coded):** treat `infra/cloudflare/` as replaceable. A later `infra/<provider>/` module would provision a new bucket/container; object keys and Git manifests stay. Clients only change the public media base URL / health URL after a one-time object copy. Publish tooling stays S3-shaped where the target supports it; otherwise add a small alternate uploader later — no multi-cloud abstraction layer until a real second provider is chosen.

| Provider | Official-source finding | Implication for Akshar |
|---|---|---|
| Cloudflare R2 Standard | Free: 10 GB-month, 1M Class A, 10M Class B ops/month; **internet egress free**. Paid overage: storage $0.015/GB-month, Class A $4.50/M, Class B $0.36/M ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). | **Selected for Git-versioned free-tier pilot.** |
| Azure Blob Storage | Credits may be limited to Visual Studio Enterprise **dev/test**, not production. | Optional for eligible private experiments; not the committed delivery IaC. |
| AWS S3 | Existing accounts are not automatically on a new free period. | Viable later; idle account alone is not a cost advantage. |
| Google Cloud Storage / Backblaze B2 | Free tiers exist with regional or egress caveats. | Not selected for the first IaC stack. |

### Custom domain: do you need to buy one? What does it cost?

| Item | Charge |
|---|---|
| Cloudflare Free DNS zone | $0 |
| R2 custom-domain binding | $0 |
| Domain registration | **Yes, you must own a domain** — typically **~$10–15/year** (Cloudflare Registrar or another registrar), then point nameservers at Cloudflare |
| Workers Paid ($5/month) | **Not required** for public R2 via `r2.dev` or a custom domain |
| `r2.dev` public URL | $0, rate-limited, development only |

Until a domain exists, stay on `r2.dev`. When ready: set `enable_custom_domain = true`, fill `custom_domain` + `cloudflare_zone_id`, optionally set `enable_r2_dev = false`, then `tofu apply`.

### Rough cost analysis (corpus snapshot September 19, 2026)

Measured in-repo speakable segments (prose/dialogue/poem_line/question/vocab/note/competency/fill_blank with non-empty text): **~3,284 clips**, **~158k characters**, rough one-voice audio estimate **~11 MB** (2 KB floor + ~50 B/char — order-of-magnitude only).

| Scenario | Storage | Class B reads (GET/HEAD) | Monthly R2 $ (Standard) |
|---|---|---|---|
| One Kannada voice, current corpus | ~0.01–0.05 GB | — | **$0** (inside free 10 GB) |
| Five voices × current corpus | ~0.05–0.25 GB | — | **$0** |
| School demo: 50 students × 200 clip plays/month (cold; no client cache) | negligible | ~10k Class B | **$0** (≪ 10M free) |
| Growth: 5k students × 500 cold plays | still ≪ 10 GB | ~2.5M Class B | **$0** ops; still free egress |
| Pathological: >10 GB stored | overage × $0.015/GB | — | e.g. 20 GB → ~$0.15 storage |
| Pathological: >10M Class B | — | overage × $0.36/M | e.g. +5M → ~$1.80 |

**Generation cost is separate** (Bhashini / other TTS APIs or self-hosted GPU) and is not included above. Client-side caching and offline chapter packs cut Class B operations dramatically; budget cold misses, health checks, and uploads (Class A) separately. Set Cloudflare billing alerts even on free tier. Re-fetch [R2 pricing](https://developers.cloudflare.com/r2/pricing/) before production cutover.

## Infrastructure-as-code (implemented)

OpenTofu/Terraform under [`infra/cloudflare/`](../infra/cloudflare/):

- `cloudflare_r2_bucket` (Standard, `apac` hint, `prevent_destroy`)
- Lifecycle: abort incomplete multipart uploads only (no auto-delete of published audio)
- CORS: GET/HEAD for configured localhost browser origins
- `cloudflare_r2_managed_domain` when `enable_r2_dev` (default true)
- Optional `cloudflare_r2_custom_domain` when toggled
- Canonical [`infra/cloudflare/assets/health.json`](../infra/cloudflare/assets/health.json)
- Publish: [`scripts/media_publish.py`](../scripts/media_publish.py) (S3 API; credentials via env only)
- Manifest validation: [`scripts/validate_media_manifests.py`](../scripts/validate_media_manifests.py) (wired into `scripts/check.py`)

**Public GitHub constraints:** never commit API tokens, R2 access keys, `terraform.tfvars`, or `*.tfstate`. Upload tokens are created in the Cloudflare dashboard (not by OpenTofu) so secrets do not land in state by default. Apply steps are documented in the infra README; applying is a maintainer action with spending approval, not authorized merely by this document.

## Mobile startup and offline behavior

The implementation reads the optional public `EXPO_PUBLIC_MEDIA_HEALTH_URL` and `EXPO_PUBLIC_MEDIA_BASE_URL`. Copy `apps/mobile/.env.example` to a local environment file and set them after the R2 public origin exists. Leave them empty while audio is unprovisioned. Environment values prefixed `EXPO_PUBLIC_` are bundled client configuration, never a place for storage credentials or signed upload tokens.

The health object must return HTTP success, JSON content type, and this small body:

```json
{"service":"akshar-media","schemaVersion":1}
```

At boot, the app probes health alongside existing splash initialization, with a three-second bound covering fetch and body parsing. Failure must not block text reading or make an offline startup unrecoverable. The app rechecks when returning to the foreground; simultaneous probes share one request. With no configured endpoint it performs no media request and reports `not-configured` rather than pretending the origin is online. This bound applies to the media check, not all pre-existing catalog startup work.

### Offline audio on chapter download (sample-backed, landed)

1. **Download chapter JSON** under `chapters-v2/…` as before.
2. **Prefetch audio** (best-effort, after JSON write): fetch `{CONTENT_BASE_URL}/content/media/manifests/<bookId>/<editionId>/<chapterId>.json`, then for each unique `assetId` ensure `audio-v1/<assetId>.m4a` via `MEDIA_BASE_URL/<objectKey>` (or seed the shared sample from the bundled beep if remote fails). Explore “download all” already calls per-chapter download, so it picks up audio too.
3. **Playback:** local cache → remote URL (then cache) → bundled sample. Shared `audio-v1` clips are **not** deleted when one chapter is removed; clear only on full local data reset.
4. **Speaker enable (sample mode):** speakable type + non-empty translation + `MEDIA_SAMPLE_MODE`. Production should later require a revision-matched manifest entry (and preferably a local file or reachable origin) instead of sample mode.

A successful health check does not prove that every audio object exists; missing/forbidden/corrupt objects need per-asset error handling. Airplane-mode/cache-hit and recovery acceptance tests remain recommended follow-ups.
