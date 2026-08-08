# Future Roadmap

Status: Proposed — exploratory, not scheduled

**None of this gets built until the core reading experience (Home/Explore/Reader, real content
fetch, real progress tracking) has actual usage.** This doc exists so that when that traction
shows up, today's architecture doesn't force a rewrite to support these — it's about leaving the
right seams now, not building the features now. Two items already on the root `README.md`'s own
roadmap (community-recorded audio, cross-chapter vocabulary glossary) are referenced, not
duplicated, below.

## 1. Multi-kid / multi-profile support

**Concept:** a family with more than one child, each with their own scope
(board/state/medium/grade/subject — see `product-brief.md`), progress, and reading history.

**The seam to leave now, at zero extra cost today:** `ProgressRepository` (defined in
`tech-implementation.md`) should be profile-aware in its interface from the start — every method
implicitly keyed by a `profileId`, even though v1 only ever has one, constant, invisible-in-UI
profile (`'default'`). Local storage keys in `expo-sqlite/kv-store` should already be namespaced
(`scope:default`, `progress:default`), not global (`scope`, `progress`). This costs nothing extra
to write now — it's the same amount of code — but it means adding a real profile switcher later
is additive (new UI, new profile IDs), not a data migration.

**One nuance worth getting right conceptually now:** downloaded *content* (chapter JSON on disk)
should stay profile-agnostic and shared — two kids in the same grade/subject shouldn't trigger a
duplicate download. Only scope and progress are per-profile; the content cache is not.

## 2. Audio pronunciation — generation, caching, delivery

Answering the direct questions: yes, there are real TTS options for Indian languages; no, this
doesn't force a backend; and the "compute once, store as a blob" instinct is correct.

**TTS options, compared:**

| Option | Notes |
|---|---|
| **Bhashini (ULCA)** | Govt of India platform (already the plan per root `README.md`). Free for low-volume developer use; production/paid use requires contacting their team directly for a pricing plan — not unconditionally free at scale. Register via bhashini.gov.in → My Profile → API Key. |
| **Sarvam AI** | India-founded (IIT Madras), purpose-built for Indian languages, ₹1,000 free credit on signup, then ₹15–30 per 10,000 characters. 35+ voices, Hindi/Tamil/Telugu/Bengali and more. New enough to be worth knowing about even if not the first pick. |
| **Google Cloud TTS** | Broadest language/voice coverage and most mature (Hindi, Kannada, Tamil, Telugu and more), per-character pricing with a monthly free tier. Best fallback if Bhashini's quality/uptime proves inconsistent. |
| **AI4Bharat Indic-TTS** | Open-source, self-hostable models (already referenced in root `README.md`'s "what already exists" survey). Zero ongoing API cost, but needs the maintainer to run inference themselves (e.g. a rented GPU for a few hours) rather than calling a hosted API. |
| Amazon Polly | Ruled out — Indian-language coverage is thin (essentially just Hindi), no Kannada/Tamil/Telugu neural voices. |

**Recommendation:** Bhashini first (matches the existing plan, free at this project's actual
volume), Google Cloud TTS as the quality/reliability fallback, AI4Bharat as a zero-cost fallback
if API access or cost ever becomes a real blocker. Re-evaluate Sarvam once there's a sense of
actual character volume — its free credit alone may cover this project's entire content corpus.

**Does this need a backend? No.** This is the key point: TTS generation is a one-time,
deterministic, offline step — not a live per-request call triggered by app usage. Same shape as
`scripts/build_json.py`: a script (or CI job) walks segments, hashes each *unique* text string
(dedup — common words repeat constantly across chapters, no need to resynthesize "ಮನೆ" every time
it appears), calls the TTS API once per unique string, writes an audio file. This is the exact
same "static content + CDN" architecture already decided in `tech-implementation.md`, extended to
a new content type — not a new category of infrastructure.

**One content nuance:** audio should be keyed by (language, text), not duplicated per script
variant. Kannada source text and its Devanagari transliteration are the *same spoken sounds* in
different scripts — one audio file serves both "read aloud" buttons; synthesizing twice would be
pure waste.

**Storage/delivery — validating the "blob storage, one-time compute" instinct:**
- **Now, at this content scale (2 chapters):** just commit small audio files into the repo
  alongside the JSON, served via the same jsDelivr pattern already in use. Zero new
  infrastructure. jsDelivr has a practical per-file size ceiling (~20MB) that's a non-issue for
  short pronunciation clips.
- **Later, once the audio corpus is large enough that repo size becomes a real concern:**
  graduate to dedicated object storage outside git. **Cloudflare R2** is the standout choice
  specifically for audio — $0 egress fees (audio is bandwidth-heavy; S3/GCS charge per-GB egress,
  which compounds under real traffic; R2 doesn't), S3-compatible API, 10GB storage free
  permanently, $0.015/GB-month beyond that. Backblaze B2 is a comparable cheap alternative.
- Don't build the R2 migration before it's needed — same restraint already applied to SQLite in
  `tech-implementation.md`: no premature infrastructure.

**Cost framing, directly:** because generation is one-time-per-unique-string, total cost scales
with vocabulary size, not with usage — it doesn't matter if the app has 10 users or 10,000, the
audio generation bill doesn't change. At this project's current content volume, total one-time
cost across any of the paid options above is realistically cents to a few dollars, ever.

## 3. Handwritten homework recognition

**Concept:** a parent or child photographs handwritten homework; the app helps interpret it
against the target script, or checks it against expected answers.

**Honest technical framing — this is a different, harder problem than the rest of this doc.**
Traditional OCR for *handwritten* Indic scripts (as opposed to printed text, or as opposed to
handwritten Latin script) is meaningfully less mature and less reliable. A more promising v1
approach is routing the photo to a vision-capable multimodal model rather than a classical OCR
pipeline — modern multimodal LLMs handle messy multi-script handwriting noticeably better than
OCR engines tuned mostly for printed Latin text.

**Architectural implication, stated plainly:** unlike text content and audio — both static and
precomputable — this is inherently a live, per-request, unpredictable-input feature. It's the one
item on this whole roadmap that would actually require a real backend (or at minimum a serverless
function) to hold an API key safely, since a raw key can't ship inside a public open-source
client app. This should be gated behind "we already have a backend for other reasons," not become
the reason a backend gets built. Given the technical risk and cost-per-request (unlike the other
items, this one doesn't get cheaper with reuse), it's correctly the lowest-priority, most
speculative item here — no false confidence intended.

## 4. Other relevant possibilities worth noting

- **Community-recorded audio** — already on root `README.md`'s roadmap as a planned third
  contribution type (alongside transliteration/translation). Composes cleanly with TTS: TTS
  bootstraps full coverage immediately; community recordings can supersede specific segments over
  time as a "prefer community audio if present, fall back to TTS" layer, using the same
  content-hash-keyed caching either way.
- **Cross-chapter vocabulary glossary / spaced repetition** — also already on root `README.md`'s
  roadmap. The schema already has `vocabulary_term`/`vocabulary_definition` segment types ready
  to support flashcard-style review with no schema changes needed.
- **Web version** — `react-native-web` and `app.json`'s `"web": {"output": "static"}` are already
  in the stack (visible in `package.json` today). Enabling this later is largely "turn it on and
  verify," not new architecture — a cheap potential win once there's traction, distinct in effort
  from everything else in this doc.
- **Accessibility (font-size scaling, dyslexia-friendly font toggle)** — low effort, high value
  for a reading-focused app. The `Typography` token scale (`theme.ts`) already provides the seam:
  swap the active scale, no per-screen redesign needed.
