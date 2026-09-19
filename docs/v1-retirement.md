# v1 API / client retirement

← [v2 cutover checklist](v2-cutover-checklist.md) · [Publication model](publication-model.md)

## Decision

As of the `pre-v2-cutover` tag on `main`, **new Akshar mobile clients use the publication identity model and `api/v2/`**. Boot requires an explained adoption/setup selection (`V2SetupFlow`). Legacy board/medium/grade browsing remains only as a fallback when the v2 catalog is unavailable or setup has not completed.

## What stays generated

`scripts/build_json.py` continues to emit **v1** `api/contents.json` and chapter JSON under the historical `KSEEB/...` paths (derived from chapter `meta`, not filesystem layout). Those payloads remain for:

- already-installed clients that have not updated yet
- CDN rollback if a release must be reverted
- the bounded Grade 3 / Grade 5 compatibility views in `catalog-compatibility.json`

Removing v1 generation is **not** part of this cutover commit. Delete or freeze it only after the replacement app release is live and the maintainer confirms no further v1 CDN consumers.

## End of support for old clients

| Item | Policy |
|---|---|
| Old app without v2 setup | Not supported after the cutover app release; recovery is updating the app and completing setup |
| Silent migration of v1 downloads/history into v2 | Not provided — downloads use `chapters-v2/`; Settings offers explicit “Remove old offline copies” |
| Fake compatible responses / ETag repair | Not provided |
| Held Grade 4 editorial YAML | Never served on v1 or v2 production catalogs |

## Recovery path

1. Install/update to the cutover client build.
2. Complete the explained learner-context setup (Grade 3 first language or Grade 5 second language).
3. Redownload chapters into the v2 offline store as needed.
4. Optionally clear legacy v1 offline copies from Settings.

## Rollback

Redeploy or check out the `pre-v2-cutover` Git revision (or an earlier release artifact). Do not wipe `akshar:v2:*` AsyncStorage keys or `chapters-v2/` when rolling the server/CDN back.
