# Pronunciation audio and object storage

← [Documentation index](README.md) · [Repository roadmap](roadmap.md) · [Mobile roadmap](../apps/mobile/docs/roadmap.md)

Status: researched September 13, 2026. The optional mobile health probe is implemented; audio generation, asset manifests, local audio downloads, playback, and cloud provisioning are not. No provider account was accessed and no paid resources were created. Storage is shared infrastructure; reader controls are mobile work.

## Individual clips first; optional chapter packs later

Use one immutable audio object per pronunciation segment initially, addressed by a digest of normalized source text, language, voice/model/version, and synthesis settings. A segment is not necessarily a grammatical sentence: poems have lines and exercises may have shorter prompts. One source-language clip serves its transliterations too; an actual translated-language pronunciation is a different clip. Keep the source text/segment revision in the mapping so a corrected sentence cannot silently play stale audio.

Suggested object key: `audio/kn/<voice-version>/<hash-prefix>/<asset-hash>.m4a`. This is an illustrative key, not a committed codec/provider decision. Object-store prefixes organize objects; they do not require separate buckets or directories for every grade/student/chapter. The book/edition/chapter/segment-to-asset mapping belongs in a versioned manifest, allowing the same clip to be reused across adoption contexts without storing it twice. Retain immutable older assets while supported clients/editions reference them.

| Delivery form | Benefit | Trade-off | Decision |
|---|---|---|---|
| Individual segment clips | Simple cache/retry, exact end-of-file stop, cheap corrections, reuse across books | More requests for a whole chapter | Initial format |
| Chapter download bundle containing individual clips | Fewer requests for offline installation, same simple clip playback | Needs extraction, manifest verification, disk space, and bundle revision handling | Optional optimization after measurement |
| Chapter audio sprite plus cue manifest | One audio object with many named clips | Seek/decoder accuracy, stop timing, buffering, and whole-pack invalidation require device tests | Later experiment, not canonical storage |

Audio sprites are real: [Howler's official documentation](https://github.com/goldfire/howler.js#sprite-object-) describes named start/duration offsets. That browser-library feature is not automatically an Expo implementation. [Expo SDK 57 audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) exposes seeking and periodic playback status; do not assume a JavaScript timer produces sample-accurate endings. A future sprite manifest needs immutable asset identity, explicit units, start/end bounds, codec/duration, and checksums. Test first/last clips, rapid repeated taps, backgrounding, slow networks, and Android/iOS seek behavior before shipping. Never play another sentence while waiting for a late timer.

Use small chapter/section packs if experiments justify them, not one enormous textbook recording. Keep original segment clips as the editable/generation units and derive packs reproducibly. An individual clip can be downloaded for one tap; a chapter pack is justified by offline chapter download or measured request overhead, not by directory aesthetics.

## Provider comparison and recommendation

The user's only account-specific inputs are $150/month Azure credits and an existing unused AWS account. The exact Azure offer and AWS account eligibility are unverified. Public price pages cannot determine the user's subscription terms, taxes, region, account age, or remaining credits.

| Provider | Official-source finding | Implication for Akshar |
|---|---|---|
| Azure Blob Storage | Pricing depends on region, redundancy, storage tier, operations, and transfers. Microsoft's $150 Visual Studio Enterprise credit offer explicitly permits individual dev/test, not production. | Provisional first choice for eligible development because of the reported credits; verify the actual offer before serving a school production workload. Start pricing with Standard StorageV2, Hot, LRS, not a costly CDN/gateway by default. |
| AWS S3 | New-customer credits introduced July 15, 2025 are not available to existing customers; AWS says existing benefits remain under their original rules. | An unused account is not automatically eligible for a new free period. Check Billing/Free Tier before assuming free S3; estimate storage, requests, and delivery. |
| Cloudflare R2 Standard | Current free allowance: 10 GB-month storage, 1 million Class A and 10 million Class B operations/month; internet egress is free. | Strong public-delivery alternative if Azure credits cannot cover the intended use. Do not assume unlimited free operations or apply Standard free allowances to Infrequent Access. |
| Google Cloud Storage | Free storage allowance is 5 GB-month with regional restrictions to US-WEST1, US-CENTRAL1, and US-EAST1, plus stated operation/transfer limits. | Not a generic free India-region bucket; compare latency and full costs, not only free storage. |
| Backblaze B2 | Current page lists the first 10 GB free, pricing starting at $6.95/TB/month, and free egress up to 3× average stored data, with further partner/overage rules. | Worth comparing for storage-heavy collections; a small repeatedly streamed audio corpus needs an egress/CDN calculation. |

**Decision gate:** verify whether the Azure credits are Visual Studio dev/test credits, sponsorship, or another offer, and whether the school demonstration is within that offer's permitted use. Recommend Azure for an eligible development pilot; do not commit a production Azure deployment purely because credits are present. If those credits cannot cover production, compare R2 against Azure pay-as-you-go using real corpus bytes and plays. AWS is viable, but the idle account alone is not a cost advantage.

Calculate storage, new/changed uploads, health checks, manifest requests, clip downloads, repeat plays served from local storage, and outbound bytes separately. Set billing alerts; alerts are not hard spending caps. Monthly credits do not remove the need for export/backups or a post-credit operating budget. Fetch region-specific prices again immediately before provisioning.

### Official sources checked

- [Azure monthly credit offer and production restriction](https://azure.microsoft.com/en-us/pricing/member-offers/credit-for-visual-studio-subscribers/)
- [Azure Blob Storage pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)
- [AWS S3 pricing](https://aws.amazon.com/s3/pricing/) and [AWS Free Tier FAQ, including existing customers](https://aws.amazon.com/free/free-tier-faqs/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Google Cloud Storage pricing and Always Free limits](https://cloud.google.com/storage/pricing)
- [Backblaze B2 pricing](https://www.backblaze.com/cloud-storage/pricing)

## Infrastructure-as-code plan, not a deployment

If Azure is selected, prefer [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview) for the small Azure-only pilot. Proposed files are `infra/azure/main.bicep`, separate dev/prod non-secret parameter files, and a deployment README with `what-if`, deployment, verification, rollback, export, and teardown steps. Do not create parallel infrastructure in several clouds merely to keep options open. If multi-cloud operation becomes a real requirement, evaluate Terraform/OpenTofu then; provider-independent asset IDs and exportable objects matter more now than one universal IaC file.

The implementation must cover:

- Separate environment/resource group and predictable account naming; explicit region, Hot tier, redundancy, and budget inputs.
- HTTPS-only delivery, modern TLS, no public writes, no account keys in mobile/Git, and scoped workload-identity/OIDC uploader access instead of durable upload secrets.
- Private originals/staging; a separate approved-derivative delivery container. If anonymous reads are permitted, expose known objects only, not container listing. If subscription policy disallows public blobs, design a suitable delivery layer rather than silently weakening account policy.
- Correct MIME types, immutable cache headers for hashed audio, CORS for supported browser origins, soft-delete/version-retention policy, export/recovery procedures, and lifecycle rules that do not delete supported editions.
- A tiny public `health.json` on the same delivery origin/access path as the audio, published with the deployment. Do not probe the provider's marketing homepage or a private container-list endpoint.
- Verification of public GET/HEAD and failed unauthenticated writes; publish approved objects before their manifests. A custom domain/CDN is optional and should be priced separately.

No IaC deployment is authorized by a documentation recommendation. Subscription/offer, environment, region, access model, expected traffic, and spending approval remain inputs to provisioning.

## Mobile startup and offline behavior

The implementation reads the optional public `EXPO_PUBLIC_MEDIA_HEALTH_URL`. Copy `apps/mobile/.env.example` to a local environment file and set it only after a real delivery endpoint exists. Leave it empty while audio is unprovisioned; do not insert a sample host that would make real network requests. Environment values prefixed `EXPO_PUBLIC_` are bundled client configuration, never a place for storage credentials or signed upload tokens.

The health object must return HTTP success, JSON content type, and this small body:

```json
{"service":"akshar-media","schemaVersion":1}
```

At boot, the app probes it alongside existing splash initialization, with a three-second bound covering fetch and body parsing. Failure must not block text reading or make an offline startup unrecoverable. The app rechecks when returning to the foreground; simultaneous probes share one request. With no configured endpoint it performs no media request and reports `not-configured` rather than pretending the origin is online. This bound applies to the media check, not all pre-existing catalog startup work.

**Per-segment speaker rule for the future player:** enable only when a playable, revision-matched local audio file exists, or when the segment has a known remote asset and the delivery origin is currently reachable. Local playback must remain enabled when the network fails. A successful health check does not prove that every audio object exists; missing/forbidden/corrupt objects need per-asset error handling and retry. Recheck after foreground/retry and network recovery rather than treating boot status as permanent. Unknown words/sentences or missing audio metadata must not get enabled controls merely because storage is reachable.

The current speaker icons remain dimmed/non-interactive because no audio manifest, local audio cache, or player exists yet. The health probe is infrastructure readiness only, not completed pronunciation support. Implement verified local audio cache and playback together before wiring this state to enabled sentence controls; add airplane-mode/cache-hit, missing-file, timeout, malformed-health, corrupt-audio, and recovery acceptance tests.
