# Akshar

> Open, community-contributed phonetic guides and translations for Indian school textbook content — so every parent can help their child, regardless of which script they know.

---

## The problem

Across India, millions of children study a regional language as their second or third language. Their parents often speak the language but cannot read the script — a Hindi-speaking family in Karnataka, a Telugu family in Maharashtra, a Tamil family in Delhi.

When the child comes home with Kannada homework, the parent is stuck. They can understand Kannada when spoken but cannot read ಕನ್ನಡ script, cannot decode the questions, cannot check the answers.

Akshar solves that: for every line of every textbook lesson, provide the original text alongside a pronunciation guide in a script the parent already knows (Devanagari, Latin, Tamil, Telugu…) and a translation for meaning.

---

## What already exists — and why it is not enough

Before building, a landscape scan was done to check for existing solutions. Nothing with this specific combination exists. Here is what does exist and why it does not cover this gap:

| Project | What it is | Why it does not cover this gap |
|---|---|---|
| **AI4Bharat IndicXlit** | Transformer model for Roman↔21 Indic script transliteration, 26M word pairs | A tool/engine, not a content repository. No textbook content, no curriculum structure. |
| **indic-transliteration** (Vishvas Vasuki) | Python library, cross-script Indic transliteration | A library, not content. |
| **AI4Bharat Indic-TTS** | Text-to-speech for Indian languages | Complementary (audio pronunciation) but no curriculum content layer. |
| **DIKSHA** (diksha.gov.in) | Government platform delivering NCERT and state board textbooks | Has licensed source content but as PDFs only. No structured text extraction, no transliteration, no parent-facing pronunciation guide. A delivery platform, not a data layer. |
| **Bhashini / ULCA** (bhashini.gov.in) | Government AI platform, 10M transliteration pairs, open API | Infrastructure only. No curriculum content. |
| **Bharatiya Bhasha Pustak Pariyojana (BBPP)** | Initiative to produce textbooks in 22 Indian languages via AI translation | Different problem: translating the medium of instruction. Not helping parents who cannot read the regional script. |
| **StoryWeaver / Pratham Books** (storyweaver.org.in) | 53K+ storybooks in 330 languages, CC-licensed, community contributions | Supplementary reading only. Not curriculum-organised by board/grade/subject. No transliteration for pronunciation. |
| **State textbook apps on Play Store** | PDF viewers for existing textbooks | Closed, PDF-only, no structured text, not open source. |

The ecosystem has the tools but no one has built the structured, human-verified, community-contributed content data layer on top. That is what Akshar is.

---

## Content source and license

Source textbooks are published by government bodies (NCERT, KSEEB, UPMSP, etc.) on [DIKSHA](https://diksha.gov.in) under **Creative Commons Attribution 4.0 (CC BY 4.0)**.

CC BY 4.0 permits copying, redistribution, adaptation (translations and transliterations are adaptations), and commercial use. Attribution to the original publisher is required in each file's `meta` block.

> Note: some state board content uses CC BY-SA 4.0. The ShareAlike clause requires this repository and any derived app to also be open-licensed. Check the specific license on the DIKSHA page before adding content from a new board.

Transliterations and translations contributed here are original creative works by contributors, released under CC BY 4.0.

This repo uses two licenses: [`LICENSE`](LICENSE) (CC BY 4.0) covers all textbook content, transliterations, and translations; [`LICENSE-CODE`](LICENSE-CODE) (MIT) covers scripts and tooling (e.g. `scripts/`, CI workflows).

---

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
repo via a free CDN (e.g. jsDelivr) with no backend server required.

---

## Data format

**Why not Markdown:** Markdown has no natural way to express segment IDs. Transliteration files map to individual source lines by key — without IDs, one inserted line silently misaligns all downstream files with no way to detect it.

**Why YAML over JSON:** YAML is structured (machine-parseable, every language has a parser) while remaining readable enough for non-developer contributors to edit directly in GitHub's web UI.

### Source file (`source.{lang}.yaml`)

```yaml
meta:
  board: KSEEB
  state: Karnataka
  medium: English
  grade: 5
  subject: Kannada
  chapter: 1
  slug: ch01-example
  title: Chapter title in source language
  source_url: https://diksha.gov.in/...
  license: CC BY 4.0
  original_publisher: KSEEB

segments:
  - id: s1l1
    type: poem_line
    stanza: 1
    text: ಬಣ್ಣದ ತಗಡಿನ ತುತ್ತೂರಿ
  - id: q1
    type: question
    text: ಕಸ್ತೂರಿಯು ಏನನ್ನು ಕೊಂಡನು?
  - id: q1-ans
    type: answer
    ref: q1
    text: ಕಸ್ತೂರಿಯು ಬಣ್ಣದ ತಗಡಿನ ತುತ್ತೂರಿಯನ್ನು ಕೊಂಡನು.
```

Valid `type` values: `competency`, `prose`, `dialogue`, `poem_line`, `question`, `answer`, `fill_blank`, `vocabulary_term`, `vocabulary_definition`, `note_term`, `note_definition`. `dialogue` takes an optional `speaker` field.

### Contributor files

Each is a flat `id: text` map. One rule: copy the ID from the source file, write the target text next to it.

```yaml
# transliteration/devanagari.yaml
meta:
  source: source.kn.yaml
  script: devanagari
  contributor: github-username
  license: CC BY 4.0

s1l1: बण्णद तगडिन तुत्तूरि
q1: कस्तूरियु एननु कोण्डनु?
```

Use **ISO 639-1 codes** for translation files (`en.yaml`, `hi.yaml`, `te.yaml`). Use script names for transliteration files (`devanagari.yaml`, `latin.yaml`, `tamil.yaml`).

---

## Contributing

**To add a new chapter:**
1. Create the folder path: `{board}/{state}/{medium}/{grade}/{subject}/{chapter}/`
2. Add `source.{lang}.yaml` with original text, segment IDs, and source attribution
3. Add at least one transliteration or translation file
4. Open a PR — CI validates schema and flags missing required fields

**To add a transliteration or translation for an existing chapter:**
1. Open the chapter folder, read `source.{lang}.yaml` for the segment IDs
2. Create `transliteration/{script}.yaml` or `translation/{lang}.yaml` as a flat `id: text` map
3. Open a PR

No coding required. GitHub's web UI is sufficient for either workflow.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## Automating the first pass

Transliteration is not one problem — it's two, and they need different tools:

- **Brahmic script → Brahmic script** (e.g. Kannada → Devanagari): these scripts share a near 1:1 structural correspondence (vowels, consonants, matras, virama), so the right tool is a deterministic rule-based mapper — [`indic_transliteration`](https://pypi.org/project/indic-transliteration/)'s `sanscript` module — not a statistical model. Going through Roman as an intermediate step (as an ML Roman↔Indic model would require) throws away that structure and loses precision.
- **Brahmic script → Latin/Roman** (for parents who only read the English alphabet): here Roman *is* the destination, not a waypoint, so [AI4Bharat IndicXlit](https://github.com/AI4Bharat/IndicXlit) (ML-based, natural colloquial spelling) is a good fit.

Both are planned as a **local script, not a CI gate** — output is always a draft for human review via PR, never auto-merged.

[Bhashini TTS API](https://bhashini.gov.in/ulca) provides audio pronunciation for the mobile app across most Indic languages.

---

## Roadmap

- [x] JSON schema + CI validation for source and contributor files (`schema/`, `scripts/validate.py`) — schema conformance, unique segment IDs, dangling `ref` detection, contributor-file orphan-ID detection, meta/path consistency, BOM/invisible-character checks
- [x] Auto-generate chapter `README.md` from YAML via CI (`scripts/generate_readme.py`, checked in CI with `--check`)
- [x] Compile YAML into a machine-readable JSON API + manifest (`api/`, `scripts/build_json.py`, checked in CI with `--check`)
- [ ] Local (non-CI) draft-transliteration script: `indic_transliteration`/`sanscript` for Brahmic→Brahmic, IndicXlit for Brahmic→Latin — always a human-reviewed draft
- [ ] Root-level content index (manually maintained for now; see "Current content" below)
- [ ] Community-recorded audio as a third contribution type, alongside transliteration/translation
- [ ] Cross-chapter vocabulary glossary per subject/grade
- [ ] Mobile app (Expo/React Native) consuming `api/` — lazy per-chapter download + local cache, manifest-driven update checks
- [ ] Bhashini TTS integration for audio pronunciation in app

---

## Current content

| Board | State | Medium | Grade | Subject | Chapters |
|---|---|---|---|---|---|
| KSEEB | Karnataka | English | 5 | Kannada | ch01-bannada-tagadina |
