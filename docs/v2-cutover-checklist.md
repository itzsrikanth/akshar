# v2 cutover checklist

← [Publication model](publication-model.md) · [Roadmap checkpoint](roadmap.md#identity-migration-checkpoint)

Device and release steps for retiring v1 after the content relocation. Do not remove v1 generation or switch production clients until every item below is checked.

## Pre-cutover snapshot

| Field | Value |
|---|---|
| Recorded on | 2026-09-19 |
| Git revision (pre-retirement) | `36539d7908d1a50cc0dec3cc80f9267df63a8197` (update when tagging) |
| Rollback | `git checkout` / redeploy this revision; leave v2 local namespaces untouched on rollback |

Annotated tag to create when starting the production cutover window: `pre-v2-cutover`.

## Automated (already in CI / `scripts/check.py`)

- [x] `python3 scripts/validate.py`
- [x] `python3 scripts/generate_readme.py --check`
- [x] `python3 scripts/build_json.py --check`
- [x] `python3 scripts/check_v2_acceptance.py` (held chapters excluded from v2, 16 v1 catalog rows, dual adoptions, formerPath evidence, no Grade 4 API payloads)
- [x] Mobile `tsc --noEmit`
- [x] Local content server serves `api/v2/contents.json` (200) and held chapter URLs (404)

## Device acceptance matrix

Run against a local content server (`npm run content-server`) and a build that points at it in `__DEV__`.

- [ ] Fresh install: V2 setup appears; selecting Grade 3 FL or Grade 5 SL shows the same eight chapters; download/read/exercises work offline after download
- [ ] Upgrade from v1 data: explained setup copy appears; v1 downloads/history remain until Settings → Remove old offline copies; preferences (font size, reading languages) survive setup
- [ ] Switch adoption context: same edition chapters and downloads; no silent grade overwrite
- [ ] Offline boot with cached v2 catalog; failed refresh keeps last-known-good; retry recovers
- [ ] Interrupted chapter download then retry replaces only after validation
- [ ] Held Grade 4 drafts never appear in Explore/Library/catalog

## Production cutover (do last)

- [ ] Publish referenced `api/v2/` payloads (CDN/`@main` or release artifact) before flipping any production client default
- [ ] Document v1 support end date and recovery path (new app + setup flow)
- [ ] Ship the client release that requires v2 setup
- [ ] Only then remove obsolete v1 generation/aliases if still desired

Source commits alone do not deploy an app update.
