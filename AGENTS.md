# Instructions for AI coding agents

This file is normative for any AI agent (regardless of vendor/tool) making changes in this
repository. Where this file and `CONTRIBUTING.md`/`README.md` overlap, this file's rules take
precedence for agent-authored changes — the human-facing docs explain *what* the format is;
this file adds the *strict* rules an agent must not deviate from.

## Security — this repo is public

This repository, and any `apps/`/`packages/` code added to it later, is **public**. Never
commit secrets: API keys with server-side/admin privilege (Firebase Admin SDK service account
JSON, Supabase service-role key), OAuth client *secrets* (confidential-client credentials — a
native app's public client ID is fine), signing keystores/keys (Android keystore, iOS
provisioning/signing certs), `.env` files with real values, or any LLM/third-party API key used
for a paid or rate-limited feature. Client-side config that's inherently public even in a
compiled app binary (a Firebase `apiKey`, a Sentry DSN, a GA4 measurement ID) is fine to commit
— those aren't secrets, the security boundary for them is server-side rules/entitlement checks,
not hiding the value. When in doubt, treat it as secret: use `.env.example` with placeholder
values, inject real values via CI/build-time secrets, and never assume "I'll move this to a
private repo later" undoes an earlier public commit — forks, caches, and search indexes can
outlive a visibility change.

## Planned layout (monorepo)

Content (`{board}/...`), `schema/`, and `scripts/` stay at the repo root exactly as today —
that's deliberate, so `CONTRIBUTING.md`'s "no coding knowledge required" contributor path never
has to navigate app code. `api/` holds generated JSON compiled from the YAML (see
`scripts/build_json.py`), served as-is via a CDN — never hand-edit it. `apps/` (e.g.
`apps/mobile`) and `packages/` (e.g. a shared API-client package) are reserved for app code as
it's added — don't add unrelated content there.

## What this repo is

A CC BY 4.0 dataset of Indian school textbook content as structured YAML: a canonical
source text per chapter, plus community transliterations (same text, different script) and
translations (same text, different language). The consumer is either a human reading
`CONTRIBUTING.md`/chapter READMEs, or a downstream JSON/API build over this data — never
assume a specific consumer; the source-of-truth is the YAML.

## The stitching model — read this before touching any content file

Every chapter folder (`{board}/{state}/{medium}/{grade}/{subject}/{chapter}/`) has this shape:

```
ch01-example/
├── source.kn.yaml               canonical text, full structure, validated by schema/source.schema.json
├── transliteration/
│   └── devanagari.yaml          flat id → text map, validated by schema/contributor.schema.json
├── translation/
│   └── en.yaml                  flat id → text map, same schema as transliteration
└── README.md                    generated — never hand-edit, see "Generated files" below
```

**How the join works, exactly:** `source.{lang}.yaml` is the only file with real structure
(`segments` is an ordered array of objects with `id`, `type`, `text`, and optional
`section`/`stanza`/`exercise`/`ref`/`speaker`). Every `transliteration/*.yaml` and
`translation/*.yaml` file is a **flat dictionary** whose keys are segment `id`s copied
**character-for-character** from the source file, and whose values are that segment's text in
a different script (transliteration) or language (translation). There is no other linkage —
the `id` string *is* the foreign key. A compiler/app joins these by iterating the source's
`segments` in order and looking up `segment.id` in each contributor file's map.

The `labels` block (optional, top-level in both source and contributor files) is the same
mechanism applied to section headings instead of segment text — keys are section names
(`competency`, `intro`, `poem`, `vocab`, `notes`, `story`, `exercise-A`, ...), not segment ids,
but the join rule is identical: contributor files must reuse the *same keys* the source file
used, never invent their own.

### Strict rules for this join — do not violate these

1. **Never invent a segment id.** When adding a transliteration/translation entry, copy the id
   verbatim from the source file you're mapping to (`meta.source`). Do not rename, reformat, or
   "improve" an id.
2. **Never add a key to a contributor file that has no matching id in its `meta.source` file**
   (except `meta` and `labels`, which are structural, not segment ids). `scripts/validate.py`
   enforces this — if it fails on an orphan id, the id is wrong, not the validator.
3. **Never fabricate content.** If a translation, transliteration, answer, or speaker
   attribution is not knowable from the given source text, omit it — do not guess a plausible-
   sounding value. Leave the field/segment out entirely rather than filling it with something
   that might be wrong. (Precedent: `ch02-nanna-kanasu/source.kn.yaml` segment `story-d11` has
   no `speaker` field because the original text had no textual basis to infer one — that is
   correct, not incomplete.)
4. **Partial contribution files are normal and valid.** A transliteration/translation file does
   not need to cover every segment id in its source. Do not pad missing entries with placeholder
   text to make a file "complete."
5. **Do not add new segment `type` values or new segment fields silently.** If existing types
   (`competency`, `prose`, `dialogue`, `poem_line`, `question`, `answer`, `fill_blank`,
   `vocabulary_term`, `vocabulary_definition`, `note_term`, `note_definition`) and fields
   (`section`, `stanza`, `exercise`, `ref`, `speaker`) don't fit the content you're structuring,
   extend `schema/source.schema.json` and `schema/contributor.schema.json` additively (new enum
   value / new optional field) in the same change, and explain the addition in the commit
   message. Never remove or rename an existing enum value or field — other chapters depend on
   it. Never require a new field to be non-optional; new content shapes must not break old
   segments that lack it.
6. **`meta.license` must reflect what's actually on the DIKSHA source page** (CC BY 4.0 or
   CC BY-SA 4.0 vary by board/state) — verify it, don't default to copying the previous
   chapter's license value without checking.

## Generated files — never hand-edit

Every chapter's `README.md` is generated by `scripts/generate_readme.py` from the YAML. Never
edit a chapter `README.md` directly — edit the source/contributor YAML and regenerate.

## Required commands after any content or schema change

Run both, in this order, before considering a content change complete:

```
python3 scripts/validate.py              # schema conformance, duplicate/dangling ids, BOM checks
python3 scripts/generate_readme.py       # regenerates every chapter README.md from the YAML
```

If `validate.py` fails, fix the content — do not weaken the check to make it pass. If
`generate_readme.py` produces a diff, that diff must be committed alongside the content change
(a stale generated README is treated as a bug in CI via `generate_readme.py --check`).

## Segment ID conventions

See `CONTRIBUTING.md` → "Segment ID conventions" for the full table
(`competency`, `intro-{n}`, `poem-s{stanza}l{line}`, `vocab-{word}`/`vocab-{word}-def`,
`note-{word}`/`note-{word}-def`, `ex-{section}-q{n}`/`-ans`, `story-n{n}`, `story-d{n}`). Follow
it exactly — a compiler/app relies on these patterns being stable, not just documented.
