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
