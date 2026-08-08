# Tech Implementation Guidelines

Status: Proposed

Unlike `theme.md`/`iconography.md`/`product-brief.md`, this doc introduces real third-party
vendor dependencies (crash reporting, analytics) and isn't wired into code yet — it's the plan,
not yet the implementation. Content delivery (jsDelivr) and the no-backend architecture pattern
*are* structural decisions already in effect / to apply going forward regardless of vendor choice.

## Content delivery — jsDelivr CDN over the repo's `api/`

Already the plan per the root README; this section is the actual mechanics.

**URL scheme:** `https://cdn.jsdelivr.net/gh/{owner}/{repo}@main/api/{path}` — e.g.
`.../akshar@main/api/contents.json`.

**Why `@main`, not a pinned tag/commit:** jsDelivr caches tag/commit-pinned URLs indefinitely
(immutable, great for CDN efficiency) but branch-pinned URLs (`@main`) only refresh on jsDelivr's
edge roughly every 12 hours, or on-demand via their purge API. Content here changes via
community PRs at unpredictable intervals — requiring a tag+release for every merged chapter
would add real friction to the exact "no coding knowledge required" contribution path
`CONTRIBUTING.md` is built around. `@main` with occasional purge-triggered freshness is the
better trade for this project's actual update cadence.

**Closing the 12-hour gap:** add a GitHub Action, triggered on push to `main` when `api/**`
changes, that calls jsDelivr's purge endpoint (`POST https://purge.jsdelivr.net/gh/{owner}/{repo}@main/api/contents.json`
plus any changed chapter paths) so merged content is live on the CDN within seconds, not hours.
Not yet built — flagged here so it isn't lost.

**Fallback:** `raw.githubusercontent.com` as a manual, non-cached fallback if jsDelivr has an
outage. Not proactive failover in the client (adds complexity for a rare case) — just documented
so it's known if jsDelivr ever needs bypassing.

**Client-side staleness:** already solved — each chapter's `contentHash` in `api/contents.json`
is exactly what a local cache should compare against to know whether to re-download (see
Downloads in `product-brief.md`).

**Implemented (basic):** `src/services/content-repository.ts`'s `CdnContentRepository` does the
actual `fetch()` against this URL scheme — `getCatalog()`/`getChapter(path)`, no persistence yet
(that's the download layer above, still just a plan). `src/services/config.ts` points it at a
local dev server instead of jsDelivr whenever `__DEV__` is true — see
`docs/local-dev-content-server.md` for why and how to run one. Reader and Exercises
(`src/hooks/use-chapter.ts`) are the first real consumers, replacing what used to be a direct
`import`-ed chapter JSON.

## No-backend architecture — repository pattern

There is no backend today, and the plan (per `product-brief.md`'s download model) is for one to
exist eventually. The rule: **screens never call `fetch()`, AsyncStorage, or any storage/network
API directly.** They depend only on an interface; a concrete implementation is bound once, in one
place. Swapping local-only for backend-backed later means writing a new class, not touching
screens.

```ts
// src/services/content-repository.ts
export interface ContentRepository {
  getCatalog(): Promise<Catalog>;
  getChapter(path: string): Promise<Chapter>;
  downloadChapter(path: string): Promise<void>;
  downloadGroup(scope: { grade?: number; subject?: string }): Promise<void>;
  deleteChapter(path: string): Promise<void>;
  listDownloaded(): Promise<DownloadedChapter[]>; // includes contentHash, downloadedAt
}

// src/services/progress-repository.ts
export interface ProgressRepository {
  getScope(): Promise<UserScope | null>;
  setScope(scope: UserScope): Promise<void>;
  getRecentProgress(): Promise<ChapterProgress[]>;
  recordSegmentRead(chapterPath: string, segmentId: string): Promise<void>;
}
```

**v1 implementations (no backend):**
- `CdnContentRepository implements ContentRepository` — reads from jsDelivr; downloaded chapter
  JSON is cached to disk via `expo-file-system`; the downloaded-chapter manifest (path,
  `contentHash`, `downloadedAt`) lives in `expo-sqlite/kv-store` (see Local storage below).
- `LocalProgressRepository implements ProgressRepository` — scope and progress also in
  `expo-sqlite/kv-store`. Nothing here needs to be relational yet — it's a few small structured
  keys, not a query workload.

**Wiring:** one file, `src/services/index.ts`, constructs and exports the active implementations:

```ts
export const contentRepository: ContentRepository = new CdnContentRepository();
export const progressRepository: ProgressRepository = new LocalProgressRepository();
```

Screens import `contentRepository`/`progressRepository` from `@/services`, never the concrete
classes. When a real backend exists, add `BackendContentRepository implements ContentRepository`
and change what `src/services/index.ts` constructs — nothing else moves. The same pattern covers
the "sync progress to a backend later" story: `ProgressRepository`'s interface doesn't change,
only whether `setScope`/`recordSegmentRead` also push to a server.

**Why not SQLite for everything:** `expo-sqlite/kv-store` (Expo SDK 52+, first-party, ships with
`expo-sqlite`, drop-in `AsyncStorage`-shaped API backed by SQLite for speed) covers scope,
progress, and the downloaded-chapter manifest — all small, key-shaped state. Reach for a real
SQLite schema only if that stops being true (e.g. cross-chapter progress queries that need real
joins) — no need to build that structure speculatively now.

## Component architecture — feature modules, not Atomic Design

**Decision: not Atomic Design.** Atomic Design's five-tier taxonomy (atoms/molecules/organisms/
templates/pages) was built for CSS-driven design systems with a large, stable shared vocabulary of
primitives. This app's primitives are already covered by three small files
(`themed-text.tsx`/`themed-view.tsx`/`theme.ts`) — there isn't enough primitive surface area to
justify sorting components into five folders by abstractness, and forcing every new component
through that taxonomy (is a Q&A block a molecule or an organism?) is overhead with no real payoff
here.

**What's used instead: feature-scoped module folders, each self-contained and swappable.**
`src/components/exercises/` is the concrete example (added alongside the Reader/Exercises
screens):

```
src/components/exercises/
  types.ts                    — plain item shapes (AnswerItem, FillBlankItem, MatchItem, ...),
                                 deliberately NOT the raw schema Segment type
  registry.ts                 — [{ id, label }, ...] — the pill list, and the thing a new
                                 exercise type gets added to
  empty-exercise-state.tsx    — shared "no items of this type yet" state
  answer-exercise.tsx         — "Answer the following"
  fill-blank-exercise.tsx     — "Fill in the blanks"
  match-exercise.tsx          — "Match the following"
  true-false-exercise.tsx     — "True or False"
  reasons-exercise.tsx        — "Give reasons"
```

Each `*-exercise.tsx` component takes a typed `items: T[]` prop and renders read-only — no
knowledge of `ref`/`exercise`/the source JSON shape at all. The screen (`app/exercises.tsx`) is
the only place that knows how to turn real chapter segments into `AnswerItem[]` etc. This split is
what makes "extensible and self-dependent" concrete: **adding a 6th exercise type is one new
component file + one entry in `registry.ts` + one data-building branch on the screen — nothing
existing gets touched.** It's also what makes these components reusable for a future
from-scratch assessment page whose content doesn't come from a chapter's source JSON at all (see
`roadmap.md`'s interactive-exercises item) — they were never coupled to that source in the first
place.

**Validation, when that gets built:** objective types (answer/fill-blank/match/true-false) can be
checked client-side — exact or fuzzy string match against the reference answer, no network call.
"Give reasons" is inherently subjective (a written explanation, not a fixed string) and needs an
LLM call to grade — same architectural shape as
[handwritten homework recognition](roadmap.md#3-handwritten-homework-recognition): a live,
per-request AI call that can't safely hold an API key in a public client app, so it's gated behind
"a backend/serverless function already exists for other reasons," not a reason to build one. See
`roadmap.md` for both.

## Crash reporting

| Option | Notes |
|---|---|
| **Sentry** | Official `@sentry/react-native` + Expo config plugin. Free tier (5k errors/mo), explicit OSS program with higher limits for qualifying open-source projects. Self-hostable later if full data control ever matters. Readable stack traces from RN's minified bundles via source maps. |
| Firebase Crashlytics | Free, unlimited volume, but pulls in a Firebase project as a dependency and has no self-host path — less portable, less aligned with an open-source, vendor-independent posture. |
| Bugsnag | Solid RN support, but no free tier suited to a solo/OSS project. |

**Decision: Sentry.** Apply for its open-source program once the app has real users. Not wired
into code yet — this is the pick, implementation is a separate step.

## Analytics, feature flags, and A/B testing

These three are one decision, not three, because one tool should cover all of them for a solo
dev — running separate analytics, flag, and experiment vendors is unnecessary tool sprawl at
this scale.

| Option | Notes |
|---|---|
| **PostHog** | Open-source (self-hostable later), generous free tier (1M events/mo on cloud), EU hosting region available. Bundles product analytics, feature flags, *and* A/B testing/experiments in one dashboard and one SDK. |
| Firebase Analytics + Remote Config | Free, but splits analytics and experiments across separate Firebase products, and adds the same Firebase-lock-in tradeoff as Crashlytics above. |
| Amplitude / Mixpanel | Strong product analytics, but no bundled experimentation tier at the free level — would still need a second tool for A/B testing. |

**Decision: PostHog**, for analytics, feature flags, and A/B testing together.

**Privacy stance — not just a tool choice.** This app's users are parents and children; India's
DPDP Act has specific provisions for children's personal data (parental-consent requirements).
Track aggregate product usage (screen views, download/read events, experiment exposure) — never
anything identifying a specific child, and no free-text or content-derived fields that could
leak into an event. This is a guideline for *whatever* analytics gets sent, not a PostHog-specific
setting.

## Environment/config

Sentry DSN and PostHog API key are both client-side config, not secrets — safe to commit per
`AGENTS.md`'s existing rule (same category as a Firebase `apiKey` or Sentry DSN, explicitly
called out there already). No `.env` secret-handling story needed for either.

## Explicitly out of scope for this doc

- Actually installing/wiring Sentry or PostHog SDKs — a follow-up implementation step.
- The jsDelivr-purge GitHub Action — noted above, not yet built.
- A real backend — this whole doc's premise is deferring it; revisit when one is actually being
  built, using the repository interfaces above as the seam.
