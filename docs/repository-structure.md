← [Back to README](../README.md)

## Repository structure

**Current legacy layout, not the long-term identity model.** The validator, generated v1 API paths, and installed clients currently depend on the structure below. The [publication/edition design and migration plan](publication-model.md) replaces fixed board/state/medium/grade/subject identity with stable books and editions plus metadata-driven browsing. No source move is safe until the compatibility bridge is implemented.

```
/{board}/{state}/{medium}/{grade}/{subject}/{chapter}/
```

| Segment | Examples | Notes |
|---|---|---|
| `board` | `CBSE`, `KSEEB`, `UPMSP` | Issuing board |
| `state` | `Karnataka`, `UttarPradesh`, `national` | `national` for CBSE / ICSE |
| `medium` | `English`, `Kannada`, `Hindi` | Language of instruction at the school |
| `grade` | `Grade5`, `Grade6` | |
| `subject` | `Kannada`, `Hindi`, `Science` | |
| `chapter` | `ch01-bannada-tagadina` | kebab-case slug |

**Do not conflate medium with language role:** school teaching medium, textbook source language, and first/second/third-language subject role are separate attributes. Verify them from the source rather than assuming one from another. A book can be used in several contexts without duplicating its chapter files.

**Region is applicability, not publication identity:** books used in different states may be the same publication or different ones. Identify the actual publisher/book/edition first; the proposed model permits multiple sourced regional/curriculum associations without requiring a state-specific duplicate.

Inside each chapter folder:

```
ch01-bannada-tagadina/
├── source.kn.yaml              ← canonical source text with segment IDs
├── transliteration/
│   ├── devanagari.yaml         ← flat id → text map
│   ├── latin.yaml
│   └── tamil.yaml
├── translation/
│   ├── en.yaml
│   └── hi.yaml
└── README.md                   ← auto-generated, do not edit manually
```

**Top-level layout, with app development in mind:** content (`{board}/...`), `schema/`, and `scripts/` stay at the repo root exactly as above — no coding knowledge is needed to reach or edit them. `api/` holds JSON compiled from the YAML by `scripts/build_json.py` (never hand-edit it — see below). `apps/` and `packages/` are reserved for app code (e.g. a future React Native app) as it's added.

### Machine-readable API (`api/`)

`scripts/build_json.py` compiles every chapter's source + transliteration + translation + labels into one denormalized JSON file, plus a top-level manifest:

```
api/
├── contents.json                                              ← every chapter's meta + available scripts/languages + a content hash
└── KSEEB/Karnataka/Kannada/Grade3/Kannada/
    ├── ch01-bannada-tagadina.json
    └── ch02-nanna-kanasu.json
```

This is generated and committed (like the chapter READMEs), and checked in CI with `build_json.py --check`. It's deliberately flat and doesn't group by section/stanza/exercise — segments carry that as metadata (`section`, `stanza`, `exercise`, `speaker`, `ref`) so any consumer can group them however its own UI needs, rather than inheriting one baked-in shape. Since content only changes via PR (no runtime writes), this can be served directly from the repo via a free CDN (e.g. jsDelivr) with no backend server required. The mobile app (`apps/mobile`) reads this `api/` folder through exactly that CDN in production; for local development there's also a trivial local server (`npm run content-server` at the repo root) so content edits show up instantly instead of waiting on the CDN's cache — see [`apps/mobile/docs/local-dev-content-server.md`](../apps/mobile/docs/local-dev-content-server.md).

The existing Kannada book also has generated historical English/Grade5 API views for supported clients. These are compatibility outputs from the same eight canonical source folders, not a second YAML book. The current app deduplicates the views and corrects display metadata through the [catalog compatibility bridge](catalog-unification.md). Optional title translation/transliteration dictionaries accompany catalog entries; older availability arrays remain supported.
