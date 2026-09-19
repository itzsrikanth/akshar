# Publication identity, editions, and safe migration

← [Documentation index](README.md) · [Repository structure](repository-structure.md) · [Roadmap](roadmap.md)

## Status and decision

Design direction and explicit pilot migration authorization recorded September 13, 2026. The maintainer approves a backward-incompatible replacement for the directory/identity model, reports that existing users have been informed, and owns communications. **Partial local implementation (September 19, 2026):** Draft-07 identity schemas, pilot metadata and chapter YAML under `content/books/...`, identity validation, mobile v2 discovery/setup, and generated `api/v2/` exist. v1 API URLs remain stable (compiled from chapter `meta`). Retire v1 only after the step-6 acceptance matrix and documented cutover. The [roadmap checkpoint](roadmap.md#identity-migration-checkpoint) records the estimate, scope and exact resume sequence. Device and release cutover steps live in [v2-cutover-checklist.md](v2-cutover-checklist.md).

**Store a publication once, identify its editions explicitly, and use metadata for discovery.** Publisher, curriculum, state, printed grade, learner grade, subject, source language, language role, and school medium are separate concepts. A book used by several grades, states, schools, curricula, or media must not be duplicated under each classification. An adoption record links a learning context to a book edition; it does not create another copy of the content.

### Lean initial implementation and pilot migration recommendation

The maintainer explicitly authorizes the simpler breaking migration for the small pilot; obtaining that architectural approval again is not a prerequisite. Establish the new identity model before adding many more books, but avoid a generic arbitrary-hierarchy engine or a large compatibility subsystem. Flexible discovery should come from a small validated metadata model, not from making every field or folder shape unconstrained. This one-time support reset does not make arbitrary future breaking changes acceptable and does not authorize silent deletion of unrelated local state.

Start with only `content/books/<book-id>/book.yaml`, `content/books/<book-id>/editions/<edition-id>/edition.yaml`, the existing per-chapter source/contributor folders under `chapters/<chapter-id>/`, and `content/catalog/adoptions.yaml`. Keep publisher/optional series metadata in the book record initially rather than requiring separate registries for every organization or series. Add standalone registries, assets and migration manifests only when used. The fuller layout below is a possible extension, not a prerequisite for the first migration. Segment types, IDs and the flat source/contributor join stay unchanged.

Store printed Grade 3/first-language in edition metadata; store the paired learner contexts Kannada-medium/Grade 3/first-language and English-medium/Grade 5/second-language in adoption records pointing to the same edition. The Grade 5 English-medium usage is maintainer-reported, not evidence of statewide adoption. Clients browse those records, but download/store the same canonical chapter. Optional state, curriculum, school medium and series are discovery facets, not mandatory identity components. Separate book IDs distinguish different Hindi series/volumes even when their grade and language match.

Use `2026-27` as a documented edition identifier for this known source when the new model is implemented; retain the academic-year association separately. Do not insert a year level into today's live chapter paths. A different catalog year alone does not prove different text: a verified unchanged reprint may reference the same edition, while a revised source needs a separate identity. Akshar transcription corrections within the same edition change the revision/hash, not the edition ID. Do not silently substitute a new year's book for a learner's selected edition.

The current `KSEEB` directory remains a legacy compatibility label, not the publisher identity for this book. Use the already verified Karnataka Textbook Society publisher metadata in the new book record. Do not replace it mechanically with `KSEAB`, or treat every Indian publication as requiring an examination-board identity. Moving source YAML under `content/` later is an organization choice; public API paths are controlled separately by the compiler.

For the breaking catalog contract, introduce `api/v2/contents.json` and v2 chapter payloads, never incompatible bodies at today's v1 URLs. A perpetual v1 projection and continued old-client support after the tested cutover are explicitly out of scope. Keep current v1 output during development and retain a pre-cutover snapshot/release for rollback; retaining a frozen public snapshot temporarily is optional, not a permanent support promise. Document retirement when the new client release is ready. No filesystem/CDN symlink behavior is assumed or required.

Implement v2 readers and source/schema/compiler support together, and use book/edition/chapter identity for new download/history keys. The pilot upgrade may require explained learner-context reselection and redownload rather than importing all old state. Use a separate local namespace; leave old files/state untouched until setup succeeds and cleanup is explicitly chosen. Full automatic history migration and a multi-profile UI are deferred under the granted authorization. Preserve ordinary preferences where practical; never silently clear all AsyncStorage, force a reinstall, or promise an ETag can repair an incompatible schema. Failed or offline setup must offer retry rather than repeatedly resetting the app.

Implemented now: the bounded eight-chapter mapping supplies both Explore browse contexts; pilot book/edition/adoptions and chapter YAML live under `content/`; validators/compilers discover that layout; `api/v2/` skips held chapters; mobile v2 setup/discovery is present. Step-6 production cutover and ISBN search remain. ISBN search is recorded for later implementation, not claimed as working.

## Verified source and current discrepancy

The [Karnataka Textbook Society portal](https://textbooks.karnataka.gov.in/textbooks/en) lists textbooks by academic year, including 2026–27, 2025–26, and 2024–25. The supplied [official Grade 3 Kannada FL Part 1 PDF](https://textbooks.karnataka.gov.in/uploads/Karnataka_Textbook_Society/2026-27%20TEXTBOOKS/3rd%20%20STD/LANGUAGE%20TEXTBOOKS/3rd%20%20KANNADA%20FL%20%20Part%201%202026-27.pdf) was downloaded and compared with `3rd_KANNADA_FL_Part_1_2026-27.pdf`. Both have SHA-256 `bbb0b521d1ce16b21f94f7eec99e17441d739bdd523a7ada2ed5fec373faaefe`. The cover names ಸವಿ ಕನ್ನಡ, Grade 3, Part 1, and Karnataka Textbook Society; the official download is catalogued as Kannada first language under 2026–27.

The [publisher's about page](https://textbooks.karnataka.gov.in/15/about-us/en) identifies Karnataka Textbook Society as responsible for textbook preparation, printing, and distribution. Use **Karnataka Textbook Society**, with proposed registry ID `ktbs`, as this book's publisher—not `KSEEB`.

The [examination board's official history](https://kseab.karnataka.gov.in/new-page/About%20KSEAB/en) expands **KSEEB** as **Karnataka Secondary Education Examination Board**, renamed **Karnataka School Examination and Assessment Board (KSEAB)** in 2022. This is an examination authority, not an interchangeable publisher name or evidence of this Grade 3 book's curriculum affiliation. Preserve `KSEEB` where required by legacy clients, but do not mechanically replace it with `KSEAB` in canonical metadata.

The eight chapter titles match the supplied book's contents. Chapters 1, 2, and 4 originally lived under `KSEEB/Karnataka/English/Grade5/Kannada/`; Chapters 3, 5, 6, 7, and 8 lived under `KSEEB/Karnataka/Kannada/Grade3/Kannada/`. The [bounded compatibility correction](catalog-unification.md) now unifies the source folders and updated mobile listing under Kannada/Grade3, while retaining historical API views. These are not two independent publications. On September 13, 2026, the maintainer clarified that the same PDF is used by Grade 3 students for first-language Kannada and Grade 5 students for second-language Kannada. Grade 5 remains a valid adoption context, not a learner preference to overwrite. The Grade 5 usage is maintainer-reported, not independently verified statewide adoption; the legacy `KSEEB` label also does not identify its publisher.

Reconcile all eight chapters into one publication edition after checking the older chapter text against this exact PDF. Matching titles justify reconciliation, not an assumption that every older transcription/exercise answer matches the edition. Preserve segment IDs, contributor joins, and supported translation glosses; verify or omit unsupported edition provenance rather than blindly relabelling text.

The printed grade is 3 and the source language is `kn`; eligible learner grades are not restricted to the printed grade. First- and second-language Kannada describe the subject's role in each adoption context, not every school's teaching medium. Keep the DIKSHA Kannada-medium association as sourced applicability, separate from the maintainer-reported Grade 5 use. Do not infer English medium from an English translation or portal language, or apply Kannada medium automatically to every adoption.

The existing DIKSHA evidence also remains relevant: QR code `X6D4P9` resolved during conversion to a Grade 3, Kannada-medium, CC BY 4.0 entry titled `3 Kannada FL_2024-25_Part 1`, while the supplied official download is listed for 2026–27. Retain both source assertions. An older entry does not prove every subsequent edition/asset has identical content or rights; resolve edition-level licensing before publishing additional scans/media. Do not silently relabel the supplied PDF as a 2024–25 edition.

The [Saraswati House e-resources catalog](https://e-resources.saraswatihouse.com/) lists Bhasha Tarni, Gyanganga, and Saksham Hindi Pathmala separately under Hindi. This confirms that grade plus language cannot identify a book. Their use in Tamil Nadu is user-provided context, not evidence that their publisher, curriculum, or content origin is Tamil Nadu. Verify individual series/volume/edition details and redistribution rights; a public catalog is not an open-content license.

## Proposed source layout

Use a shallow resource layout rather than a directory level for every browsing filter:

```text
content/
├── publishers/
│   ├── ktbs.yaml
│   └── saraswati-house.yaml
├── series/
│   └── <series-id>.yaml
├── adoptions/
│   └── <adoption-id>.yaml
├── books/
│   └── <book-id>/
│       ├── book.yaml
│       └── editions/
│           └── <edition-id>/
│               ├── edition.yaml
│               └── chapters/
│                   └── <chapter-id>/
│                       ├── source.kn.yaml
│                       ├── translation/
│                       │   ├── en.yaml
│                       │   └── hi.yaml
│                       ├── transliteration/
│                       │   ├── latin.yaml
│                       │   └── devanagari.yaml
│                       └── README.md
├── assets/
│   └── <asset-id>.yaml
└── migrations/
    └── <migration-id>.yaml
```

These are proposed files, not currently valid schema instances. `content/` remains a root-level contributor area, separate from `apps/` and `packages/`. Contributors still edit chapter YAML; READMEs remain generated. The source/contributor segment-ID join is unchanged.

For this book, a readable proposed ID is `ktbs-savi-kannada-g3-fl-p1`, with edition ID `2026-27`. Here `g3-fl` describes the printed publication, not a restriction on who can use it; clients must not parse IDs to infer learner eligibility. IDs are assigned and stable, not reconstructed from mutable metadata. A correction to a display title, grade, or publisher label must not automatically rename an ID. Retain existing chapter slugs as chapter IDs within the edition if suitable; order/number belongs in `edition.yaml`, not in a global identity assumption.

The three Saraswati Hindi series get separate series records. Each independently selectable textbook/grade/part within a series gets a book ID, and each identifiable edition gets an edition ID. Do not put every volume of a series into one book or duplicate a volume for each state using it. Publisher-translated/adapted books can have separate identities; community translations remain contributor maps.

### Metadata responsibilities

| Record | Responsibility |
|---|---|
| Publisher | Stable organization ID, verified name, official source; not an examination board |
| Series | Optional named collection and publisher; unnecessary for standalone books |
| Book | Stable ID, title, publisher/optional series, subject/source-language identity, volume/part where applicable |
| Edition | Stable ID, imprint/edition label, printed grade/language role where present, ISBN if present, source documents/checksums, license evidence, ordered chapters |
| Adoption | Stable context ID referencing one book/edition; learner grade and language role together, optional curriculum/board, region, school medium, institution, academic-year associations, and evidence/scope of the usage claim |
| Chapter | Identity within book/edition, title/order, source segments and contributor maps |
| Asset | Stable ID, immutable object key/checksum, MIME type/dimensions, source page/crop, attribution/license, accessible descriptions; no credentials |
| Migration | Legacy-path/identity mappings, compatibility metadata projections, persisted-state upgrades and retention rules |

Omit unknown optional metadata instead of inventing a board/state/medium/ISBN/edition to fill a mandatory directory level. Represent related applicability facets as sourced context records: two grades and two curricula must not automatically imply all four combinations are valid. Add validation for these records and references rather than weakening today's path checks.

### One book, multiple adoption records

Use logical catalog references—the discovery equivalent of symlinks—not filesystem symlinks or duplicated chapter YAML. The following is an illustrative future catalog shape, not a schema change or data accepted by today's validator:

```yaml
adoptions:
  - id: savi-kannada-grade3-first-language
    bookId: ktbs-savi-kannada-g3-fl-p1
    editionId: 2026-27
    learnerGrade: 3
    subjectLanguage: kn
    languageRole: first-language
    evidence: Official 2026–27 textbook listing; maintainer confirms use.
  - id: savi-kannada-grade5-second-language
    bookId: ktbs-savi-kannada-g3-fl-p1
    editionId: 2026-27
    learnerGrade: 5
    subjectLanguage: kn
    languageRole: second-language
    evidence: Maintainer-reported use on 2026-09-13; institution unspecified.
```

Keep grade and language role paired: these records do not claim Grade 3 second-language or Grade 5 first-language usage. Both references resolve directly to the same edition and its complete ordered chapter list, not just the subset currently stored under each legacy directory. Validate unique adoption IDs and existing book/edition targets; do not introduce alias chains or cycles. More precise school/curriculum evidence can narrow a usage claim without changing the book identity.

Browsing or searching for “Grade 3 Kannada first language” and “Grade 5 Kannada second language” should find the same book, labelled with the selected usage context and its printed publication details. Preserve a learner's Grade 5 selection; never change it to Grade 3 because of the cover. An unfiltered book search should show one edition with both usage labels, not duplicate indistinguishable results. Multiple unrelated books matching a grade still require a book picker.

Store/download each canonical chapter revision once per device across adoption references. Keep reading progress keyed by learner/profile plus canonical book/edition/chapter/segment identity so siblings do not share progress accidentally. Switching adoption context for the same learner and edition must not strand progress or trigger another download. Distinguish removing a book from one profile/context from deleting its shared offline files; preserve references from other profiles or require an explicit device-wide removal action. Migration aliases for old paths are separate from adoption records: one preserves compatibility, the other describes legitimate ongoing usage.

### Academic year versus edition

Academic-year availability and edition identity are different. An unchanged reprint used in another year can reference the same edition after verification; changed publisher text needs a distinguishable edition. Record document checksums and dates so that decision is auditable. Do not silently replace a learner's edition with the newest one. Corrections to Akshar's transcription within an edition change its content revision/hash; a publisher's revised edition is a separate selection. Deduplicate binary assets by checksum without merging their source/rights provenance.

### Optional ISBN lookup

Keep required internal `bookId`, `editionId` and chapter identity independent of optional external identifiers. Record a verified ISBN with the edition and the source format it identifies, including evidence; do not assign the source publication's identifier to Akshar's YAML or community translations. No verified ISBN for the current Karnataka PDF is recorded in this design. Absence of an ISBN must not block conversion, catalog inclusion or ordinary title/adoption search.

The implementation should accept ISBN-10 and ISBN-13 input, remove permitted display separators, validate characters/length/checksum, and match supported equivalent representations only through a validated conversion. Keep display formatting separate from the normalized lookup value. Flag conflicting assignments for review rather than merging books based on one external identifier. Valid syntax/checksum is not evidence of publisher assignment; do not fill missing identifiers from guesses.

Store these assertions in source-controlled metadata YAML and generate them into `api/v2/contents.json`; never hardcode or hand-edit a parallel ISBN registry in `api/`. Start with local lookup in the downloaded catalog and show the matched edition/format plus available learner contexts. Barcode scanning, commercial metadata services and a separate search backend are deferred. Data work is tracked in the [shared roadmap](roadmap.md); search interaction belongs in the [mobile roadmap](../apps/mobile/docs/roadmap.md).

### Flexible browsing, stable storage

Browse manifest metadata, not folder names. Support learner grade → subject/language role → book → edition, publisher → series → book, and region/curriculum/medium filters as views of the same records. Filter grades through adoption records rather than the edition's printed grade. Show a book picker when several publications match; never concatenate their chapters merely because grade and subject match. Optional/unknown facets must not make books unselectable.

Do not substitute arbitrary unchecked directory nesting for the old hierarchy. Storage stays predictable; a versioned catalog provides flexibility. Canonical chapter identity is `(bookId, editionId, chapterId)` or an equivalent collision-safe serialization. API paths are locators. Downloads, history, and progress use canonical identity, with segment IDs scoped to it; a folder move or host change must not reset progress.

## Android refresh audit

This describes checked-in code, not proof of the version installed on every device or deployed on the CDN.

| Concern | Current behavior | Limitation |
|---|---|---|
| Chapter freshness | `scripts/build_json.py` computes a SHA-256-derived `contentHash` (16 hex characters); `content-repository.ts` fetches chapters with `?v=<contentHash>`. | A fresh manifest can change a fetch's cache key, but hashes do not migrate paths or guarantee CDN propagation. |
| Catalog freshness | Timestamp query plus `cache: 'no-store'`; persisted catalog shown first, refreshed at boot, `generatedAt` compared; manual refresh clears in-memory caches. | Old filters, history, and URLs still need migration. |
| ETag | No explicit ETag persistence, `If-None-Match`, or 304 handling in the content repository. | Application-level conditional revalidation is not implemented, whatever the server/OS may cache. |
| Downloads | `downloads.ts` stores `<slug>.json`; `use-chapter.ts` returns it before network access. No saved hash comparison. | Slug collisions across books; downloaded chapters do not automatically refresh. |
| Saved selection/history | Scope persists board/state/medium/grade; history persists paths; `hierarchy.ts` hard-codes those facets plus subject. | Reclassification can empty a scope or strand history. |
| Schema compatibility | `schemaVersion` is present, but fetched JSON is cast to TypeScript types without runtime version validation. | A new version string alone does not protect old clients. |
| Generated API | The artifact gap from the September 13 workflow is fixed. The bounded correction generates two complete v1 views from eight canonical sources; the updated app deduplicates them using exact path mappings. | Historical URLs and saved grades remain supported. General publication/adoption identity is still deferred. Local/CI checks share `scripts/check.py`. |

An ETag answers “are these bytes unchanged?”, not “where did my book move?” or “which edition is this download?”. Conditional requests can complement hashes, schema versions, explicit migrations, and last-known-good offline data; they cannot replace them.

## API versioning policy

Treat the currently served unversioned endpoints as **v1**. Their payloads already carry `schemaVersion: "1.0"`; adding a versioned directory now is not necessary to publish missing chapters in that same contract.

| Contract | Catalog | Chapter payloads | Status |
|---|---|---|---|
| v1 | `api/contents.json` | Existing `api/{board}/{state}/{medium}/{grade}/{subject}/{slug}.json` URLs | Implemented; unchanged until the tested cutover, retirement then authorized |
| v2 | `api/v2/contents.json` | A separate `api/v2/` namespace resolved from that catalog | Authorized publication/adoption-aware replacement; not implemented |

A breaking change includes removing/renaming fields, changing field types or identity semantics, relocating a URL without retaining compatible output, or sending segment shapes a supported client cannot render safely. Publish such changes under a new major namespace with matching payload `schemaVersion`, runtime client version checks, migration/rollback tests, and an explicit support policy for older versions. A version string alone is not a compatibility mechanism. Do not make the v1 catalog point to v2-only payloads.

Adding chapters or correcting text within the existing contract does not require a new major version: regenerate hashes/catalog metadata and preserve existing identities. Optional additions are compatible only after checking supported consumers. Keep API major versions separate from textbook editions, academic years, and content revisions. Do not move today's URLs into `api/v1/`; an optional future v1 alias would be generated in addition to the original URLs, not instead of them.

For future v2 evolution, keep stable identity separate from locator URLs and mutable display metadata. Define optional metadata and supported capabilities explicitly; clients should tolerate documented optional additions but reject unsupported major contracts and required content capabilities without corrupting cached data. Validate authored metadata strictly and retain fixtures for supported versions. None of this guarantees zero future breaking changes: new incompatible semantics still require a deliberate version/support decision. The current pilot authorization is not a permanent exemption.

## Safe rollout

1. **Inventory without reconversion:** record the pre-cutover Git revision, generated API/release artifacts and old local-state formats. Reuse the eight published Grade 3 chapters, two held Grade 4 drafts and existing source evidence. Check only unresolved edition assertions; omit unknown claims rather than relabelling content blindly. Do not assume deployed data equals the workspace.
2. **Implement strict identity tooling:** validate book/edition/adoption metadata and canonical references. Update validator, compiler, README generator and publication-hold enforcement together. Retain one editable source per chapter; source organization must no longer dictate public identity. New metadata schemas are in scope, new segment types are not needed for this migration.
3. **Build the v2 contract:** generate `api/v2/contents.json` and its canonical chapter payloads from YAML. Separate printed grade from paired adoption grade/role/medium and academic year from edition identity. Preserve labels, source attribution and contributor maps. Reject held content in both catalog and payload output. Keep v1 unchanged while developing the replacement, with no ongoing v1 projection requirement after cutover.
4. **Implement client identity and setup:** use canonical keys, runtime payload checks, paired adoption discovery, book/edition selection and new local-state namespaces. Offer explained reselection/redownload; full automatic legacy-history/download import is optional and deferred. Retain old files until successful setup and explicit cleanup, keep unrelated preferences where practical, and make failure/retry idempotent. Do not infer a new learner grade from the cover or decode ambiguous slug-only files as another book.
5. **Move and publish coherently:** after tooling and client acceptance checks pass, move the ten chapter directories once with unchanged segments/contributor joins and preserved Grade 4 holds. Update path-sensitive provenance/checkpoints/docs. Generate v2 artifacts, publish referenced payloads before activating catalog/client references, and verify availability. Keep rollback artifacts; do not conflate pushing source code with deploying the new app release.
6. **Refresh safely:** persist downloaded revision metadata, compare hashes online, fetch into a temporary file, validate schema/identity/checksum, and atomically replace only on success. Keep the old v2 file on failure. Test CDN/cache-key behavior. Update a selected edition's corrections; offer new editions explicitly.
7. **Retire at the tested cutover:** the maintainer's authorization permits ending v1 support and removing obsolete generation/aliases once the replacement release is ready. Record the cutover and rollback procedure. Old clients are not promised continued operation after retirement; the recovery path is the new app and its setup flow, not a fake compatible response or an ETag. No additional architectural approval is required for this agreed support reset.

### Required acceptance checks

- Until cutover, current v1 payloads and the current app remain unchanged. After retirement, old-client compatibility is intentionally not an acceptance requirement; record the last supported release and the replacement setup path.
- New client works on both fresh installation and a device containing v1 catalog/scope/history/downloads. Setup is explained and retryable, does not silently consume v1 data as v2, and preserves old files until successful setup and explicit cleanup. Full automatic history migration is not required.
- Two publishers/editions sharing a chapter slug never overwrite downloads/progress; users can explicitly select the right book.
- Grade 3 first-language and Grade 5 second-language browsing both resolve to the same eight-chapter edition with one canonical download. Book/edition results deduplicate adoption routes, unrelated publications remain separately selectable, and unsupported grade/role/medium combinations are not inferred. General text/ISBN search and a multi-profile UI remain separately tracked work.
- Switching adoption contexts preserves the same learner's canonical history/downloads. Grade 5 remains an available Grade 5 selection. Cache design shares content while namespacing user state by profile; a profile switcher is not required to complete this migration.
- Offline boot, failed refresh, stale CDN manifest, partial deployment, 404, and malformed/unsupported payload preserve last-known-good content and allow retry.
- Content correction changes a hash; a new edition does not silently replace the selected one. A moved locator does not change canonical identity or strand history.
- Duplicate canonical IDs, dangling adoption/chapter references, path escapes and held Grade 4 catalog entries/payloads fail validation. Source segments, IDs, labels and contributor maps survive relocation unchanged; metadata changes never fabricate license or edition evidence.
- Generated v2 output and mobile contracts pass local checks and the shared CI/pre-push path. The pre-cutover snapshot and release rollback procedure remain available; rolling back must not silently delete v2 local state. Fresh install, failed/offline setup, interrupted download and retry must be exercised before claiming readiness.

## Provider-neutral object storage

Keep textbook illustrations/scans, PDFs where redistribution is authorized, and generated audio outside Git. Keep small asset manifests, source/license evidence, checksums, and reproducible crop/processing recipes in Git. Small UI icons can remain app assets. `/tmp/akshar-conversion/` is disposable working storage, not a backup, public origin, or finished production asset collection.

Choose a provider during implementation, not in the content schema. Compare AWS S3, Azure Blob Storage, Google Cloud Storage, Cloudflare R2, Backblaze B2, and suitable S3-compatible services using actual storage/read/write/egress/CDN costs, regions, public-read/private-write controls, custom domains, CORS, caching, versioning/recovery, integrity checks, lifecycle rules, export/migration, and beginner-friendly upload workflows. Do not assume identical APIs or permanent free tiers.

Use provider-independent asset IDs and immutable versioned/content-addressed object keys. Resolve through an asset base URL/generated manifest so switching providers does not require editing every chapter or affect progress. Separate raw originals/private staging from approved public derivatives; crop/optimize without sacrificing readable text. No credentials, public upload permission, or expiring signed URLs in durable public catalog references. Publish objects before references and retain assets needed by supported editions/clients. Verify rights per source, not from downloadability.

## Implementation boundary

The full publication/edition/adoption migration is **not implemented**. A [bounded v1 compatibility bridge](catalog-unification.md) unifies the existing eight Kannada source chapters and updated app listing, preserves their historical paths/state, and serves complete historical scope views to old clients. This does not implement v2, generic multi-book identities, or adoption-aware discovery. Further moves require the broader migration and acceptance work above. `AGENTS.md` makes these safeguards normative; [Roadmap](roadmap.md) tracks implementation separately from image rendering and storage-provider selection.
