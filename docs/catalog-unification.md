# Kannada chapter catalog correction

Implementation checkpoint: September 13, 2026. Source/API checks and local client checks pass; app distribution and live CDN rollout must be verified separately from committing this change.

## Scope and TODO

- [x] Move Chapters 1, 2, and 4 into `KSEEB/Karnataka/Kannada/Grade3/Kannada/`, alongside Chapters 3 and 5–8; correct only their medium/grade metadata.
- [x] Preserve every source segment, ID, question, answer, translation, transliteration, license, and attribution; add chapter title headings through existing `labels.title` maps.
- [x] Generate complete v1 compatibility views and teach the app to display the book once, including from old offline catalog caches.
- [x] Replace Explore's language/script pills with the selected title transliteration and translation. Omit missing title mappings without inventing text or downloading every chapter body.
- [x] Verify legacy payloads, both catalog views, idempotent cached-catalog normalization, saved-scope/history compatibility, all four title preference combinations, generated outputs, TypeScript, and the iOS Metro bundle.
- [ ] Manually inspect the final Explore chapter rows in the simulator. Home shows eight available chapters with retained history; automated navigation is blocked by the simulator's Open-in-Akshar prompt and macOS denying scripted keystrokes.

## Identity and compatibility contract

`catalog-compatibility.json` is a finite list of eight exact canonical/legacy path pairs, not a generic grade remapping or an adoption schema. `scripts/build_json.py` checks each canonical source and rejects duplicate paths, collisions, and scope/slug mismatches before writing output. Never match a different book by chapter slug alone.

There are eight source chapter folders, all under Kannada/Grade3. `api/contents.json` remains schema 1.0 and contains two complete eight-chapter views: canonical Kannada/Grade3 and historical English/Grade5. Existing clients can still filter by either saved scope and get the complete book. Legacy JSON payloads retain historical medium/grade metadata and the same segment structure; canonical payloads carry corrected metadata. Compatibility is generated from canonical YAML, never edited by hand. Do not delete the old routes without an explicit support/retention decision.

The updated app normalizes both fresh and persisted catalogs, recognizing only the enumerated full paths, and presents eight Kannada/Grade3 chapters. `clientPath` retains the originally shipped fetch/history identity for each chapter (legacy URLs for Chapters 1, 2, and 4); it is not a source-directory classification. Hashes remain attached to the actual payload URL selected. History comparisons recognize either path, without rewriting stored history. Download files and segment IDs are unchanged; existing offline files are not deleted or replaced during normalization. Repeating normalization is idempotent and does not create or change a saved learner grade.

The chapter hook also projects the corrected classification into Reader/Exercises for both remote and previously downloaded payloads, checking the mapped full path and existing metadata. This is an in-memory display correction; historical API payloads and saved offline files retain their compatible representation. Unrelated books are not remapped.

An existing English/Grade5 saved scope still resolves to these eight chapters for reading preferences. New Explore discovery shows only the corrected source classification. This compatibility rule does not assert universal English-medium applicability or implement general Grade 5 adoption discovery; the full publication/adoption model remains deferred. Similarly, slug-based download storage is unchanged and must be upgraded before introducing colliding chapter slugs across different books.

## Titles and API additions

`labels.title` in a source equals `meta.title`; contributor title labels reuse that exact heading key. The compiler adds optional `titleTranslations` and `titleTransliterations` dictionaries to catalog entries. Existing `translations` and `transliterations` availability arrays remain unchanged for old clients. No segment type, segment field, or YAML schema is added. Missing title labels are valid and render only the available text. Titles follow saved reading preferences, with the existing catalog-derived defaults when no preference is saved.

## Deployment and recovery

Ship the client compatibility bridge before publishing the expanded v1 manifest. Publish every generated chapter payload (canonical and historical views) before the catalog that references it. The old eight-entry manifest and all its existing URLs remain usable during a staged rollout; new clients also normalize that old catalog. A failed network refresh retains the old catalog, and existing downloaded chapter files remain readable. Stale cached titles simply remain absent until a successful catalog refresh. No clearing app data, reinstall, or automatic download replacement is required.

Keep the previous manifest/payload artifacts for rollback. Before deployment run `python3 scripts/validate.py`, `python3 scripts/generate_readme.py`, `python3 scripts/build_json.py`, and `python3 scripts/check.py`. This change does not implement v2, conditional HTTP revalidation, atomic download refresh, generic multi-edition adoption records, or a content-license re-audit.
