# v2 cutover checklist

← [Publication model](publication-model.md) · [Roadmap checkpoint](roadmap.md#identity-migration-checkpoint) · [v1 retirement](v1-retirement.md)

Implementation cutover for the lean publication migration. App Store / Play shipping is separate from this Git cutover.

## Pre-cutover snapshot

| Field | Value |
|---|---|
| Recorded on | 2026-09-19 |
| Annotated tag | `pre-v2-cutover` |
| Rollback | Check out / redeploy the tagged revision; leave v2 local namespaces untouched |

## Automated (CI / `scripts/check.py`)

- [x] `python3 scripts/validate.py`
- [x] `python3 scripts/generate_readme.py --check`
- [x] `python3 scripts/build_json.py --check`
- [x] `python3 scripts/check_v2_acceptance.py`
- [x] `python3 scripts/smoke_v2_cutover.py` (+ optional `--base-url http://127.0.0.1:8787`)
- [x] Mobile `tsc --noEmit`
- [x] Settings works with v2 selection even if the legacy catalog fails
- [x] Local content server: v2 catalog 200; held chapter URLs 404

## Contract equivalents for device matrix

These replace interactive device runs for the Git cutover. Re-run on a device before the store release if desired.

- [x] Fresh / upgrade path: `_layout` requires `V2SetupFlow` when setup is incomplete; upgrade copy explains that v1 downloads stay until explicit cleanup
- [x] Dual adoptions resolve to one eight-chapter edition (`check_v2_acceptance` + smoke)
- [x] Held Grade 4 drafts never appear in `api/v2` catalogs or chapter payloads
- [x] Offline / retry design: v2 catalog cache + last-known-good; chapter downloads write temp then validate before replace (`chapters-v2/`)
- [x] Explicit legacy cleanup only via Settings → Remove old offline copies

## Production release (human / store)

- [x] `api/v2/` committed on `main` (CDN `@main` picks up after jsDelivr refresh)
- [x] v1 retirement policy documented in [v1-retirement.md](v1-retirement.md)
- [ ] Ship the Expo/EAS client build that includes v2 setup (store release)
- [ ] After the store release is live, optionally freeze or remove v1 generation — not required for this Git cutover

Source commits alone do not deploy an app update.
