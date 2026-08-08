# Akshar

[![Validate content](https://github.com/itzsrikanth/akshar/actions/workflows/validate.yml/badge.svg)](https://github.com/itzsrikanth/akshar/actions/workflows/validate.yml)
[![Content License: CC BY 4.0](https://img.shields.io/badge/content%20license-CC%20BY%204.0-lightgrey.svg)](LICENSE)
[![Code License: MIT](https://img.shields.io/badge/code%20license-MIT-blue.svg)](LICENSE-CODE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/itzsrikanth/akshar?style=social)](https://github.com/itzsrikanth/akshar/stargazers)

![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)

> Open, community-contributed phonetic guides and translations for Indian school textbook content — so every parent can help their child, regardless of which script they know.

**No coding knowledge required to contribute** — add a chapter's text, a transliteration, or a translation entirely through GitHub's web UI. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## What is Akshar

Millions of Indian children study a regional language at school that their parent can speak but
can't read the script of. Akshar provides, for every line of every textbook lesson, the original
text alongside a pronunciation guide in a script the parent already knows, and a translation for
meaning — as open, community-contributed data. See [The problem](docs/problem.md) for the full
picture, including a landscape scan of why nothing else already covers this.

---

## Documentation

| | |
|---|---|
| [The problem](docs/problem.md) | Why this exists, and what else was checked first |
| [Content license](docs/license.md) | CC BY 4.0 content, MIT code |
| [Repository structure](docs/repository-structure.md) | Folder layout + the machine-readable `api/` |
| [Data format](docs/data-format.md) | The YAML source/contributor file spec |
| [Automating the first pass](docs/automation.md) | Tooling plan for draft transliterations |
| [Roadmap](docs/roadmap.md) | What's built, what's next |
| [Current content](docs/current-content.md) | What's in the repo today |
| [Full docs index](docs/README.md) | Including the mobile app's own docs |

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
