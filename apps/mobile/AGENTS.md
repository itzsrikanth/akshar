# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Also read the repo root AGENTS.md

See [`../../AGENTS.md`](../../AGENTS.md) — it defines the content/API contract this app consumes (`api/contents.json` + per-chapter JSON compiled by `scripts/build_json.py`) and, importantly, the public-repo security rule: never commit signing keys, service-account/admin credentials, or any paid-feature API key. Client-side config (Firebase `apiKey`, a Sentry DSN, a GA4 measurement ID) is fine to commit.

## Content conversion — lean quota pattern

When this agent (or a sibling) converts textbook YAML for the app to consume, follow the root [`AGENTS.md`](../../AGENTS.md) stitching and holds rules, and prefer this **lean** workflow so model quota is not wasted:

1. **Source YAML first** — stabilize Kannada `source.*.yaml`, segment IDs, and mandatory exercises before spending tokens on contributors.
2. **Script transliteration** — generate latin/devanagari mechanically (local scripts / `indic_transliteration`); review exceptions only. Do not use premium chat models for bulk Brahmic↔Latin maps.
3. **LLM only for en/hi hard bits** — translations where judgment matters; omit unknowns rather than inventing. Partial contributor files are valid.
4. **One grade (or chapter) at a time** — finish, validate, checkpoint; avoid parallel whole-book agents racing on `api-publication-holds.json` / `edition.yaml`.
5. **Combine/validate once** — `validate.py` → `generate_readme.py` → `build_json.py` → `check.py` at the session boundary, then commit.

Corpus ceiling for Savi Kannada FL expansion: **printed Grades 1–8** (Part 1 first). Do not start Grade 9–10 FL unless the maintainer asks. Held/Unverified editions stay Git-only until rights are verified.
