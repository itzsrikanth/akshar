← [Back to README](../README.md)

## Current content

Repository audit: September 13, 2026. The following describes checked-in source/API files, not a live CDN or installed-app inventory.

| Current source classification | Chapters | Checked-in compiled API |
|---|---|---|
| `KSEEB/Karnataka/English/Grade5/Kannada/` | 1, 2, 4 | Present in `api/contents.json` |
| `KSEEB/Karnataka/Kannada/Grade3/Kannada/` | 3, 5, 6, 7, 8 | Compiled JSON generated and included in `api/contents.json` |

**These rows do not represent two distinct books.** Their chapter titles match Karnataka Textbook Society's printed Grade 3 Kannada first-language Part 1 textbook. The maintainer confirms that the same PDF is also used by Grade 5 students for second-language Kannada: Grade 5 is a legitimate usage context, not an incorrect grade to migrate away from. The split chapter storage and `KSEEB` publisher metadata need reconciliation through the [publication identity and safe migration plan](publication-model.md), with both adoption contexts referencing one complete edition. Verify older chapter text against the supplied edition before assigning it to that edition. Do not rename folders or rebuild the catalog under a new incompatible identity without the client bridge and legacy compatibility tests.

All eight source chapters have English/Hindi translations and Latin/Devanagari transliterations. The September 13 CI failure was caused by five missing chapter JSON files and a stale manifest; regenerating with `scripts/build_json.py` fixes that publishing artifact gap without changing the v1 schema or the three existing chapter payloads. Content validation, README freshness, and compiled API freshness are checked together by `python3 scripts/check.py`. This does not implement shared-book discovery: the legacy catalog still splits chapters between its two classifications, and the client migration remains on the [Roadmap](roadmap.md).
