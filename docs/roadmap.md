← [Back to README](../README.md)

## Roadmap

- [x] JSON schema + CI validation for source and contributor files (`schema/`, `scripts/validate.py`) — schema conformance, unique segment IDs, dangling `ref` detection, contributor-file orphan-ID detection, meta/path consistency, BOM/invisible-character checks
- [x] Auto-generate chapter `README.md` from YAML via CI (`scripts/generate_readme.py`, checked in CI with `--check`)
- [x] Compile YAML into a machine-readable JSON API + manifest (`api/`, `scripts/build_json.py`, checked in CI with `--check`)
- [ ] Local (non-CI) draft-transliteration script: `indic_transliteration`/`sanscript` for Brahmic→Brahmic, IndicXlit for Brahmic→Latin — always a human-reviewed draft
- [ ] Root-level content index (manually maintained for now; see [Current content](current-content.md))
- [ ] Community-recorded audio as a third contribution type, alongside transliteration/translation
- [ ] Cross-chapter vocabulary glossary per subject/grade
- [x] Mobile app (Expo/React Native) consuming `api/` — lazy per-chapter download + local cache, manifest-driven update checks (see [`apps/mobile/docs/`](../apps/mobile/docs/) for the app's own, more detailed roadmap)
- [ ] Bhashini TTS integration for audio pronunciation in app

This is the content/repo-level roadmap. The mobile app has its own, more detailed roadmap at
[`apps/mobile/docs/roadmap.md`](../apps/mobile/docs/roadmap.md) (multi-profile support, audio
pronunciation vendor comparison, handwritten-homework recognition, interactive exercises, and
more).
