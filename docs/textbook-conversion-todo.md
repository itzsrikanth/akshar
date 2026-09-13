# Kannada Part 1 conversion TODO

Source: `3rd_KANNADA_FL_Part_1_2026-27.pdf` (72 PDF pages; 13 front-matter pages). Process only chapters 3, 5, 6, 7, and 8. Existing chapters 1, 2, and 4, including their generated READMEs, must remain untouched. No schema changes are authorized.

**Current handoff:** this Grade 3 Part 1 conversion is complete. Continue other-grade work from [Kannada expansion TODO](kannada-expansion-todo.md), currently Grade 4 Chapter 1, not from this completed queue. The later [bounded catalog correction](catalog-unification.md) has already unified all eight chapter sources under Kannada/Grade3 and implemented compatible API views/client normalization; the earlier split folders are no longer the current state. Grade 5 second-language use and legacy URLs remain supported. The full [publication/edition design](publication-model.md) is still pending. The remaining notes below describe the original conversion checkpoint, not permission to overwrite completed chapters or redo the migration.

## Verified source metadata

The contents-page QR code is `X6D4P9`. On September 13, 2026, DIKSHA's public catalog returned textbook `do_31400957252558848017436`, titled `3 Kannada FL_2024-25_Part 1`, with `gradeLevel: Class 3`, `medium: Kannada`, and `license: CC BY 4.0`. The supplied PDF cover also says Grade 3. Its filename indicates 2026–27, whereas the QR-linked catalog entry names the 2024–25 edition; the supplied PDF remains the transcription source. Existing repository chapters use English/Grade5 metadata and were left untouched. New chapters were placed under `KSEEB/Karnataka/Kannada/Grade3/Kannada/` during conversion; this historical choice is not the final organization or a restriction on Grade 5 second-language use.

## Preparation

- [x] Read AGENTS.md, CONTRIBUTING.md, and README.md.
- [x] Identify remaining chapters from the PDF contents page.
- [x] Verify textbook license and grade/medium through its DIKSHA QR code.
- [x] Split remaining chapters into individual PDFs in temporary working storage (`/tmp/akshar-conversion/ch03.pdf`, `ch05.pdf`, `ch06.pdf`, `ch07.pdf`, `ch08.pdf`).
- [x] Compare extraction methods: both pdftotext and Microsoft MarkItDown retain legacy Nudi encoding; neither directly produces usable Kannada Unicode. A temporary legacy-font converter produces readable draft Unicode, with corrections still required (for example, `ಸಾಮಥ್ರ್ಯ` and `ಸಾಂಸ್ಕøತಿಕ`).
- [x] Visually review every remaining chapter page, including handwritten articles, exercise tables, poem line breaks, and image-only prompts; correct extraction artifacts in the published YAML. Temporary raw Unicode drafts remain uncorrected working files.
- [x] Ensure README generation can target only newly added chapters (`--chapter`).

## Chapters

Each chapter requires a faithful Kannada source, all printed exercises and solved examples, English and Hindi translations, Latin and Devanagari transliterations, successful validation, and a generated README. Do not mark a chapter complete on schema validity alone.

- [x] Chapter 3 — ಸ್ವಾತಂತ್ರ್ಯ ದಿನಾಚರಣೆ — printed pages 15–24; PDF pages 28–37. Added 123 source segments with all four contributor maps; validation passed and its README was generated independently.
- [x] Chapter 5 — ಚಿಗುರು — printed pages 29–37; PDF pages 42–50. Added 125 source segments, including the handwritten magazine articles, worked multiplication example and all exercises; all contributor maps validate and its README was generated independently.
- [x] Chapter 6 — ಈಸೂರ ಸ್ವಗತ — printed pages 38–47; PDF pages 51–60. Added 144 source segments and all four contributor maps; validation passed and its README was generated independently.
- [x] Chapter 7 — ಪ್ರಾಮಾಣಿಕ ಬಾಲಕ — printed pages 48–54; PDF pages 61–67. Added 79 source segments and all four contributor maps; validation passed and its README was generated independently.
- [x] Chapter 8 — ಸಂಕ್ರಾಂತಿ — printed pages 55–59; PDF pages 68–72. Added 69 source segments, including all 24 poem lines across six stanzas, and all four contributor maps; validation passed and its README was generated independently.

## Final checks

- [x] Confirm all five source/contributor files exist and cover every source segment in each new chapter: 540 source segments, 2,160 matching contributor entries, and matching label keys across every map.
- [x] Confirm each chapter passed `python3 scripts/validate.py` before its README was generated with `python3 scripts/generate_readme.py --chapter <chapter-directory>`; the final repository-wide `--check` passes.
- [x] Verify all 18 existing files in chapters 1, 2, and 4 are byte-for-byte unchanged against the preparation-time SHA-256 snapshot.
- [x] Review final changes without altering pre-existing user work or committing files. Test the chapter selector with each new chapter and verify that missing, non-chapter, and outside-repository paths are rejected.

## Editorial decisions

Only explicitly printed worked examples are supplied as answers. Open-ended, personal-experience, dictionary, and image questions remain unanswered. Deliberately misspelt Kannada words in Chapter 5's correction exercise are preserved rather than mistaken for extraction errors. The printed school magazine date and the textbook's historical wording are retained. Handwritten spacing is normalized for readable Unicode; this is not a facsimile of the handwriting styles, which readers can still examine on printed pages 30–31 (PDF pages 43–44).

All image-dependent exercises include the approved editorial source-page locators rather than invented images or answers. The five split chapter PDFs and extraction working files are available in `/tmp/akshar-conversion/`; only the structured content and generated chapter READMEs are added to the dataset. No schema changes were made, and `api/` was not hand-edited or rebuilt in this conversion.

## Subsequent CI repair

- [x] Reproduce the September 13 failed workflow's stale/missing API check, regenerate all eight chapter JSON entries with the existing compiler, and preserve existing chapter payloads/URLs.
- [x] Add `scripts/check.py` as the shared local/CI entrypoint and an opt-in committed-snapshot pre-push hook.
- [ ] Implement the separately reviewed publication/adoption schema and compatible client migration; the artifact repair does not complete this work.

## Approved interim image references

Chapter 3, printed page 22 (PDF page 35; split chapter page 8), contains the exercise `ಚಿತ್ರ ನೋಡಿ ಸಲಹೆ ನೀಡು.` (Look at the picture and give advice.) On September 13, 2026, the user approved an interim text-based reference instead of a schema change. Keep this as an existing `question` segment, preserve the printed instruction, and append a clearly marked editorial reference in `text`. Do not use `ref` for a page number: it is reserved for links to source segment IDs.

Reference: `3rd_KANNADA_FL_Part_1_2026-27.pdf`, Chapter 3, printed page 22, PDF page 35 (1-based), competency-based exercises, subsection ಇ, illustration immediately below `ಚಿತ್ರ ನೋಡಿ ಸಲಹೆ ನೀಡು.` The illustration shows children in water. Do not infer an answer from the reference. A reader still needs the original PDF to see the picture; this is a locator, not a substitute image.

Long-term `image_question` support is tracked in `docs/roadmap.md`; it remains unimplemented and requires explicit approval before schema changes. This temporary approach removes the image-schema blocker. README generation now supports `--chapter` so each new chapter can be generated without touching chapters 1, 2, or 4.
