← [Back to README](../README.md)

## Repository structure

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

**Why medium is a separate level:** Kannada as a third language in an English-medium school uses a different, simpler textbook than Kannada as a second language in a Kannada-medium school. They are distinct curricula.

**Why state is kept for national boards:** Hindi taught in Uttar Pradesh and Madhya Pradesh may follow different state syllabi. The structure should not constrain what can be added.

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

**Top-level layout, with app development in mind:** content (`{board}/...`), `schema/`, and
`scripts/` stay at the repo root exactly as above — no coding knowledge is needed to reach or
edit them. `api/` holds JSON compiled from the YAML by `scripts/build_json.py` (never hand-edit
it — see below). `apps/` and `packages/` are reserved for app code (e.g. a future React Native
app) as it's added.

### Machine-readable API (`api/`)

`scripts/build_json.py` compiles every chapter's source + transliteration + translation +
labels into one denormalized JSON file, plus a top-level manifest:

```
api/
├── contents.json                                              ← every chapter's meta + available scripts/languages + a content hash
└── KSEEB/Karnataka/English/Grade5/Kannada/
    ├── ch01-bannada-tagadina.json
    └── ch02-nanna-kanasu.json
```

This is generated and committed (like the chapter READMEs), and checked in CI with
`build_json.py --check`. It's deliberately flat and doesn't group by section/stanza/exercise —
segments carry that as metadata (`section`, `stanza`, `exercise`, `speaker`, `ref`) so any
consumer can group them however its own UI needs, rather than inheriting one baked-in shape.
Since content only changes via PR (no runtime writes), this can be served directly from the
repo via a free CDN (e.g. jsDelivr) with no backend server required. The mobile app
(`apps/mobile`) reads this `api/` folder through exactly that CDN in production; for local
development there's also a trivial local server (`npm run content-server` at the repo root) so
content edits show up instantly instead of waiting on the CDN's cache — see
[`apps/mobile/docs/local-dev-content-server.md`](../apps/mobile/docs/local-dev-content-server.md).
