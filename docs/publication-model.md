# Publication identity, editions, and safe migration

← [Documentation index](README.md) · [Repository structure](repository-structure.md) · [Roadmap](roadmap.md)

## Status and decision

Design direction recorded September 13, 2026. This proposes the replacement for the current directory model, not an implemented schema or immediate folder move. The validator, compiler, and Android client still require the legacy contract. Implement the compatibility bridge below before moving published sources or changing their public identities.

**Store a publication once, identify its editions explicitly, and use metadata for discovery.** Publisher, curriculum, state, printed grade, learner grade, subject, source language, language role, and school medium are separate concepts. A book used by several grades, states, schools, curricula, or media must not be duplicated under each classification. An adoption record links a learning context to a book edition; it does not create another copy of the content.

## Verified source and current discrepancy

The [Karnataka Textbook Society portal](https://textbooks.karnataka.gov.in/textbooks/en) lists textbooks by academic year, including 2026–27, 2025–26, and 2024–25. The supplied [official Grade 3 Kannada FL Part 1 PDF](https://textbooks.karnataka.gov.in/uploads/Karnataka_Textbook_Society/2026-27%20TEXTBOOKS/3rd%20%20STD/LANGUAGE%20TEXTBOOKS/3rd%20%20KANNADA%20FL%20%20Part%201%202026-27.pdf) was downloaded and compared with `3rd_KANNADA_FL_Part_1_2026-27.pdf`. Both have SHA-256 `bbb0b521d1ce16b21f94f7eec99e17441d739bdd523a7ada2ed5fec373faaefe`. The cover names ಸವಿ ಕನ್ನಡ, Grade 3, Part 1, and Karnataka Textbook Society; the official download is catalogued as Kannada first language under 2026–27.

The [publisher's about page](https://textbooks.karnataka.gov.in/15/about-us/en) identifies Karnataka Textbook Society as responsible for textbook preparation, printing, and distribution. Use **Karnataka Textbook Society**, with proposed registry ID `ktbs`, as this book's publisher—not `KSEEB`.

The [examination board's official history](https://kseab.karnataka.gov.in/new-page/About%20KSEAB/en) expands **KSEEB** as **Karnataka Secondary Education Examination Board**, renamed **Karnataka School Examination and Assessment Board (KSEAB)** in 2022. This is an examination authority, not an interchangeable publisher name or evidence of this Grade 3 book's curriculum affiliation. Preserve `KSEEB` where required by legacy clients, but do not mechanically replace it with `KSEAB` in canonical metadata.

The eight chapter titles match the supplied book's contents. Chapters 1, 2, and 4 currently live under `KSEEB/Karnataka/English/Grade5/Kannada/`; Chapters 3, 5, 6, 7, and 8 live under `KSEEB/Karnataka/Kannada/Grade3/Kannada/`. These are not two independent publications. On September 13, 2026, the repository maintainer clarified that the same PDF is used by Grade 3 students for first-language Kannada and Grade 5 students for second-language Kannada. Grade 5 is therefore a valid adoption context, not an error to correct to Grade 3. The problem is that one book's chapters are split across discovery paths; the legacy `KSEEB` label also does not identify its publisher. The Grade 5 usage is maintainer-reported, not independently verified statewide adoption.

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
| Generated API | The September 13 workflow failed because five chapter JSON files were missing and the catalog was stale. Regeneration now includes all eight chapters under the existing v1 contract, preserving the three older payloads. | The artifact gap is fixed; the split legacy classifications and shared-book discovery still need migration. Local/CI checks now share `scripts/check.py`. |

An ETag answers “are these bytes unchanged?”, not “where did my book move?” or “which edition is this download?”. Conditional requests can complement hashes, schema versions, explicit migrations, and last-known-good offline data; they cannot replace them.

## API versioning policy

Treat the currently served unversioned endpoints as **v1**. Their payloads already carry `schemaVersion: "1.0"`; adding a versioned directory now is not necessary to publish missing chapters in that same contract.

| Contract | Catalog | Chapter payloads | Status |
|---|---|---|---|
| v1 | `api/contents.json` | Existing `api/{board}/{state}/{medium}/{grade}/{subject}/{slug}.json` URLs | Implemented; retain for installed clients |
| v2 | `api/v2/contents.json` | A separate `api/v2/` namespace resolved from that catalog | Proposed for incompatible publication/adoption-aware changes; not implemented |

A breaking change includes removing/renaming fields, changing field types or identity semantics, relocating a URL without retaining compatible output, or sending segment shapes a supported client cannot render safely. Publish such changes under a new major namespace with matching payload `schemaVersion`, runtime client version checks, migration/rollback tests, and an explicit support policy for older versions. A version string alone is not a compatibility mechanism. Do not make the v1 catalog point to v2-only payloads.

Adding chapters or correcting text within the existing contract does not require a new major version: regenerate hashes/catalog metadata and preserve existing identities. Optional additions are compatible only after checking supported consumers. Keep API major versions separate from textbook editions, academic years, and content revisions. Do not move today's URLs into `api/v1/`; an optional future v1 alias would be generated in addition to the original URLs, not instead of them.

## Safe rollout

1. **Inventory and verify:** capture shipped paths/payloads, supported client versions, legacy slugs, and saved-state formats. Compare all eight chapters to the verified PDF and record edition/license evidence. Keep v1 contract fixtures; do not assume deployed data equals the workspace.
2. **Add identity and compatibility tooling:** implement validated publisher/book/edition manifests and old-path → canonical-ID mappings. Update validator, compiler, and README generator together. Keep one editable source per chapter and generate legacy views; source organization must no longer dictate API URLs.
3. **Separate API versions:** publish a book-aware catalog at a versioned endpoint such as `api/v2/contents.json`. Keep `api/contents.json` and every shipped v1 chapter path compatible. Separate printed publication metadata from adoption grade/language role; correct publisher identity without invalidating either usage context. Preserve old metadata where legacy scopes require it through an explicit v1 projection. Do not expose multiple editions or adoption copies with colliding slugs to a v1 client. Unsupported new segment shapes must be projected safely or retain their last compatible generated payload; never replace legacy JSON with an incompatible schema or error page.
4. **Ship the client bridge first:** support canonical IDs, adoption and book/edition selection, runtime schema checks, and migration manifests before cutover. Migrate scope/history/downloads idempotently, without reinstall, data clearing, or loss of offline access. Use old payload metadata/full path to resolve slug-only downloads; if ambiguous, preserve and ask rather than selecting the wrong book. Map the known legacy Grade5/English book selection to the same canonical edition with its Grade 5 second-language adoption; retain the saved school medium without treating it as verified applicability for all users. Preserve Grade 3 first-language selections too. Neither mapping changes the learner's school grade.
5. **Move and publish coherently:** only after bridge/compatibility tests pass, move the eight sources into one verified edition with segment IDs preserved. Generate both API views. Publish immutable content/media revisions first, verify availability, then publish catalogs/migrations. Keep old URLs resolvable and rollback artifacts available. Old clients cannot interpret a migration map they never learned to read: actual compatible JSON at old paths is the baseline.
6. **Refresh safely:** persist downloaded revision metadata, compare hashes online, fetch into a temporary file, validate schema/identity/checksum, and atomically replace only on success. Keep the old file on failure. Test CDN/cache-key behavior. Update a selected edition's corrections; offer new editions explicitly.
7. **Retire deliberately:** remove legacy paths, objects, and mappings only after an explicit support/retention decision with a tested recovery path for remaining old clients—not merely because new installs work.

### Required acceptance checks

- Old client with old catalog, saved scope, history, and downloaded chapters stays usable after deployment without reinstall/data clear.
- New client upgrades old state once and safely resumes interrupted migration; offline access and segment references survive.
- Two publishers/editions sharing a chapter slug never overwrite downloads/progress; users can explicitly select the right book.
- Grade 3 first-language and Grade 5 second-language browse/search both resolve to the same complete book edition, with one canonical download and separate progress for different learner profiles. An unfiltered search deduplicates by book/edition, and unsupported grade/role combinations are not inferred.
- Removing one adoption/profile reference does not silently delete offline content still used elsewhere; switching contexts preserves the same learner's progress. Migrated Grade 5 users remain Grade 5 users.
- Offline boot, failed refresh, stale CDN manifest, partial deployment, 404, and malformed/unsupported payload preserve last-known-good content and allow retry.
- Content correction changes a hash; a new edition does not silently replace the selected one; old clients continue receiving supported payloads.
- Every v1 URL fixture still returns compatible JSON after source moves, both API versions validate, and rollback does not discard local progress.

## Provider-neutral object storage

Keep textbook illustrations/scans, PDFs where redistribution is authorized, and generated audio outside Git. Keep small asset manifests, source/license evidence, checksums, and reproducible crop/processing recipes in Git. Small UI icons can remain app assets. `/tmp/akshar-conversion/` is disposable working storage, not a backup, public origin, or finished production asset collection.

Choose a provider during implementation, not in the content schema. Compare AWS S3, Azure Blob Storage, Google Cloud Storage, Cloudflare R2, Backblaze B2, and suitable S3-compatible services using actual storage/read/write/egress/CDN costs, regions, public-read/private-write controls, custom domains, CORS, caching, versioning/recovery, integrity checks, lifecycle rules, export/migration, and beginner-friendly upload workflows. Do not assume identical APIs or permanent free tiers.

Use provider-independent asset IDs and immutable versioned/content-addressed object keys. Resolve through an asset base URL/generated manifest so switching providers does not require editing every chapter or affect progress. Separate raw originals/private staging from approved public derivatives; crop/optimize without sacrificing readable text. No credentials, public upload permission, or expiring signed URLs in durable public catalog references. Publish objects before references and retain assets needed by supported editions/clients. Verify rights per source, not from downloadability.

## Implementation boundary

The migration is **not implemented** in this document. The next milestone is the v1 compatibility inventory and identity-aware compiler/client bridge. The missing chapter JSON/catalog artifacts have been regenerated using the existing compiler; that does not implement v2 or adoption-aware discovery. Move sources only after the bridge is tested. `AGENTS.md` makes these safeguards normative; [Roadmap](roadmap.md) tracks implementation separately from image rendering and storage-provider selection.
