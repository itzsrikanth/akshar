# Product Brief — Mobile App

Status: Accepted

This is the first product-requirements document for the mobile app. Nothing here contradicts existing code — the app's screens are still stubs — this fills that gap so screen design (e.g. via Claude Design) has real product context instead of an empty repo to guess from. Brand tokens and iconography are decided elsewhere and only referenced here, not restated — see [`theme.md`](./theme.md) and [`iconography.md`](./iconography.md).

## Product summary

For every line of a textbook chapter, show the original script alongside a pronunciation guide in a script the reader already knows, plus a translation for meaning — so a parent who can't read their child's textbook script (or a student working independently) can still follow the content line by line.

## Primary users

Not a single persona — it's grade-dependent:

- **Lower/primary grades:** the **parent** is the primary app user, helping their child with homework. They can't read the target script but are otherwise a normal adult reader.
- **Senior grades:** the **student** uses the app directly, independently.

This isn't a hard UX mode-switch for v1 — core screens should stay in plain, simple language that serves both without assuming either. Persona-specific refinement (e.g. a more guided tone for younger students) is a later iteration, not a v1 requirement.

## Information architecture

Five tabs exist as route stubs today; this gives each a real purpose:

| Tab | Purpose |
|---|---|
| **Home** | Dashboard — recently-read/in-progress chapters ("continue reading"), quick access into the user's saved scope. |
| **Downloads** | Chapters saved on this device. Open offline, delete to free space. Empty is honest: CTA into Explore. Not a catalog browser. |
| **Explore** | Catalog browser. Opens at the saved grade (subjects/chapters). Breadcrumb climbs the hierarchy when the user needs something outside that scope (sibling grade, another board). Download happens here. |
| **Search** | Keyword/filter search across the full catalog (`api/contents.json`). |
| **Reader** | The per-segment reading screen — see below. |

## Content scoping — hybrid model

The parent/student sets a default scope (board/state/medium/grade) once during setup. Home and Explore use that as the default landing so daily homework use is low-friction. Scope is not overcomplicating — without it, every visit restarts at board root. Explore is the hierarchy; Downloads is only what's already on disk. Do not put a second board/grade/chapter picker on Downloads — that duplicates Explore and empties the word "library" of meaning.

**Why keep Downloads instead of removing the tab:** Explore already downloads, but once several chapters are saved, parents need a short "what's offline / delete this" list without re-walking the tree. Removing the tab would bury that in Settings. Renaming Library → Downloads is enough; inventing a fuller "library" experience is not.

## Reader screen — layout and behavior

**Layout: stacked segments**, not side-by-side columns or a whole-screen view-switcher. Per segment: source line, then transliteration line, then translation line, stacked vertically.

- Side-by-side columns were rejected: three scripts at a phone's width forces font sizes down, which directly hurts the exact-legibility this app depends on.
- A view-switcher (toggle between seeing only source / only transliteration / only translation) was rejected: it loses the direct line-to-line comparison that's the actual point of the app.
- Use the `Typography.reading` token (`theme.ts`) for this text — its extra line-height exists specifically to give Kannada/Devanagari/Tamil/Telugu diacritics and matras room.

**Must degrade gracefully with partial content.** This is the *common* case today, not an edge case: of the two chapters that currently exist, one has exactly one transliteration (Devanagari) and one translation (English); the other has neither. The Reader needs an explicit "not yet available" treatment for missing transliteration/translation on a segment — never a blank gap that reads as broken.

**Must adapt per segment type**, not render every segment as an undifferentiated text block. `schema/source.schema.json`'s segment `type` enum: `competency, prose, dialogue, poem_line, question, answer, fill_blank, vocabulary_term, vocabulary_definition, note_term, note_definition`. Concretely:
- `question`/`answer` pairs link via the `ref` field — design should visually pair them, not list them as unrelated lines.
- `poem_line` groups via `stanza` — stanza breaks should be visible.
- `dialogue` carries an optional `speaker` — show it when present, and design should hold up fine when it's absent (it's deliberately omitted, not missing data, when the source text gives no textual basis to infer a speaker).

The compiled per-chapter JSON (e.g. `api/KSEEB/Karnataka/English/Grade5/Kannada/ch01-bannada-tagadina.json`) is fully denormalized — each segment already carries its own `transliterations: {script: text}` and `translations: {lang: text}` maps inline, so the Reader never needs to join data client-side.

## Downloads / offline

Design the full experience now; build it in phases.

**Design now (all states, so nothing needs redesigning later):**
- Per-chapter download (single item).
- Group-level download — "download all" at grade level or at subject level.
- Downloaded-state indicator + a delete action (frees local cache).
- Stale-content detection, using the `contentHash` field already present in `api/contents.json` — when it changes, show a re-sync action alongside delete rather than silently serving stale content.
- Content is served from the repo's `api/` JSON via jsDelivr CDN (already the plan per the root README — not a new infrastructure decision, just noted here as a design constraint: content fetches are CDN reads, not calls to a custom backend).

**Build in phases (sequencing note for later work, not a design constraint):** v1 code wires up per-chapter download + delete only. Group-level bulk download and re-sync land in a later iteration, reusing the screens/states designed now rather than redesigning them later.

The **Downloads** tab is the natural home for this — saved chapters and storage management live in one place, matching a Netflix-style "download to watch offline, delete to free space" mental model. Explore is where download *actions* happen; Downloads is where the results live.

## Explicit non-goals for this design pass

- **Audio/TTS playback UI.** Planned on the README's roadmap (Bhashini TTS integration) but not yet built — no reserved affordance in this design pass.
- **Dark mode screens.** Tokens exist and are ready (`Colors.dark` in `theme.ts`) but are intentionally pinned off for v1 — see [`theme.md`](./theme.md).
- **Tablet/large-screen layouts.** Phone-first only.
- **Multi-child/multi-profile support.** One saved scope per install, for now.

This brief can be revisited as real screens get built and any of these decisions prove wrong in practice.
