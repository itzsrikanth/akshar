# Kannada expansion: resumable work queue

Status: started September 13, 2026. This file is the handoff checkpoint; update it after each completed step/chapter. Prioritize school-demo content over word-selection/AI features. No new chapter is complete until its source, exercises, four contributor maps, generated README/API, and checks are complete.

## Resume here

1. Read `AGENTS.md`, `CONTRIBUTING.md`, this file, and `docs/kannada-pdf-inventory.json`; inspect `git status` before editing. Existing Grade 3 chapters and their Grade 5 adoption remain protected.
2. PDFs live outside Git in `/tmp/akshar-kannada-2026-27/`. If absent, rerun `python3 scripts/fetch_kannada.py --download <book-id>`; the inventory preserves official URLs/checksums and the downloader refuses changed bytes. Before repeating editorial work, check the ignored `.conversion-local/` ZIP checkpoint described below. It survives temporary-directory cleanup on this clone, but is not committed or available in a new clone.
3. Work on one chapter at a time, starting with Grade 4 first-language Part 1. Verify its printed grade/role, school-medium evidence, chapter boundaries, DIKSHA license, and edition provenance before publishing. Public downloads alone do not grant redistribution rights.
4. Preserve chapter/segment identities and contributor joins. Never guess inflected-word roots, image content, speakers, or unsupported answers. Minor OCR repairs use conservative editorial judgment; new schema types still require a separate proposal.
5. After each chapter: validate, generate only its README, compile API, run `python3 scripts/check.py`, and update this file with exact paths/page ranges and outstanding work. Do not call an extraction draft a completed chapter.
6. At the end of each conversion session, commit and push publishable changes and safe tracking/provenance updates, as requested by the maintainer on September 13, 2026. Preserve unresolved-rights drafts in the ignored local archive and state clearly that their text is not pushed. Follow `AGENTS.md` → Conversion-session checkpoints; do not substitute a metadata-only remote checkpoint for a claimed remote backup of the chapter text.

## Scope and ordering

The official 2026–27 catalog has separate first-/second-language publications. Their printed grade does not determine all adoption contexts; do not merge different PDFs simply because a school uses another grade's book. Start with the first-language Part 1 PDFs for other grades; second-language books and Part 2 remain separately identified in the inventory. Nalikali primers and Kannada-medium maths/EVS are not silently included as Kannada language books.

- [x] Discover/catalog 39 official first-/second-language Kannada PDFs for Grades 1–10; exact links are saved in `docs/kannada-pdf-inventory.json`.
- [x] Download and checksum first-language Part 1 for Grades 1, 2, 4, 5, 6, 7, 8, 9, and 10; verified files are in `/tmp/akshar-kannada-2026-27/`.
- [x] Grade 4 first-language Part 1: inspect front matter, rights evidence, contents, and first-chapter boundaries; split/extract PDF pages 15–19 into temporary working files. Publication rights remain unresolved; see the checkpoint below.
- [x] Resume Grade 4 Chapter 1: visually review all five pages and prepare local source, English/Hindi translations and Latin/Devanagari transliterations (83 segments, 332 contributor entries, 17 labels per file). Preserve all exercises and the printed example. Save a checksummed, Git-ignored local archive; this is editorial progress, not a published chapter.
- [ ] Grade 4 first chapter: complete the full source/contributor/README/API pipeline, subject to verified rights and compatible metadata.
- [ ] Continue remaining Grade 4 chapters sequentially, recording chapter-specific checkpoints before proceeding.
- [ ] Grade 5 first-language Part 1, then Grades 1/2 and 6–10: identify chapters and convert sequentially; do not confuse this separate Grade 5 publication with Grade 5 students using the Grade 3 book.
- [ ] Download/convert Part 2 and second-language publications in a later explicit priority pass.

## Current chapter checkpoint

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

The contents page was visually inspected. All ranges are inclusive; later chapters are not yet extracted or converted.

| Chapter | Printed title | Printed pages | PDF pages | State |
|---|---|---|---|---|
| 1 | ಕನ್ನಡಮ್ಮನ ಹರಕೆ | 1–5 | 15–19 | Five local YAML drafts reviewed; rights gate, final validation and publication pending |
| 2 | ಬುದ್ಧಿವಂತ ರಾಮಕೃಷ್ಣ | 6–12 | 20–26 | Pending |
| 3 | ವೀರಮಾತೆ ಜೀಜಾಬಾಯಿ | 13–21 | 27–35 | Pending |
| 4 | ಮಳೆ | 22–28 | 36–42 | Pending |
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

- Resumption checks pass for the published corpus via `python3 scripts/check.py` and for patch whitespace via `git diff --check`. The local archive's seven members were restored into a fresh temporary directory and checked against every recorded SHA-256; the source PDF hash also matches. Existing `KSEEB/`, `api/`, schemas, scripts and app files are unchanged by this resumption. The draft's five missing-license errors remain explicit publication blockers, not waived checks.
- Content validation and generated README/API freshness pass via `python3 scripts/check.py`. The expansion pass did not alter existing chapters; the subsequent [catalog correction](catalog-unification.md) moves Chapters 1, 2, and 4, adds title labels, and regenerates compatible API views without changing any existing segments.
- Download resumption verified all nine existing PDFs without network requests. Grade 4 preparation was rerun successfully from the pinned converter; the reviewed Chapter 1 drafts are still not publication-ready. The later resumption checks 83 unique source IDs, 332 exact contributor joins, 17 labels in each file, six four-line stanzas and 18 answer blanks; all five full-schema checks correctly report the missing license. Existing published content remains separate from these drafts.
- Focused media-probe checks passed for missing/invalid configuration, healthy/invalid responses, offline errors, fetch/body timeouts, abort, concurrent-request reuse, and recovery. Device-level splash/playback testing has not been performed.
- The initial expansion checkpoint reported nine pre-existing route-type/Sentry errors. After dependency installation and iOS setup in the follow-up work, the full mobile TypeScript check passes in the current workspace. The iOS app builds and opens in the simulator after the targeted `expo-file-system` source-build workaround; this does not establish audio playback acceptance.
- Pre-commit verification also passes focused catalog compatibility/title-rendering, developer-reset confirmation/failure handling, and media-probe checks. Developer reset is tested with mocked storage; the user's simulator data was not cleared.
