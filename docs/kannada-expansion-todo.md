# Kannada expansion: resumable work queue

Status: started September 13, 2026. This file is the handoff checkpoint; update it after each completed step/chapter. Prioritize school-demo content over word-selection/AI features. No new chapter is complete until its source, exercises, four contributor maps, generated README/API, and checks are complete.

## Resume here

1. Read `AGENTS.md`, `CONTRIBUTING.md`, this file, and `docs/kannada-pdf-inventory.json`; inspect `git status` before editing. Existing Grade 3 chapters and their Grade 5 adoption remain protected.
2. PDFs live outside Git in `/tmp/akshar-kannada-2026-27/`. If absent, rerun `python3 scripts/fetch_kannada.py --download <book-id>`; the inventory preserves official URLs/checksums and the downloader refuses changed bytes. Temporary files are disposable, not durable checkpoints.
3. Work on one chapter at a time, starting with Grade 4 first-language Part 1. Verify its printed grade/role, school-medium evidence, chapter boundaries, DIKSHA license, and edition provenance before publishing. Public downloads alone do not grant redistribution rights.
4. Preserve chapter/segment identities and contributor joins. Never guess inflected-word roots, image content, speakers, or unsupported answers. Minor OCR repairs use conservative editorial judgment; new schema types still require a separate proposal.
5. After each chapter: validate, generate only its README, compile API, run `python3 scripts/check.py`, and update this file with exact paths/page ranges and outstanding work. Do not call an extraction draft a completed chapter.

## Scope and ordering

The official 2026–27 catalog has separate first-/second-language publications. Their printed grade does not determine all adoption contexts; do not merge different PDFs simply because a school uses another grade's book. Start with the first-language Part 1 PDFs for other grades; second-language books and Part 2 remain separately identified in the inventory. Nalikali primers and Kannada-medium maths/EVS are not silently included as Kannada language books.

- [x] Discover/catalog 39 official first-/second-language Kannada PDFs for Grades 1–10; exact links are saved in `docs/kannada-pdf-inventory.json`.
- [x] Download and checksum first-language Part 1 for Grades 1, 2, 4, 5, 6, 7, 8, 9, and 10; verified files are in `/tmp/akshar-kannada-2026-27/`.
- [x] Grade 4 first-language Part 1: inspect front matter, rights evidence, contents, and first-chapter boundaries; split/extract PDF pages 15–19 into temporary working files. Publication rights remain unresolved; see the checkpoint below.
- [ ] Grade 4 first chapter: complete the full source/contributor/README/API pipeline, subject to verified rights and compatible metadata.
- [ ] Continue remaining Grade 4 chapters sequentially, recording chapter-specific checkpoints before proceeding.
- [ ] Grade 5 first-language Part 1, then Grades 1/2 and 6–10: identify chapters and convert sequentially; do not confuse this separate Grade 5 publication with Grade 5 students using the Grade 3 book.
- [ ] Download/convert Part 2 and second-language publications in a later explicit priority pass.

## Current chapter checkpoint

**Grade 4 Chapter 1: ಕನ್ನಡಮ್ಮನ ಹರಕೆ, by ಕುವೆಂಪು.** PDF pages 15–19 inclusive, printed pages 1–5. The source has 72 PDF pages with 14 front-matter pages. Temporary split PDF, page renders, raw extraction, and Unicode draft are in `/tmp/akshar-kannada-2026-27/g04-fl-p1-ch01/`. The draft includes questions, vocabulary, notes, solved language examples, and activities; it is not editorially reviewed or canonical YAML. No new canonical YAML has been published by this expansion pass yet.

**Publication gate:** the official 2026–27 PDF says “NOT TO BE REPUBLISHED”; its contents QR `T2V1D9` resolves to DIKSHA book `do_31400957587983564814081`, titled `4 Kannada FL_2024-25_Part 1`, with CC BY 4.0, Class 4, Kannada medium, and I Language Kannada. The metadata bundle also lists Chapter 1 (`B3S4J1`) under CC BY 4.0, but does not supply a matching PDF artifact establishing the 2026–27 rights. Preserve these separate assertions; do not overwrite the license field by copying Grade 3. Resolve permission/licensing for this edition or obtain a verifiably licensed matching source before publication. Evidence and reproducible public lookup details are in [the provenance record](provenance/g04-fl-p1.json).

Next action: resolve that edition-rights gate, then visually review the five rendered pages against `unicode-draft.txt`, segment all printed content and exercises, and add the four contributor maps. The draft still has recognizable font-conversion artifacts (for example `ಪೆÇೀಷಿಸು` and `ಅಬಿsವೃದ್ಧಿ`), so it must not be copied blindly into source YAML. Use conservative corrections supported by the page image. Do not skip exercises or manufacture answers to make coverage appear complete.

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
| 1 | ಕನ್ನಡಮ್ಮನ ಹರಕೆ | 1–5 | 15–19 | Split/extracted; rights gate and editorial review pending |
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

- Content validation and generated README/API freshness pass via `python3 scripts/check.py`. The expansion pass did not alter existing chapters; the subsequent [catalog correction](catalog-unification.md) moves Chapters 1, 2, and 4, adds title labels, and regenerates compatible API views without changing any existing segments.
- Download resumption verified all nine existing PDFs without network requests. Grade 4 preparation was rerun successfully from the pinned converter; the draft is still not publication-ready.
- Focused media-probe checks passed for missing/invalid configuration, healthy/invalid responses, offline errors, fetch/body timeouts, abort, concurrent-request reuse, and recovery. Device-level splash/playback testing has not been performed.
- The initial expansion checkpoint reported nine pre-existing route-type/Sentry errors. After dependency installation and iOS setup in the follow-up work, the full mobile TypeScript check passes in the current workspace. The iOS app builds and opens in the simulator after the targeted `expo-file-system` source-build workaround; this does not establish audio playback acceptance.
- Pre-commit verification also passes focused catalog compatibility/title-rendering, developer-reset confirmation/failure handling, and media-probe checks. Developer reset is tested with mocked storage; the user's simulator data was not cleared.
