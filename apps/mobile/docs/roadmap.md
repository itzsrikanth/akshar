# Future Roadmap

Status audit: September 13, 2026. The checklist below reflects repository implementations, not production/device acceptance. Remaining features are exploratory and unscheduled; prioritize the core reading experience before speculative backend/AI features. Repository-level work is tracked in the [content roadmap](../../../docs/roadmap.md).

## Implementation status

- [x] Catalog-backed Home/Explore/Reader, on-demand chapter fetch, and explicit offline chapter downloads (`src/services/content-repository.ts`, `src/services/downloads.ts`, `src/hooks/use-chapter.ts`).
- [x] Unified Kannada/Grade3 chapter listing with old catalog/URL/history compatibility; selected translated and transliterated chapter titles replace Explore availability pills. See the [bounded compatibility bridge](../../../docs/catalog-unification.md); general adoption discovery remains separate work.
- [x] Bounded dual-context Explore browsing: English/Grade5/Kannada and Kannada/Grade3/Kannada select the same eight chapters, with saved-scope and partial-prefix support and no duplicate download identity. Requires deployment of the updated app code; not a general adoption catalog or search feature.
- [x] Saved scope, reading preference, and chapter-open history under the fixed `default` profile (`src/services/scope-storage.ts`, `src/services/reading-preference-storage.ts`, `src/services/reading-history.ts`). History is not segment-level reading progress.
- [x] Confirmed developer-only local reset: clear onboarding, preferences, history, catalog/developer settings, and downloaded chapters, then restart for a fresh onboarding run.
- [x] Persisted font-size controls in Reader and Settings, applied to scalable text (`src/components/font-size-stepper.tsx`, `src/services/font-scale-store.ts`, `src/components/themed-text.tsx`).
- [ ] Multi-profile selection and independent per-child state; default-profile storage names are only preparation, not a profile switcher.
- [ ] Segment-level reading position/completion and a `ProgressRepository`; current history records only chapter paths/open times.
- [ ] Search and shared-book adoption-aware discovery; `src/app/search.tsx` is a placeholder. Grade 3 first-language and Grade 5 second-language usage must resolve to the same complete edition.
- [ ] ISBN search against verified identifiers in the generated v2 catalog: accept typed/pasted ISBNs with spaces or hyphens, resolve validated ISBN-10/ISBN-13 representations, and show matching book/edition/source-format details. Deduplicate adoption routes, not distinct publications. Show a clear no-match result; books without ISBNs remain discoverable by title and learner context. Search a cached catalog offline when present; do not require an external ISBN service. The [shared roadmap](../../../docs/roadmap.md) owns metadata and validation; camera/barcode scanning is deferred.
- [ ] Downloaded-content revision comparison, safe manual refresh, canonical download keys, and API-version/state migration. Startup catalog refresh is implemented; offline file refresh is not. **Partial:** v2 offline downloads use canonical `(bookId, editionId, chapterId)` keys under a separate `chapters-v2/` namespace with schema/identity validation and last-known-good fallback helpers in `src/services/v2/`; live UI still uses v1 slug downloads.
- [ ] Implement the authorized breaking v2 pilot upgrade: the maintainer has informed existing users and owns communications. Use separate v2 caches/download/history keys and an explicit, explained setup/reselection/redownload flow; full automatic v1-state migration and ongoing old-client support are not required. Preserve old local state until successful setup and explicit cleanup; offline or failed setup must remain retryable without reinstall or silent data loss. Do not retire v1 until the tested replacement release is ready. See the [shared checkpoint](../../../docs/roadmap.md#identity-migration-checkpoint). **Partial:** setup gate, Explore/Home/Library v2 paths, Settings reselection, and explicit v1 cleanup are wired; production cutover and content relocation remain.
- [x] Optional bounded media-origin health check during splash and foreground resume (`src/services/media-availability.ts`); absent configuration performs no request. This is not audio playback or a per-asset availability guarantee.
- [ ] Audio generation, object-storage publishing, and playback. **Partial:** `expo-audio` + sample-mode playback (`EXPO_PUBLIC_MEDIA_SAMPLE_MODE`, bundled `assets/audio/pronunciation-demo.m4a`) enables speakable reader/exercise speaker icons for UI testing; real TTS/manifests not done. Repo IaC/publish tooling for R2 lives under [`infra/cloudflare`](../../../infra/cloudflare/README.md).
- [ ] Wire sentence speaker availability to verified local audio or a known reachable remote asset; cached audio remains playable offline. Handle per-asset failures and recovery, not only boot status; see [media delivery](../../../docs/media-delivery.md). Sample mode is a temporary stand-in.
- [ ] Handwritten-homework recognition; no recognition/backend implementation.
- [ ] Interactive self-check exercises and persisted attempts; existing exercise components are read-only.
- [ ] Community-recorded audio and cross-chapter glossary/spaced repetition; source vocabulary types are available, but these features are not.
- [ ] Production web delivery and browser acceptance checks; web dependencies/configuration and a web tab component exist, but do not establish a verified deployment.
- [ ] Dyslexia-friendly font selection and broader accessibility acceptance testing; font-size scaling alone does not complete accessibility.
- [ ] Source-word selection popup with reviewed root/gloss lookup and multi-word per-root display, without AI initially; prioritize other-grade Kannada demo content first. See [word selection](#6-word-selection-and-root-word-glosses). **Partial:** tokenized source selection + Meaning action bar/sheet and offline lexicon download against [lexicon.md](../../../docs/lexicon.md); curated inflection coverage still expanding.

## 1. Multi-kid / multi-profile support

**Concept:** a family with more than one child, each with their own scope (board/state/medium/grade/subject — see `product-brief.md`), progress, and reading history.

**Existing preparation, not a completed feature:** scope, preferences, font scale, and chapter-open history use fixed `default`-profile keys in AsyncStorage. There is no profile switcher or segment-level `ProgressRepository`. The authorized identity migration must introduce collision-safe book/edition/chapter keys with the default profile and a tested setup/reselection flow; it need not implement a profile switcher or import all v1 history/downloads. Add multi-profile behavior later without changing canonical content keys. See the [publication migration plan](../../../docs/publication-model.md).

**One nuance worth getting right conceptually now:** downloaded *content* (chapter JSON on disk) should stay profile-agnostic and shared — two kids in the same grade/subject shouldn't trigger a duplicate download. Only scope and progress are per-profile; the content cache is not.

## 2. Audio pronunciation — generation, caching, delivery

Answering the direct questions: yes, there are real TTS options for Indian languages; no, this doesn't force a backend; and the "compute once, store as a blob" instinct is correct.

**Provider evaluation remains pending.** Compare Bhashini, Sarvam AI, Google Cloud TTS, Azure Speech, Amazon Polly, and self-hosted options such as AI4Bharat against the actual languages/scripts and sample textbook text. Verify current voices, pronunciation quality, terms, redistribution rights, quotas, pricing, operational cost, and access requirements at implementation time. Earlier price/free-tier and coverage assertions were not implementation evidence and are not a provider decision.

**Proposed generation flow:** a local script or protected CI job synthesizes and reviews reusable audio before publication, rather than making paid requests from the mobile app. It hashes source text and synthesis settings, reuses matching artifacts, and publishes approved output to object storage. This could avoid a live app backend for pre-generated pronunciation, but still requires tooling, secure credentials, quality review, storage, and delivery. None of that pipeline is implemented yet.

**One content nuance:** audio should be keyed by (language, text), not duplicated per script variant. Kannada source text and its Devanagari transliteration are the *same spoken sounds* in different scripts — one audio file serves both "read aloud" buttons; synthesizing twice would be pure waste.

**Storage/delivery — provider-neutral object storage:**
- Keep generated audio and textbook images/scans outside Git; version provider-independent asset manifests, checksums, and source/license evidence in the content repository. Small UI icons remain a separate app-asset concern.
- Keep provider choice, account-credit restrictions, and IaC decisions in the shared [media delivery record](../../../docs/media-delivery.md), not a competing mobile-only decision. Playback and offline-control behavior belong here.
- Resolve immutable asset keys through a configurable origin/manifest so switching provider does not change chapter identities. Keep upload credentials out of the app, publish assets before references, and retain files needed by supported editions and offline clients. See the [repository publication/media plan](../../../docs/publication-model.md).

**Cost model to evaluate:** reuse generated assets for unchanged text with the same language/voice/model/settings. Budget separately for generation/regeneration, storage, delivery, requests, and any self-hosted compute; do not assume total operating cost stays fixed as usage grows. Include synthesis settings/version in cache identity so changing a voice does not silently reuse the wrong audio.

## 3. Handwritten homework recognition

**Concept:** a parent or child photographs handwritten homework; the app helps interpret it against the target script, or checks it against expected answers.

**Honest technical framing — this is a different, harder problem than the rest of this doc.** Traditional OCR for *handwritten* Indic scripts (as opposed to printed text, or as opposed to handwritten Latin script) is meaningfully less mature and less reliable. A more promising v1 approach is routing the photo to a vision-capable multimodal model rather than a classical OCR pipeline — modern multimodal LLMs handle messy multi-script handwriting noticeably better than OCR engines tuned mostly for printed Latin text.

**Architectural implication, stated plainly:** unlike text content and audio — both static and precomputable — this is inherently a live, per-request, unpredictable-input feature. It's the one item on this whole roadmap that would actually require a real backend (or at minimum a serverless function) to hold an API key safely, since a raw key can't ship inside a public open-source client app. This should be gated behind "we already have a backend for other reasons," not become the reason a backend gets built. Given the technical risk and cost-per-request (unlike the other items, this one doesn't get cheaper with reuse), it's correctly the lowest-priority, most speculative item here — no false confidence intended.

## 4. Interactive exercises — self-check answers

**Concept:** the Exercises screen (`src/app/exercises.tsx`) has five exercise-type components — Answer the following, Fill in the blanks, Match the following, True or False, Give reasons (see `src/components/exercises/`, and the component-architecture decision in `tech-implementation.md`) — but they're all read-only today: the answer is revealed alongside the question, for reading/comparison. The next step is turning each into an actual self-check: the child answers first, then submits to see whether it matched, rather than the answer being visible immediately.

**Why this belongs on the roadmap and not in v1:** validating a free-typed answer needs real thought per type (see below), and a place to persist attempt state. Neither is a v1 blocker for the core reading experience.

**Objective types — no AI needed, client-side only:**
- **Answer the following / Fill in the blanks:** fuzzy string match against the reference answer, not exact match — a translated/transliterated answer has legitimate spelling variation (e.g. `kāsu` vs `kaasu`).
- **Match the following:** the child picks/drags a definition to a term; validate against the known `ref` pairing — trivially exact, no fuzziness needed.
- **True or False:** a straight boolean compare — the simplest of the five.

**Subjective type — "Give reasons" needs an AI API, not string matching.** A reasoned explanation has many valid phrasings; there's no reference string to fuzzy-match against. Grading it means sending the child's written answer plus the reference reason to an LLM and asking whether it captures the same idea. **Architectural implication, stated plainly:** this is a live, per-request AI call, same shape as [handwritten homework recognition](#3-handwritten-homework-recognition) — it needs a backend or serverless function to hold the API key safely (a public client app can't ship a raw key), so it should be gated behind "a backend already exists for other reasons," not become the reason one gets built. The four objective types have no such dependency and could ship well before this one.

**Design note (so this doesn't get redesigned from scratch later):** when the Exercises screen gets its next real design pass, each of the five item components should account for these states, in addition to the read-only view shown today:
- an empty **answer input**, shaped per type (free text for Answer/Give reasons, a single field for Fill in the blanks, a tap/drag target for Match, a True/False toggle)
- a **submitted / checking** state (for Give reasons specifically, this may be a visible "checking..." wait while the AI call is in flight — not instant like the other four)
- **correct** and **incorrect** result states (with the reference answer still shown after submission, either way — this is a learning aid, not a graded test)
- a per-exercise-type **completion summary** (e.g. "4 of 6 answered")

**Planned persistence:** store attempts under learner/profile plus canonical book/edition/chapter/segment identity, not segment ID alone. The planned `ProgressRepository` must preserve existing state during migration; neither it nor attempt tracking is implemented. See [multi-kid support](#1-multi-kid--multi-profile-support).

## 5. Other relevant possibilities worth noting

- **Community-recorded audio** — shared contribution/generation work belongs in the [repository roadmap](../../../docs/roadmap.md). A future player could prefer reviewed community audio and fall back to reviewed TTS clips; neither source of audio exists yet.
- **Cross-chapter vocabulary glossary / spaced repetition** — glossary data belongs in the [repository roadmap](../../../docs/roadmap.md); review UX belongs here. Existing `vocabulary_term`/`vocabulary_definition` pairs are a starting point, not complete inflection/root mappings or implemented flashcards.
- **Web version** — `react-native-web`, static-web output configuration, and web-specific tabs exist. A production web target still needs build, routing, browser/offline-storage, accessibility, and deployment verification; configuration alone is not completion.
- **Accessibility** — persisted font-size scaling is implemented in Reader/Settings and scalable text. Dyslexia-friendly font selection and broader screen-reader, contrast, and large-text layout verification remain pending; do not mark them complete based on the typography tokens alone.

## 6. Word selection and root-word glosses

Priority: after the [Kannada school-demo expansion](../../../docs/kannada-expansion-todo.md). This is larger than simply adding a tooltip: it needs reliable source selection, curated lexical data, and contextual placement/accessibility. No AI or paid inference is part of the first version.

Normative design: [lexicon.md](../../../docs/lexicon.md). Lexical YAML lives under `content/lexicons/` (not inside chapter `source.*.yaml`). Stock RN `Text` selection cannot host a custom action bar; the reader uses grapheme-safe token presses instead.

- Tap a source-language word to open a bottom sheet with its form, reviewed root/lemma if known, and gloss. Close via **X** or by tapping outside. Test Kannada grapheme clusters, wrapped lines, font scaling, and punctuation; do not split vowel marks or assume ASCII word boundaries. Multi-word selection can be added later.
- Show the selected form, reviewed root/lemma if known, and its available English/Hindi or selected-language gloss. Reuse textbook vocabulary definitions when they actually match; do not infer a root by stripping a suffix or guess a definition from the sentence translation. Show “Root/meaning not available” for unmatched forms and label uncertain/ambiguous mappings rather than presenting one as certain. Connecting/function words use the curated list — no dictionary gloss.
- When multiple words are supported later, display each matched word/root and its individual meaning. Label this as individual word meanings, not a combined phrase translation. Sentence translations need not align one-to-one with Kannada words.
- Keep lookup offline when the chapter/lexical bundle is downloaded. Lexicon provenance, licensing, inflected-form mappings, and canonical chapter/segment/text-revision linkage are shared data work in the repository roadmap; do not silently add fields/types to the source schema.
- Later, separately reviewed AI assistance could explain a phrase or disambiguate roots. It remains optional, clearly labelled, and absent from the initial implementation; do not expose a working-looking AI action now.
