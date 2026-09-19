# Kannada expansion: resumable work queue

Status: started September 13, 2026. This file is the handoff checkpoint; update it after each completed step/chapter. Prioritize school-demo content over word-selection/AI features. No new chapter is complete until its source, exercises, four contributor maps, generated README/API, and checks are complete.

## Resume here

Lean workflow: actual YAML in Git is the checkpoint; no new YAML ZIP deliverables. Reuse the checked-in Grade 4 Chapters 1–3, cached PDFs and existing book-level provenance. Continue at Chapter 5 only when conversion is the active task. Stabilize its Kannada source, exercise coverage and IDs before translating; transliteration drafts can be generated mechanically and reviewed. Optional answers, language polish, audio and word-level glosses can wait. Partial contributor maps are valid and must be labeled honestly. For this known Grade 4 edition, keep unresolved-license editorial chapters behind explicit production API holds and commit/push the session's YAML plus necessary generated/tracking files. Do not repeat licensing investigations without new evidence or a production-release task.

1. Read `AGENTS.md`, `CONTRIBUTING.md`, this file, and `docs/kannada-pdf-inventory.json`; inspect `git status` before editing. Existing Grade 3 chapters and their Grade 5 adoption remain protected.
2. Chapters 1–4 YAML live under `content/books/ktbs-savi-kannada-g3-fl-p1/editions/2026-27/chapters/` as held Grade 4 drafts colocated until a Grade 4 book identity exists (twenty files for ch01–ch04). Resume from these files, not temporary extraction or historical ZIPs; do not reconvert them. PDFs remain outside Git in `/tmp/akshar-kannada-2026-27/` (`g04-fl-p1-2026-27.pdf`). Fetch again only when needed for further page review; inventory URLs/checksums remain authoritative.
3. Continue one chapter at a time with Grade 4 first-language Part 1 Chapter 5 next (PDF pages 43–52). Verify printed grade/role, school-medium evidence, chapter boundaries, DIKSHA license, and edition provenance before publishing. Public downloads alone do not grant redistribution rights.
4. Preserve chapter/segment identities and contributor joins. Never guess inflected-word roots, image content, speakers, or unsupported answers. Minor OCR repairs use conservative editorial judgment; new schema types still require a separate proposal.
5. After each chapter: validate, generate only its README, compile API, run `python3 scripts/check.py`, and update this file with exact paths/page ranges and outstanding work. Do not call an extraction draft a completed chapter.
6. At the end of each conversion session, commit and push the authorized changes. Follow `AGENTS.md` → Conversion-session checkpoints, including the explicit Git-only exception for this Grade 4 edition. This upload includes the actual YAML, not merely task metadata. The exception does not authorize release of these chapters through the production API.

### Current Git-only delivery

The maintainer overrode the earlier Git-upload blockers while requiring production safety. Chapters 1–3 source, English/Hindi translations and Latin/Devanagari transliterations are stored as held chapters under the temporary content/books colocation (until Grade 4 book identity is verified). The only change from the checksummed archives is the addition of an honest `meta.license` statement: `Unverified; source PDF states NOT TO BE REPUBLISHED; no CC license asserted`. Full existing schemas and structural validation now pass; no content/schema requirements were waived. This is structural validity, not verified redistribution permission.

`api-publication-holds.json` excludes these exact chapter directories from production manifests and payloads. The generated READMEs are draft notices linking to all five YAML files, not partially rendered lessons. The complete `api/` tree, including its timestamps/hashes and all Grade 3/Grade 5 compatibility views, remains byte-for-byte unchanged. Existing Grade 3 chapter READMEs also remain unchanged. No app code or schema changed.

The next release work is to resolve rights and the documented Chapter 2 renderer gaps, then clear holds only after full compatibility checks. Chapter 3 (`ವೀರಮಾತೆ ಜೀಜಾಬಾಯಿ`, QR `D6K7E4`, PDF pages 27–35) is now Git-only with the same truthful unverified license and production hold. New editorial conversion resumes at Chapter 5, PDF pages 43–52; do not repeat Chapters 1–4. Historical archives remain untouched as local recovery artifacts. Their missing-license reports below describe the old archived versions, not the current Git YAML.

### Reuse and cost checkpoint

Follow `AGENTS.md` → Conversion reuse, server courtesy and resource use. The current Grade 4 Chapter 1 archive already contains the five reviewed drafts; do not rerun extraction or translation under a different PDF filename. The original extraction text and page renders also remain available locally. MarkItDown is available at `/Users/srivenka/.pyenv/shims/markitdown` in the current environment; no new installation or extraction comparison was needed for this checkpoint. Future environments should discover the executable rather than depend on this machine-specific path.

The cached DIKSHA JSON inspected so far supplies catalog/hierarchy, license metadata and resource links, not an Akshar-ready Kannada chapter body. The transcription source is the local PDF. Previous verification images were local PDF renders/crops, not AI-generated illustrations. Existing requests were sequential; this does not establish that the server can never rate-limit us. No new DIKSHA/textbook request was made during this policy update. Future lookups must reuse caches, follow the new conservative pacing/error policy and stop on access restrictions.

Chapter 2 conversion is finished as an editorial draft. The subsequent override authorizes one Git-only upload containing both chapters' actual YAML while keeping the production API unchanged. Reuse the repository YAML for all future work; the old local archives are no longer the only copies of the text.

## Scope and ordering

The official 2026–27 catalog has separate first-/second-language publications. Their printed grade does not determine all adoption contexts; do not merge different PDFs simply because a school uses another grade's book. Start with the first-language Part 1 PDFs for other grades; second-language books and Part 2 remain separately identified in the inventory. Nalikali primers and Kannada-medium maths/EVS are not silently included as Kannada language books.

- [x] Discover/catalog 39 official first-/second-language Kannada PDFs for Grades 1–10; exact links are saved in `docs/kannada-pdf-inventory.json`.
- [x] Download and checksum first-language Part 1 for Grades 1, 2, 4, 5, 6, 7, 8, 9, and 10; verified files are in `/tmp/akshar-kannada-2026-27/`.
- [x] Grade 4 first-language Part 1: inspect front matter, rights evidence, contents, and first-chapter boundaries; split/extract PDF pages 15–19 into temporary working files. Publication rights remain unresolved; see the checkpoint below.
- [x] Resume Grade 4 Chapter 1: visually review all five pages and prepare local source, English/Hindi translations and Latin/Devanagari transliterations (83 segments, 332 contributor entries, 17 labels per file). Preserve all exercises and the printed example. Save a checksummed, Git-ignored local archive; this is editorial progress, not a published chapter.
- [ ] Grade 4 first chapter: complete the full source/contributor/README/API pipeline, subject to verified rights and compatible metadata.
- [x] Grade 4 Chapter 2: review PDF pages 20–26, prepare the source and four contributor maps, check all exercises and preserve a local archive (82 segments, 328 contributor entries, 14 labels per file). This is editorial progress, not publication.
- [x] Grade 4 Chapters 1–2: prepare all ten actual YAML files for the authorized combined Git-only upload, with truthful license status, generated draft notices and explicit production exclusions.
- [ ] Grade 4 Chapters 1–2 production release: resolve edition rights and exercise rendering, set evidenced licenses, remove holds, regenerate the API and verify supported clients before release.
- [x] Grade 4 Chapter 3: review PDF pages 27–35, write source plus four contributor maps (120 segments), add production hold, generate draft README; full schema checks pass.
- [x] Grade 4 Chapter 4: review PDF pages 36–42 (`ಮಳೆ`), write source plus four contributor maps (97 segments), add production hold; full schema checks pass.
- [ ] Continue remaining Grade 4 chapters sequentially from Chapter 5 (PDF pages 43–52), recording chapter-specific checkpoints before proceeding.
- [ ] Grade 5 first-language Part 1, then Grades 1/2 and 6–10: identify chapters and convert sequentially; do not confuse this separate Grade 5 publication with Grade 5 students using the Grade 3 book.
- [ ] Download/convert Part 2 and second-language publications in a later explicit priority pass.

## Historical pre-upload checkpoints

The following local-only checkpoints preserve the extraction/review record. Their missing-license failures, no-commit instructions and local-only paths were superseded by the explicit Git-only delivery above. The archives and their hashes remain unchanged; prefer the current repository YAML, which adds the truthful license-status field.

### Chapter 2 continuation

At the maintainer's request, Chapter 2 `ಬುದ್ಧಿವಂತ ರಾಮಕೃಷ್ಣ` was converted locally without repeating Chapter 1. All seven PDF pages 20–26 (printed 6–12) were visually reviewed; five YAML drafts are in `/tmp/akshar-kannada-2026-27/g04-fl-p1-ch02/reviewed-draft/ch02-buddhivanta-ramakrishna/`. The adjacent `REVIEW.md` and `review-report.json` record editorial choices and checks. Coverage includes 18 story passages, six vocabulary pairs, three note pairs, all eight exercise groups, the printed plural example, ten poem lines in five couplets, nine dialogue turns and the competency. No answer key was invented. Chapter 1's archive was not modified.

The ignored `.conversion-local/g04-fl-p1-ch02-reviewed-draft.zip` contains all five actual YAML drafts plus review notes/report (23,061 bytes; SHA-256 `303f421815af0fee5a037d65d92135ca9e2907c78164e2504e5b4a9b589d3b49`). Member hashes and page coverage are recorded in [the Chapter 2 draft checkpoint](provenance/g04-fl-p1-ch02-draft.json). Verify the hash, then restore with `unzip -n .conversion-local/g04-fl-p1-ch02-reviewed-draft.zip -d /tmp/akshar-kannada-2026-27/g04-fl-p1-ch02/reviewed-draft`. This archive is local recovery only, not remote backup. Do not extract YAML inside the public repository.

**Publication remains blocked:** the cached older collection's Chapter 2 unit (`do_31401171287865753618032`, QR `G6I2Q1`, CC BY 4.0) has no PDF artifact establishing the transcription edition's rights. No new server requests were made. All five drafts intentionally omit `meta.license`; the unchanged validator, run against an isolated canonical-layout copy, reports exactly those five errors. Duplicate-key, exact join/label, encoding, ref, source-coverage, blank-count and transliteration checks pass, but full validation does not.

**Rendering also needs work before publication:** the existing README generator treats exercise poem lines as main-poem lines and omits exercise dialogue. The mobile reader also treats the activity poem as the main poem; its exercise screen omits the dialogue and handles exercise prose only in group C, not the printed example in group D. The existing schema can express the activity content; do not introduce a new type or misclassify content to hide the renderer gaps. Add focused compatibility coverage before publication. Existing chapter YAML, generated API/READMEs and mobile code are unchanged by this continuation. Keep this checkpoint local rather than making a metadata-only commit; the requested combined YAML commit remains pending these gates.

### Chapter 1 retained checkpoint

**Grade 4 Chapter 1: ಕನ್ನಡಮ್ಮನ ಹರಕೆ, by ಕುವೆಂಪು.** PDF pages 15–19 inclusive, printed pages 1–5. The source has 72 PDF pages with 14 front-matter pages. Temporary split PDF, page renders, raw extraction, and the original unreviewed Unicode extraction are in `/tmp/akshar-kannada-2026-27/g04-fl-p1-ch01/`. Reviewed YAML drafts now live in its `reviewed-draft/ch01-kannadammana-harake/` subdirectory; the adjacent `REVIEW.md` records editorial decisions and `review-report.json` records checks. All 24 poem lines, nine vocabulary pairs, four note pairs, 11 exercise/activity groups, the printed rhyming example and closing competency are represented. No new canonical YAML has been published by this expansion pass yet.

**Publication gate:** the official 2026–27 PDF says “NOT TO BE REPUBLISHED”; its contents QR `T2V1D9` resolves to DIKSHA book `do_31400957587983564814081`, titled `4 Kannada FL_2024-25_Part 1`, with CC BY 4.0, Class 4, Kannada medium, and I Language Kannada. The metadata bundle also lists Chapter 1 (`B3S4J1`) under CC BY 4.0, but does not supply a matching PDF artifact establishing the 2026–27 rights. Preserve these separate assertions; do not overwrite the license field by copying Grade 3. Resolve permission/licensing for this edition or obtain a verifiably licensed matching source before publication. Evidence and reproducible public lookup details are in [the provenance record](provenance/g04-fl-p1.json).

The September 13 resumption rechecked the chapter identifier/QR and searched DIKSHA by title and for first-language Grade 4 PDFs. Related videos, interactive exercises and other PDFs were found, but no verifiably matching licensed PDF for this chapter was established. After an interrupted command was rerun, the broader all-subject query returned all 295 unique metadata records across offsets 0, 100 and 200 (100, 100 and 95 records). The remaining pages added no matching Kannada chapter candidate: their Kannada-subject entries were the already identified Odu Karnataka resources. This completes pagination for that query, not an exhaustive search of all possible catalog classifications or inspection of every PDF's contents. Reproducible queries/results are recorded in the provenance record rather than treating related material as permission for this edition.

**Next action:** obtain permission covering this edition or a verifiably licensed matching source, then resume from the reviewed YAML, not `unicode-draft.txt`. If the source changes, compare every page and recheck metadata before publication. The five YAML drafts deliberately omit `meta.license`: the unchanged schemas reject each with that missing required field. No placeholder or copied license is used. ID joins, label coverage, stanza/blank counts, encoding and all other schema constraints were checked; this does not constitute successful full content validation. README/API generation for this chapter remains pending. Do not publish the local archive or mark Chapter 1 complete until this gate is resolved.

### Restore reviewed work before repeating extraction

The ignored archive `.conversion-local/g04-fl-p1-ch01-reviewed-draft.zip` contains five YAML drafts, `REVIEW.md` and `review-report.json`, without PDFs/images. Its SHA-256 is `3113ae43671d1fade3abb0cd8b935302f3dc908dcee8fd3f28bff761d1947512`; per-file hashes and page coverage are in [the draft checkpoint](provenance/g04-fl-p1-ch01-draft.json). Check the hash before extraction and stop on any mismatch. `unzip -n` preserves existing files; compare their hashes rather than assuming an existing edited draft matches the archive.

```sh
shasum -a 256 .conversion-local/g04-fl-p1-ch01-reviewed-draft.zip
unzip -n .conversion-local/g04-fl-p1-ch01-reviewed-draft.zip -d /tmp/akshar-kannada-2026-27/g04-fl-p1-ch01/reviewed-draft
```

Keep extracted drafts outside the repository: content tools recursively discover `source.*.yaml`, even in ignored directories. The ZIP is a same-machine checkpoint only, not remote storage or a backup against losing the clone. If it is absent, use the PDF preparation steps below and redo the missing editorial work; public metadata/hashes cannot reconstruct unpublished text. Never commit the archive while the publication hold remains.

### Recreate temporary work after a reset

Install optional PDF tooling in the development virtual environment using `python3 -m pip install -r scripts/requirements-conversion.txt`. The external GPL-licensed font converter remains outside the repository; its pinned source and checksum are recorded in the provenance file, not vendored into Akshar's MIT code.

```sh
python3 scripts/fetch_kannada.py --download g04-fl-p1
curl -fsSL https://raw.githubusercontent.com/aravindavk/ascii2unicode/6d53b9bae48c089bb9e5776b01c55b505005841f/knconverter -o /tmp/akshar-kannada-2026-27/knconverter
shasum -a 256 /tmp/akshar-kannada-2026-27/knconverter
python3 scripts/prepare_kannada_chapter.py g04-fl-p1 --chapter 1 --first-page 15 --last-page 19 --converter /tmp/akshar-kannada-2026-27/knconverter
```

Before running the converter, compare its SHA-256 to `94bb8421e0e3179ff2a51e11880dca4baace8f28aecb06914b6dc0d661834a7d`; stop if it differs. The preparation script verifies the PDF hash and writes only temporary drafts. To regenerate the inventory after a deliberate catalog review, save the official portal HTML with `curl` and use `scripts/fetch_kannada.py --catalog-html <saved-file>`; normal resumption needs no rediscovery. Existing records/checksums are retained, and a changed URL/hash requires review rather than silently replacing the source.

### Grade 4 Part 1 chapter queue

The contents page was visually inspected. All ranges are inclusive; Chapters 1–4 are in Git-only delivery; Chapters 5–8 are not yet extracted or converted.

| Chapter | Printed title | Printed pages | PDF pages | State |
|---|---|---|---|---|
| 1 | ಕನ್ನಡಮ್ಮನ ಹರಕೆ | 1–5 | 15–19 | Five YAML files stored in Git-only delivery; full schema checks pass; production API hold remains |
| 2 | ಬುದ್ಧಿವಂತ ರಾಮಕೃಷ್ಣ | 6–12 | 20–26 | Five YAML files stored in Git-only delivery; full schema checks pass; production API and renderer holds remain |
| 3 | ವೀರಮಾತೆ ಜೀಜಾಬಾಯಿ | 13–21 | 27–35 | Five YAML files stored in Git-only delivery; full schema checks pass; production API hold remains |
| 4 | ಮಳೆ | 22–28 | 36–42 | Five YAML files stored in Git-only delivery; full schema checks pass; production API hold remains |
| 5 | ಅಜ್ಜಿಯ ತೋಟದಲ್ಲಿ ಒಂದು ದಿನ | 29–38 | 43–52 | Pending |
| 6 | ದೊಡ್ಡವರು ಯಾರು? | 39–45 | 53–59 | Pending |
| 7 | ಬೀಸೋಕಲ್ಲಿನ ಪದ | 46–51 | 60–65 | Pending |
| 8 | ತಾಯಿಗೊಂದು ಪತ್ರ | 52–58 | 66–72 | Pending; confirm end matter during page review |

## Related work in this session

- [x] Remove manual prose wrapping from 15 authored Markdown files; parsed Markdown structure/content checked, code blocks/tables/intentional hard breaks preserved, generated chapter READMEs untouched.
- [x] Document individual audio objects versus chapter audio sprites and storage/IaC recommendation in `docs/media-delivery.md`, with the Azure credit-program restriction explicit. No infrastructure provisioned.
- [x] Add a bounded, optional startup media-origin probe and foreground retry; no configured origin or player produces a fake enabled speaker control. Local audio cache/playback wiring remains a later implementation step.
- [x] Keep repository/global and mobile roadmaps separate with cross-links; add word-selection/curated-root glosses and future phrase-meaning work, below the school-demo content priority.

## Validation checkpoint

- Git-only delivery: all ten current Grade 4 YAML files pass full existing schemas and structural checks; each matches its archived draft after excluding the newly added truthful `meta.license`. Required validation, README generation, API generation and `scripts/check.py` pass. All 17 production API files are byte-for-byte identical to the pre-upload snapshot; existing Grade 3 YAML/READMEs are unchanged.
- Production-exclusion checks reject missing/malformed configuration, removed or duplicate holds, traversal paths, an existing held production payload and a missing held contributor license. Isolated mutation checks confirm held YAML still fails for orphan IDs and invalid segment types, and a manifest exposing held content fails API freshness checks. These checks do not establish renderer readiness or rights; both remain pending for production release.
- Resumption checks pass for the published corpus via `python3 scripts/check.py` and for patch whitespace via `git diff --check`. The local archive's seven members were restored into a fresh temporary directory and checked against every recorded SHA-256; the source PDF hash also matches. Existing `KSEEB/`, `api/`, schemas, scripts and app files are unchanged by this resumption. The draft's five missing-license errors remain explicit publication blockers, not waived checks.
- Content validation and generated README/API freshness pass via `python3 scripts/check.py`. The expansion pass did not alter existing chapters; the subsequent [catalog correction](catalog-unification.md) moves Chapters 1, 2, and 4, adds title labels, and regenerates compatible API views without changing any existing segments.
- Download resumption verified all nine existing PDFs without network requests. Grade 4 preparation was rerun successfully from the pinned converter; the reviewed Chapter 1 drafts are still not publication-ready. The later resumption checks 83 unique source IDs, 332 exact contributor joins, 17 labels in each file, six four-line stanzas and 18 answer blanks; all five full-schema checks correctly report the missing license. Existing published content remains separate from these drafts.
- Focused media-probe checks passed for missing/invalid configuration, healthy/invalid responses, offline errors, fetch/body timeouts, abort, concurrent-request reuse, and recovery. Device-level splash/playback testing has not been performed.
- The initial expansion checkpoint reported nine pre-existing route-type/Sentry errors. After dependency installation and iOS setup in the follow-up work, the full mobile TypeScript check passes in the current workspace. The iOS app builds and opens in the simulator after the targeted `expo-file-system` source-build workaround; this does not establish audio playback acceptance.
- Pre-commit verification also passes focused catalog compatibility/title-rendering, developer-reset confirmation/failure handling, and media-probe checks. Developer reset is tested with mocked storage; the user's simulator data was not cleared.
