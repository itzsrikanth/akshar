← [Back to README](../README.md)

## Content source and license

Source textbooks are published by government bodies (NCERT, KSEEB, UPMSP, etc.) on [DIKSHA](https://diksha.gov.in) under **Creative Commons Attribution 4.0 (CC BY 4.0)**.

CC BY 4.0 permits copying, redistribution, adaptation (translations and transliterations are adaptations), and commercial use. Attribution to the original publisher is required in each file's `meta` block.

> Note: some state board content uses CC BY-SA 4.0. The ShareAlike clause requires this repository and any derived app to also be open-licensed. Check the specific license on the DIKSHA page before adding content from a new board.

Transliterations and translations contributed here are original creative works by contributors, released under CC BY 4.0.

This repo uses two licenses: [`LICENSE`](../LICENSE) (CC BY 4.0) covers the CC BY textbook content, transliterations, and translations, subject to each file's actual source license and the editorial-draft exception below; [`LICENSE-CODE`](../LICENSE-CODE) (MIT) covers scripts and tooling (e.g. `scripts/`, CI workflows).

### Grade 4 editorial-draft exception

The ten YAML files under `KSEEB/Karnataka/Kannada/Grade4/Kannada/ch01-kannadammana-harake/` and `KSEEB/Karnataka/Kannada/Grade4/Kannada/ch02-buddhivanta-ramakrishna/` are stored in Git at the maintainer's explicit request. No CC license is asserted for these drafts, including their translations and transliterations; they are excluded from the repository's CC BY grant. Their `meta.license` records the unresolved status and the source PDF's `NOT TO BE REPUBLISHED` notice. The older DIKSHA collection metadata has not established rights for the transcription edition. A request to store the work does not itself establish those rights.

These chapters are excluded from all production API output by `api-publication-holds.json`. They are structurally validated but are not approved app content. Generated chapter READMEs link to the YAML with a draft warning instead of presenting incomplete lesson rendering. Resolve rights and renderer compatibility before removing either hold; see the provenance records and conversion TODO.
