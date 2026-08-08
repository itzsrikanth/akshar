← [Back to README](../README.md)

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

See also: [`schema/source.schema.json`](../schema/source.schema.json) and
[`schema/contributor.schema.json`](../schema/contributor.schema.json) — the JSON Schemas CI
validates every file against (`scripts/validate.py`).
