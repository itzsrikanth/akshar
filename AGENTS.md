# Instructions for AI coding agents

This file is normative for any AI agent (regardless of vendor/tool) making changes in this repository. Where this file and `CONTRIBUTING.md`/`README.md` overlap, this file's rules take precedence for agent-authored changes — the human-facing docs explain *what* the format is; this file adds the *strict* rules an agent must not deviate from.

## Security — this repo is public

This repository, and any `apps/`/`packages/` code added to it later, is **public**. Never commit secrets: API keys with server-side/admin privilege (Firebase Admin SDK service account JSON, Supabase service-role key), OAuth client *secrets* (confidential-client credentials — a native app's public client ID is fine), signing keystores/keys (Android keystore, iOS provisioning/signing certs), `.env` files with real values, or any LLM/third-party API key used for a paid or rate-limited feature. Client-side config that's inherently public even in a compiled app binary (a Firebase `apiKey`, a Sentry DSN, a GA4 measurement ID) is fine to commit — those aren't secrets, the security boundary for them is server-side rules/entitlement checks, not hiding the value. When in doubt, treat it as secret: use `.env.example` with placeholder values, inject real values via CI/build-time secrets, and never assume "I'll move this to a private repo later" undoes an earlier public commit — forks, caches, and search indexes can outlive a visibility change.

## Planned layout (monorepo)

Content currently lives under the legacy `{board}/...` tree. The target publication/edition layout and staged migration are documented in `docs/publication-model.md`; that design is not yet an implemented schema. Keep content, schemas, and scripts separate from `apps/` and `packages/` so non-developer contributors never have to navigate app code. Do not move legacy content into the proposed `content/books/...` layout until the validator, compiler, and supported-client compatibility work are implemented and tested. `api/` holds generated JSON compiled from YAML (see `scripts/build_json.py`), served as-is via a CDN — never hand-edit it. `apps/` and `packages/` are reserved for app code; don't add unrelated content there.

## Publication identity and supported-client compatibility

Treat published content URLs, manifest fields, chapter identities, and persisted client state as a compatibility contract. Folder reorganization is not a safe migration by itself. Follow `docs/publication-model.md` before changing layout, metadata classifications, IDs, slugs, editions, or API shape.

- Verify publisher, book/series, grade, source language, language role, edition, and source provenance independently. Publisher is not board; school medium is not subject language; a state's use of a book is not its identity. Preserve distinct publications with the same grade/subject. Do not duplicate one book merely because several schools, states, or media use it, or guess missing metadata to satisfy a directory hierarchy.
- Distinguish the publication's printed grade/language role from each adoption's learner grade/language role. The same Kannada book is used in Grade 3 as first language and Grade 5 as second language; neither context invalidates the other. Model these as evidenced, paired adoption records pointing to one canonical edition, not copied chapter YAML or filesystem symlinks. Do not claim statewide adoption from a reported school use or infer a school's medium. Preserve both discovery routes and saved learner grades during migration; implement the reviewed schema/compiler/client support before adding adoption data.
- Before moving or reclassifying existing content, inventory shipped paths and supported client payloads, plus saved scope/history/download keys. Define explicit legacy-to-canonical mappings and recovery behavior. Use stable book/edition/chapter identity; never use chapter slug alone as a global key or silently remap an ambiguous download.
- Preserve every supported legacy API path and JSON contract through generated compatibility views or retained compatible output. An ETag, content hash, changed timestamp, HTTP redirect, or new `schemaVersion` field alone does not migrate old clients. Keep unsupported new schemas/types off legacy endpoints. Never hand-edit generated `api/` files to fake compatibility.
- Treat today's unversioned `api/contents.json` and chapter URLs as the v1 contract. Breaking changes require a separate major-version namespace such as `api/v2/`, including its chapter payloads, while v1 remains compatible. Do not move existing URLs under `api/v1/` and strand installed clients. Content corrections/revisions are not API major versions; document and test compatibility before selecting either approach.
- Deploy the client migration/compatibility bridge before removing or changing the interfaces it depends on. Migrate history, selections, downloads, and segment references idempotently; preserve last-known-good offline data. Do not require clearing app data, reinstalling, or losing progress to recover. Do not silently switch the learner to a different edition or alter their school grade based on a correction to one book's catalog metadata.
- Publish referenced content/assets before catalogs; validate supported schema, identity, and revision before atomically replacing downloaded data. Preserve the previous copy on failure and retain rollback artifacts. Test old and new clients, offline boot, interrupted updates, stale CDN responses, missing content, duplicate slugs across books/editions, and failed/retried migrations before declaring a reorganization complete.
- Preserve segment IDs and contributor joins during moves. Add new-schema validation rather than weakening legacy checks. Compile and check every supported API version after content/metadata/layout changes, in addition to validation and generated README checks. If regeneration is intentionally deferred, report that the app/API is not updated; never call a YAML-only change published.
- Retiring legacy paths or migration mappings requires an explicit support/retention decision and a tested recovery path; do not delete them merely because the newest client works.

The bounded Kannada catalog correction is implemented in `docs/catalog-unification.md` and `catalog-compatibility.json`. Keep its canonical YAML under Kannada/Grade3, generate both v1 compatibility views, and normalize catalog views in clients rather than duplicating YAML or deleting historical URLs. This exception does not implement the proposed publication schema or authorize arbitrary grade/medium remapping. Preserve the exact path mappings and saved learner state when modifying it.

## Media storage

Textbook illustrations, scans, distributable source PDFs, and generated audio belong in external object storage, not the Git content corpus. Keep provider-independent asset references, provenance/license evidence, checksums, and reproducible crop/processing details in Git; small UI icons are a separate app-asset concern. Temporary extraction directories are not durable storage. Provider selection is deferred to an implementation-time comparison of cloud/object-storage options; do not couple schemas or chapter IDs to Cloudflare or any other vendor. Verify redistribution rights before upload, keep writes authenticated, and never put storage credentials or expiring signed URLs into public content/app code.

## What this repo is

A CC BY 4.0 dataset of Indian school textbook content as structured YAML: a canonical source text per chapter, plus community transliterations (same text, different script) and translations (same text, different language). The consumer is either a human reading `CONTRIBUTING.md`/chapter READMEs, or a downstream JSON/API build over this data — never assume a specific consumer; the source-of-truth is the YAML.

## The stitching model — read this before touching any content file

Every chapter folder (`{board}/{state}/{medium}/{grade}/{subject}/{chapter}/`) has this shape:

```
ch01-example/
├── source.kn.yaml               canonical text, full structure, validated by schema/source.schema.json
├── transliteration/
│   └── devanagari.yaml          flat id → text map, validated by schema/contributor.schema.json
├── translation/
│   └── en.yaml                  flat id → text map, same schema as transliteration
└── README.md                    generated — never hand-edit, see "Generated files" below
```

**How the join works, exactly:** `source.{lang}.yaml` is the only file with real structure (`segments` is an ordered array of objects with `id`, `type`, `text`, and optional `section`/`stanza`/`exercise`/`ref`/`speaker`). Every `transliteration/*.yaml` and `translation/*.yaml` file is a **flat dictionary** whose keys are segment `id`s copied **character-for-character** from the source file, and whose values are that segment's text in a different script (transliteration) or language (translation). There is no other linkage — the `id` string *is* the foreign key. A compiler/app joins these by iterating the source's `segments` in order and looking up `segment.id` in each contributor file's map.

The `labels` block (optional, top-level in both source and contributor files) is the same mechanism applied to section headings instead of segment text — keys are section names (`competency`, `intro`, `poem`, `vocab`, `notes`, `story`, `exercise-A`, ...), not segment ids, but the join rule is identical: contributor files must reuse the *same keys* the source file used, never invent their own.

### Strict rules for this join — do not violate these

1. **Never invent a segment id.** When adding a transliteration/translation entry, copy the id verbatim from the source file you're mapping to (`meta.source`). Do not rename, reformat, or "improve" an id.
2. **Never add a key to a contributor file that has no matching id in its `meta.source` file** (except `meta` and `labels`, which are structural, not segment ids). `scripts/validate.py` enforces this — if it fails on an orphan id, the id is wrong, not the validator.
3. **Never fabricate content.** If a translation, transliteration, answer, or speaker attribution is not knowable from the given source text, omit it — do not guess a plausible-sounding value. Leave the field/segment out entirely rather than filling it with something that might be wrong. (Precedent: `ch02-nanna-kanasu/source.kn.yaml` segment `story-d11` has no `speaker` field because the original text had no textual basis to infer one — that is correct, not incomplete.)

4. **Partial contribution files are normal and valid.** A transliteration/translation file does not need to cover every segment id in its source. Do not pad missing entries with placeholder text to make a file "complete."
5. **Do not add new segment `type` values or new segment fields silently.** If existing types (`competency`, `prose`, `dialogue`, `poem_line`, `question`, `answer`, `fill_blank`, `vocabulary_term`, `vocabulary_definition`, `note_term`, `note_definition`) and fields (`section`, `stanza`, `exercise`, `ref`, `speaker`) don't fit the content you're structuring, extend `schema/source.schema.json` and `schema/contributor.schema.json` additively (new enum value / new optional field) in the same change, and explain the addition in the commit message. Never remove or rename an existing enum value or field — other chapters depend on it. Never require a new field to be non-optional; new content shapes must not break old segments that lack it.
6. **`meta.license` must reflect what's actually on the DIKSHA source page** (CC BY 4.0 or CC BY-SA 4.0 vary by board/state) — verify it, don't default to copying the previous chapter's license value without checking.

## Translation editorial standard

Translations should be accurate, natural, and age-appropriate for the textbook's intended readers; they are not required to be word-for-word literal.

Preserve helpful contextual explanations in an established translation when they accurately explain the source without changing its meaning. Examples include a brief gloss for a culturally specific term, or a concise musical or technical clarification that is directly supported by the text.

Do not remove such context solely because it is implicit in the source. Remove or revise it only when it adds unsupported facts, changes meaning, or is misleading. When improving an existing translation, prefer a minimal diff and preserve its established spelling and readability style unless a project-wide policy changes.

## Markdown formatting

Do not manually hard-wrap prose paragraphs in `.md` files. Keep each paragraph on one line; editors handle visual wrapping.

## Generated files — never hand-edit

Every chapter's `README.md` is generated by `scripts/generate_readme.py` from the YAML. Never edit a chapter `README.md` directly — edit the source/contributor YAML and regenerate.

## Required commands after any content or schema change

Run both, in this order, before considering a content change complete:

```
python3 scripts/validate.py              # schema conformance, duplicate/dangling ids, BOM checks
python3 scripts/generate_readme.py       # regenerates every chapter README.md from the YAML
```

If `validate.py` fails, fix the content — do not weaken the check to make it pass. If `generate_readme.py` produces a diff, that diff must be committed alongside the content change (a stale generated README is treated as a bug in CI via `generate_readme.py --check`).

Before committing/pushing, also regenerate `api/` with `python3 scripts/build_json.py` and run `python3 scripts/check.py`, the shared local/CI entrypoint. Stage the generated artifacts with their source changes. Install the opt-in `.githooks/pre-push` hook as documented in `CONTRIBUTING.md`; it checks committed snapshots so uncommitted fixes cannot mask a broken push. Do not bypass failed checks or weaken validation to publish.

## Conversion reuse, server courtesy and resource use

- Before downloading, extracting or translating, check the PDF inventory, provenance records, completed chapters and local draft archives. Use the original PDF's SHA-256 as the exact-file identity, not its filename, URL, grade label or directory. If identical bytes already have a conversion, reuse that work and record alternate names/URLs in tracking metadata instead of starting another conversion. Track chapter work by source hash and verified page interval as well as chapter identity. Never infer a different publication from a renamed file or duplicate one book for a different adoption.
- Different PDF hashes do not necessarily mean different chapter text: compare printed edition/part, contents, page boundaries and relevant pages before deciding to reconvert. Reuse reviewed text where equivalence is established, recording the comparison and changed pages; do not merge distinct editions blindly or transfer license evidence automatically. Preserve existing canonical IDs and API compatibility mappings. A text fingerprint can help locate candidates but cannot establish page, image or rights equivalence by itself.
- Prefer verified cached PDFs, API responses, extracted text and reviewed drafts over new requests or repeated extraction. Microsoft MarkItDown is allowed as a local extraction option; compare it on a small representative chapter/page sample only when it could improve the existing extraction. Do not reinstall an available tool, process an entire book through multiple tools without a demonstrated need, or enable paid/cloud/LLM processing without approval. Extraction tools do not replace visual verification of uncertain text or exercise coverage.
- Protect access to public textbook/DIKSHA servers over download speed. Use one request at a time, including across any agents or processes; no parallel connections, speculative endpoint sweeps or repeated polling. Reuse cached search pages and plan the smallest query needed. For new conversion fetches, leave at least two seconds between requests to the same service, follow any stricter published limits, and use a small explicit request budget per lookup (normally at most ten requests before reassessing). This is a project courtesy policy, not a claim about the server's rate limit or a guarantee against bans. On HTTP 429, honor `Retry-After` and pause; on 403, CAPTCHA or other access-denial signals, stop and report rather than retrying around the restriction. Use bounded backoff for transient failures; never rotate identities, proxies or endpoints to evade a block. Do not assume an existing downloader automatically enforces every part of this policy; inspect its retry behavior before using it.
- Distinguish catalog JSON (titles, hierarchy, licenses and artifact links) from actual chapter text. Record which source supplied the transcription; do not claim an endpoint provides structured Kannada lesson text merely because it returns textbook metadata. Cache the endpoint/query, retrieval date and response hash so a later session can reuse the evidence rather than refetch it unnecessarily.
- Verification images must be renders/crops of the actual source, not AI-generated reconstructions. Reuse existing renders, inspect only the current chapter, and use the lowest readable resolution. Enlarge only ambiguous regions; avoid redundant whole-page renders, image views and contact sheets. Prefer text/structural checks where sufficient, but retain necessary visual checks for poem boundaries, legacy fonts, exercises, tables and image-dependent questions. Lower cost must not mean silently skipping content or guessing.
- Keep context lean: read targeted sections, summarize tool output instead of dumping full API responses, and checkpoint at chapter or investigation boundaries. Save exact source hashes, work paths, reviewed pages, checks, outstanding ambiguities and the next action before stopping. Use host-supported compaction when available; do not claim to have compacted or to know exact remaining context without a supporting capability. If compaction cannot be invoked, finish a safe checkpoint and tell the maintainer it is ready for manual compaction. Do not start another large chapter merely to fill the remaining session.

## Conversion-session checkpoints

### Lean conversion and durable YAML

The maintainer requests source-first conversion with actual YAML committed and pushed at each session boundary, not new ZIP archives. Reuse checked-in chapters, cached PDFs, pinned extraction tools and recorded book-level evidence. Do not repeat endpoint searches, compare multiple extraction tools without a concrete problem, or recreate already reviewed work under another filename. Read the focused checkpoint rather than dumping the full historical investigation.

Review and stabilize the Kannada source, chapter boundaries, mandatory exercises and segment IDs before spending effort on translations. Generate transliteration drafts mechanically where reliable and review exceptions. Partial contributor maps are valid; defer optional answers, stylistic polishing, audio, word-level glosses and new UI features rather than source accuracy or exercise coverage. Mark source-only or partially translated chapters honestly; do not label them complete.

Store session YAML directly in the existing validated chapter directories until a reviewed layout migration is implemented. Do not create new ZIPs as the deliverable or leave the only editorial work in `/tmp`. Existing archives are historical recovery artifacts. For continuing Grade 4 editorial drafts from the already recorded edition, use the same truthful license status and explicit API publication holds as Chapters 1–2; this is Git-only storage, not production release or newly verified rights. Do not infer permission for unrelated publications or silently extend a book's license to another edition. All YAML must pass unchanged schemas and structural checks. Update one focused TODO entry and necessary provenance, generate required artifacts, run checks, and commit/push the intended files together without unrelated user changes. State clearly when work is in Git but excluded from app delivery.

### Explicit Grade 4 Git-only exception

The maintainer explicitly authorized committing Grade 4 Chapters 1–2 YAML despite the unresolved edition-rights and renderer concerns, provided production apps remain unaffected. The subsequent lean-workflow instruction permits continuing the same known book as held editorial YAML, not ZIP deliverables. This is a Git-storage exception, not evidence of a CC license or authorization to release these chapters through the app. Their `meta.license` truthfully records `Unverified; source PDF states NOT TO BE REPUBLISHED; no CC license asserted`. Do not copy this exception to unrelated content automatically.

`api-publication-holds.json` lists these chapters by exact directory path. They still undergo every source/contributor schema and structural check; no missing fields or orphan IDs are waived. The compiler excludes them from both the production manifest and chapter JSON. Their generated READMEs are explicit draft notices linking to the actual YAML, not incomplete rendered lessons. Missing/invalid hold configuration, an unapproved license without a hold, or an existing production payload for a held chapter must fail checks. Supported API licenses are explicitly reviewed in `scripts/publication_holds.py`; do not expand that set just to bypass a hold.

Keep the full production `api/` tree and existing chapter READMEs unchanged for this Git-only upload. Removing a hold requires verified source rights, accurate contributor licenses, renderer compatibility for all exercises and the normal validation/generation pipeline. Historical local archives remain untouched; the checked-in YAML is now the continuation source. The local-only rules below still apply to other unresolved-rights drafts unless the maintainer separately authorizes an exception.

The maintainer requests an incremental commit and push at the end of each conversion session, unless a later instruction says otherwise. Put verified, publishable chapter YAML in the canonical repository tree, include generated README/API changes, and run the required checks before committing. Update the conversion TODO and provenance checkpoint with completed work, remaining blockers and exact resume instructions. Stage only the session's intended files; preserve unrelated user work, never bypass hooks, and never force-push to resolve a remote conflict. Report the commit and push outcome accurately rather than treating a local commit as remote backup.

Do not force-add historical archives, fabricate a license or publish incomplete-schema YAML to satisfy a checkpoint policy. For unrelated publications without a Git-storage authorization, explain the restriction before undertaking a large conversion; do not silently revert to ZIP-only delivery. Keep unvalidated extraction outside the repository because content tools discover `source.*.yaml` recursively. A private remote destination requires separate authorization.

## Segment ID conventions

See `CONTRIBUTING.md` → "Segment ID conventions" for the full table (`competency`, `intro-{n}`, `poem-s{stanza}l{line}`, `vocab-{word}`/`vocab-{word}-def`, `note-{word}`/`note-{word}-def`, `ex-{section}-q{n}`/`-ans`, `story-n{n}`, `story-d{n}`). Follow it exactly — a compiler/app relies on these patterns being stable, not just documented.
