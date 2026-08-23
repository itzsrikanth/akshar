# Real user feedback

A running log of feedback from actual testers/users — distinct from `roadmap.md`, which is the
maintainer's own exploratory thinking about future scope. This file is for capturing real
reported pain points as-is, so they don't get lost or blended with speculative planning, and so a
future design pass has the original problem statement to work from instead of a secondhand
paraphrase.

Each entry: the raw feedback, then (if useful) a short, honestly-scoped technical note — not a
committed solution, just enough context to make a future scoping conversation faster.

---

## 2026-08-23 — Word-level meaning inside a sentence is hard to find

**Feedback:** When a sentence's translation and transliteration are both shown, they help
overall, but it's still hard to tell *which word in the source sentence* corresponds to *which
part* of the translation/transliteration — there's no way to map an individual word to its
meaning. Suggested direction: tapping a word in the source-language sentence could show that
word's root form, transliteration, and translation in a popup or similar UI element.

**Technical note:** today's content schema (`schema/source.schema.json`) is line-level, not
word-level — a segment's `text` is a full sentence/poem line/dialogue line (see any
`source.kn.yaml`), and `translations`/`transliterations` are keyed per segment, not per word.
`vocabulary_term`/`vocabulary_definition` segments exist, but only for the specific words a
chapter's own textbook calls out as vocabulary — not comprehensive coverage of every word in
every sentence. Making an arbitrary tapped word resolvable would need one of:
- **Content-side**: extend the schema with per-word alignment data (e.g. a word→gloss map per
  segment) generated/reviewed alongside the existing translation contribution step — accurate,
  but real added authoring work per chapter, and a schema change (see `AGENTS.md`'s "extend
  schema additively, with justification" rule).
- **App-side**: tokenize the tapped sentence at render time and look words up against some
  dictionary/morphological-analyzer source — no added authoring cost per chapter, but Kannada
  (like other Dravidian languages) is agglutinative, so naive whitespace tokenization won't
  reliably isolate a "root word" from its inflected form, and no dictionary source has been
  evaluated yet for this.

Not scoped or prioritized yet — needs a decision between those two directions (or a hybrid)
before real design/implementation work starts.

---

## 2026-08-23 — A way to report wrong/mistranslated content, in-app

**Feedback:** When a text, translation, or transliteration is wrong, there should be a way to
send in a correction — either committed directly, or logged somewhere like GitHub issues.
Sentry probably isn't the right tool for this. Worth thinking through an actual UX for
in-place correction: should users get an edit mode and submit from there, or is there a better
pattern?

**Technical note:** this is a different problem from the shake-to-report crash/bug flow already
wired up via `Sentry.showFeedbackForm()` (`services/crash-reporting.ts`) — that's unstructured
free text with no link back to *which chapter, which segment, which language variant* was wrong,
and Sentry's own feedback product has no concept of "this string, in this file, is incorrect."
Routing a content correction through it would bury a structured, actionable report inside a
crash-reporting tool that isn't built to hold it, and — same reasoning as the original
shake-to-report design — it'd mean Sentry ends up holding a copy of CC BY 4.0 content strings it
has no reason to hold.

The content itself is already git-native: every string a reader sees is one `id: text` entry in
a `source.{lang}.yaml`, `translation/{lang}.yaml`, or `transliteration/{script}.yaml` file (see
`AGENTS.md`'s "stitching model"), and the only path content gets into `main` is a PR that passes
`scripts/validate.py` — a stranger's correction can't land silently even if it wanted to. That
existing shape rules out one option immediately:

- **Auto-commit / direct write from the app.** Would require the client to hold *some* credential
  with write access to a public content repo — exactly the class of thing `AGENTS.md`'s security
  section exists to keep out of a public app bundle (no server-side/admin token, ever, client-side).
  A serverless proxy could hide the token, but that's real infrastructure (hosting, abuse/rate-limit
  handling, moderation queue) for a problem this repo already solves with GitHub's own review flow.
  Rejected for that reason, not attempted.

Two shapes are actually viable, and they trade off differently:

1. **Long-press (or a small flag icon) on a segment → prefilled GitHub issue.** The reader
   taps/holds the specific line that's wrong; a sheet asks what's wrong (free text) and on submit
   opens `github.com/.../issues/new?...` (via `Linking.openURL`, no auth held by the app at all)
   prefilled with the chapter path, segment `id`, the current text in every language/script shown,
   and the reader's note. This is the same GitHub-issue-based contribution path `CONTRIBUTING.md`
   already documents for adding content by hand — a correction becomes just another issue a
   maintainer triages into a PR, no new moderation surface to build. Cost: the reader needs (or
   has to create) a GitHub account and complete the submission there, which is a real drop-off
   point for a parent who isn't a developer — the same "no coding knowledge required" audience
   `CONTRIBUTING.md` is written for.
2. **In-app "suggest an edit" mode**, closer to Wikipedia's inline edit or Google's "Suggest an
   edit" on Maps: tap a line, type the corrected text right there, submit from inside the app —
   no GitHub account needed. This reads better for a non-technical parent, but it's a materially
   bigger build: it needs *somewhere* to land submissions before they're real content (a queue a
   maintainer can review, likely a small serverless endpoint + datastore, since there's no backend
   today — see `tech-implementation.md`'s no-backend stance), plus real spam/abuse handling before
   it's exposed publicly. It also only handles "this text is wrong, here's what it should be" —
   the GitHub-issue route additionally handles "I'm not sure what's right, but this looks off,"
   which matters for a parent who caught a mistake but can't necessarily supply the fix themselves.

Leaning towards (1) first — it reuses infrastructure and review process that already exists and
adds zero new attack surface or hosting cost, at the price of a rougher submission flow — with
(2) as a later upgrade once there's evidence of enough correction volume to justify building and
moderating a real submission queue. Not scoped or prioritized yet; flagging both options rather
than committing to one before that trade-off gets discussed.
