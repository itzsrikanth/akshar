# Contributing to Akshar

Thank you for helping make school content accessible to more families.

## What you can contribute

- **Source text** — structured YAML of a textbook chapter you have access to (verify the DIKSHA license before adding)
- **Transliteration** — the same text in a different script (Devanagari, Latin, Tamil, Telugu, etc.) so parents can read it aloud
- **Translation** — meaning in another language (English, Hindi, or any regional language)

No coding knowledge required. All three can be done via GitHub's web UI.

## File naming

| File | Convention | Example |
|---|---|---|
| Source | `source.{iso639-1}.yaml` | `source.kn.yaml` |
| Transliteration | `transliteration/{script}.yaml` | `transliteration/devanagari.yaml` |
| Translation | `translation/{iso639-1}.yaml` | `translation/en.yaml` |

Common ISO 639-1 codes: `kn` Kannada · `hi` Hindi · `en` English · `te` Telugu · `ta` Tamil · `mr` Marathi · `ml` Malayalam · `bn` Bengali · `gu` Gujarati

Script names: `devanagari` · `latin` · `tamil` · `telugu` · `gujarati` · `bengali`

## Adding a new chapter (source file)

1. Create the folder: `{board}/{state}/{medium}/{grade}/{subject}/{chapter-slug}/`
2. Copy the template below into `source.{lang}.yaml`
3. Fill in each segment — one entry per line, question, vocabulary term, or note
4. Add at least one translation or transliteration file
5. Open a PR with title: `add: KSEEB/Karnataka/English/Grade5/Kannada/ch02`

### Source file template

```yaml
meta:
  board: KSEEB                          # issuing board
  state: Karnataka                      # state, or "national" for CBSE/ICSE
  medium: English                       # language of instruction
  grade: 5                              # numeric
  subject: Kannada                      # subject name in English
  chapter: 1                            # numeric
  slug: ch01-chapter-title              # kebab-case, used as folder name
  title: ಅಧ್ಯಾಯ ಶೀರ್ಷಿಕೆ              # title in source language
  source_url: https://diksha.gov.in/... # DIKSHA URL or DIAL code URL
  license: CC BY 4.0                    # verify on DIKSHA before using
  original_publisher: KSEEB

segments:
  - id: competency
    type: competency
    text: ...

  - id: intro-1
    type: prose
    section: intro
    text: ...

  - id: poem-s1l1
    type: poem_line
    stanza: 1
    text: ...

  - id: q1
    type: question
    exercise: A
    text: ...

  - id: q1-ans
    type: answer
    ref: q1
    text: ...
```

### Segment ID conventions

| Content | ID pattern | Example |
|---|---|---|
| Competency header | `competency` | `competency` |
| Introduction prose | `intro-{n}` | `intro-1` |
| Poem line | `poem-s{stanza}l{line}` | `poem-s2l3` |
| Vocabulary term | `vocab-{word}` | `vocab-kaasu` |
| Vocabulary definition | `vocab-{word}-def` | `vocab-kaasu-def` |
| Note term | `note-{word}` | `note-tagadu` |
| Note definition | `note-{word}-def` | `note-tagadu-def` |
| Exercise question | `ex-{section}-q{n}` | `ex-a-q1` |
| Exercise answer | `ex-{section}-q{n}-ans` | `ex-a-q1-ans` |
| Fill-in-the-blank | `ex-{section}-q{n}` | `ex-b-q2` |
| Passage prose | `ex-{section}-p{n}` | `ex-c-p1` |

### Valid type values

`competency` · `prose` · `poem_line` · `question` · `answer` · `fill_blank` · `vocabulary_term` · `vocabulary_definition` · `note_term` · `note_definition`

## Adding a transliteration or translation

1. Navigate to the chapter folder on GitHub
2. Open `source.{lang}.yaml` — note the segment IDs
3. Create a new file: `transliteration/{script}.yaml` or `translation/{lang}.yaml`
4. Use this template:

```yaml
meta:
  source: source.kn.yaml       # which source file this maps to
  script: devanagari           # for transliteration; omit for translation
  language: hi                 # for translation; omit for transliteration
  contributor: your-github-username
  license: CC BY 4.0

# one line per segment — copy IDs from source, add your text
competency: ...
intro-1: ...
poem-s1l1: ...
```

You do not need to cover every segment. Partial contributions are welcome — cover what you can, leave the rest for others.

## License

By contributing, you agree that your contributions are released under CC BY 4.0, the same license as the rest of this repository.
