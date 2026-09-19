# Lexicon — word selection and meaning lookup

Design for the reader feature that lets a learner tap a word in source-language text and open a bottom sheet with form, root/lemma, and gloss. Complements printed chapter vocabulary (`vocabulary_term` / `vocabulary_definition`) without changing the line-level source stitching model.

Related: [mobile roadmap §6](../apps/mobile/docs/roadmap.md#6-word-selection-and-root-word-glosses), [repository roadmap](roadmap.md) (lemma/gloss data), [user feedback 2026-08-23](../apps/mobile/docs/user-feedback.md).

## Why not extend `source.*.yaml`

Chapter source remains an ordered list of segment objects. Translations and transliterations join by segment `id`. Putting per-word gloss maps inside those files would break the existing contract, inflate every chapter, and invite guessing roots from agglutination.

Lexical data lives under `content/lexicons/<lang>/` as a separate contribution type. The compiler emits `api/v2/lexicons/<lang>.json`. Chapter JSON stays unchanged.

## Layout

```text
content/lexicons/kn/
  meta.yaml              # language, license, provenance
  function-words.yaml    # connecting/function words
  lemmas.yaml            # headwords + glosses
  forms.yaml             # surface form → lemma id(s)
schema/lexicon-*.schema.json
api/v2/lexicons/kn.json  # compiled offline bundle
```

## Records

### `meta.yaml`

Required: `schemaVersion` (1), `language` (ISO code, e.g. `kn`), `license`, `provenance` (short description of how entries were reviewed).

### `function-words.yaml`

Curated surface forms that are connecting/function words (conjunctions, common particles, frequent pronouns/determiners as listed). Lookup result:

- Do **not** treat them as content words with a dictionary gloss.
- UI may omit Meaning for a selection that is only function words, or show a “Connecting word” chip with no root/gloss.

Never auto-infer this list from frequency. Extend only by review.

### `lemmas.yaml`

Each entry:

| Field | Required | Meaning |
|-------|----------|---------|
| `id` | yes | Stable id, e.g. `lemma-kaapaadu` |
| `lemma` | yes | Dictionary headword in the source script |
| `transliteration` | no | Latin (or other) transliteration of the lemma |
| `glosses` | no | Map of language code → reviewed gloss text; omit unknowns |
| `notes` | no | Optional learner-facing morphology note (reviewed only) |
| `sourceRefs` | no | Links to chapter vocab segments that seeded this lemma |

`sourceRefs` items: `bookId`, `editionId`, `chapterId`, `segmentId` (the `vocabulary_term` id).

### `forms.yaml`

Each entry:

| Field | Required | Meaning |
|-------|----------|---------|
| `form` | yes | Exact surface string as it may appear in running text |
| `lemmaIds` | yes | One or more lemma ids |
| `status` | yes | `exact` \| `reviewed-inflection` \| `ambiguous` |

Rules:

- Never invent a form→lemma by stripping suffixes.
- Unknown forms stay unknown; the app shows “Root/meaning not available”.
- Prefer `exact` when the form equals the printed vocabulary term.
- Use `ambiguous` when more than one reviewed lemma applies; the UI must label ambiguity rather than picking one silently.

## Seeding from printed vocabulary

Initial Kannada coverage is seeded from Grade 3 FL printed `vocabulary_term` / `vocabulary_definition` pairs (and their contributor translations/transliterations) via `scripts/seed_lexicon_from_vocab.py`. Re-running the seeder refreshes only entries that still match that seed provenance; curated hand edits outside that set are preserved when the seeder is used carefully (see script docstring).

Exact form match against a chapter’s own vocab pairs remains a runtime fallback even if the shared lexicon has not yet listed the form.

## Lookup order (app)

For each selected token, after normalizing punctuation (preserve Kannada characters):

1. Function-word set → connecting-word treatment (no dictionary gloss).
2. Shared lexicon `forms` → lemma(s) → glosses in the learner’s selected language (fall back to other available gloss languages).
3. Exact match against the open chapter’s `vocabulary_term` text → use that term’s definition (and contributor maps).
4. Otherwise → “Root/meaning not available”.

Each Meaning sheet shows glosses for the **currently selected word(s)**. Phrase-level combined translation is out of scope.

## Reader UI

Stock React Native `Text` selection cannot host a custom floating action bar (especially on iOS). The reader tokenizes the **source** line into grapheme-safe pressable tokens. **Tapping a word opens a bottom sheet** with the selected form, reviewed root/lemma when known, and gloss. Close via the sheet’s **X** or by tapping outside. No intermediate Meaning/Clear toolbar. Multi-word lookup can be added later with an explicit gesture.

Do not split Kannada vowel signs or virama sequences. Test wrapped lines and font scaling.

No AI phrase explanation in v1.

## Offline

Downloaded chapters should also ensure `api/v2/lexicons/<lang>.json` is present locally so Meaning works offline. The bundle is language-scoped (not per-chapter) for v1.

## Validation

`scripts/validate_lexicon.py` checks schema conformance, unique lemma/form keys, form→lemma references, and that function-word forms are not also registered as content lemmas unless explicitly reviewed. `scripts/build_json.py` (or the lexicon build path it invokes) compiles the bundle; `scripts/check.py` runs both.
