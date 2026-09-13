← [Back to README](../README.md)

## Current content

Repository audit: September 13, 2026. The following describes checked-in source/API files, not a live CDN or installed-app inventory.

| Current source classification | Chapters | Checked-in compiled API |
|---|---|---|
| `KSEEB/Karnataka/Kannada/Grade3/Kannada/` | 1–8 | One canonical source tree; generated v1 compatibility views retain old URLs |

Chapters 1, 2, and 4 previously had a different folder/metadata classification from the other five chapters of the same book. They now share the Kannada/Grade3 source classification. This corrects book organization, not learners' school grades: maintainer-reported Grade 5 second-language use remains valid, and saved Grade 5 preferences are retained.

All eight source chapters have English/Hindi translations and Latin/Devanagari transliterations, including chapter titles in `labels.title`. Explore displays the source title and the title in the reader's selected translation language and transliteration script rather than language-availability pills.

The [bounded catalog compatibility bridge](catalog-unification.md) makes the updated app show eight chapters under one Kannada/Grade3 listing, including when reading an old cached catalog. The v1 manifest deliberately retains two complete eight-chapter views for older clients; these are generated JSON, not duplicate source content. All previously published chapter URLs remain valid. This is not the full publisher/book/edition/adoption model on the [Roadmap](roadmap.md), and no metadata claim about a publisher or edition license has been changed. Run `python3 scripts/check.py` to check content, generated READMEs, and both compatibility projections.
