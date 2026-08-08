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

**Client-side staleness:** each chapter's `contentHash` in `api/contents.json` is what a local
cache compares against to know whether to re-download (see Downloads in `product-brief.md`); the
manifest itself now carries a `generatedAt` timestamp (`scripts/build_json.py`, only bumped when
the compiled output actually changes — not on every build invocation, so it stays meaningful as a
diff signal) for the catalog-level cache below.

**Implemented (basic):** `src/services/content-repository.ts`'s `CdnContentRepository` does the
actual `fetch()` against this URL scheme — `getCatalog()`/`getChapter(path)`. `src/services/config.ts`
points it at a local dev server instead of jsDelivr whenever `__DEV__` is true — see
`docs/local-dev-content-server.md` for why and how to run one. Reader and Exercises
(`src/hooks/use-chapter.ts`) are the first real consumers, replacing what used to be a direct
`import`-ed chapter JSON.

**Implemented (basic) — per-chapter download:** `src/services/downloads.ts` writes/reads chapter
JSON via SDK 57's `File`/`Directory` API (`expo-file-system`'s legacy `FileSystem.*Async`
functions moved to `expo-file-system/legacy` — see this file's AGENTS.md "Expo HAS CHANGED"
note) into `Paths.document/chapters/<slug>.json`. No separate manifest: the directory listing
*is* the "what's downloaded" answer (`listDownloadedSlugs()`), which is enough at this scale — a
manifest only earns its keep once download metadata (e.g. `downloadedAt`) is needed for its own
sake. `useChapter` (`src/hooks/use-chapter.ts`) checks a downloaded copy before hitting the
network, so a downloaded chapter genuinely reads offline. Group-level download ("download all" at
the resolved grade/subject list) and staleness re-sync via `contentHash` are still not built.

**Implemented (basic) — catalog cache-first at boot:** `src/services/catalog-store.ts` is the
single shared source every `useCatalog()` call reads from (`src/hooks/use-catalog.ts`, via
`useSyncExternalStore` — same cross-screen-consistency shape as `downloads.ts`), primed once at
launch (`primeCatalog()`, awaited in `app/_layout.tsx` alongside `applyDevSettingsOnLaunch()`,
before `ready` flips). A cached catalog (`src/services/catalog-cache.ts`, AsyncStorage) renders
immediately if one exists, while a fresh fetch runs in the background and only replaces it (and
re-persists) if `generatedAt` actually differs — so a real network round trip blocks the splash
screen only on the very first launch ever, before any cache exists; every launch after that is
instant. `Home`/`Explore`/`Library`/`Settings` no longer each fetch independently — they all read
this one primed value.

**Dev tooling — content-source override:** `src/services/dev-settings.ts` +
`src/app/dev-settings.tsx` (linked from Settings' "Developer" section, itself hidden outside
`__DEV__`) let a developer flip the active content source between the local server and jsDelivr
at runtime, persisted across restarts, without rebuilding. `CdnContentRepository.setBaseUrl()`
clears its in-memory fetch caches on switch, and `setDevContentSource()` calls
`catalog-store.ts`'s `forceCatalogRefresh()` so the switch is visible everywhere immediately —
necessary now that the catalog is a store primed once rather than refetched by each screen on
mount. Applied once at launch
(`app/_layout.tsx` awaits `applyDevSettingsOnLaunch()` before the first render) so it can't race
the first catalog fetch. This is also the seam future dev-only flags (e.g. skipping an onboarding
flow during testing, once one exists) are meant to extend, not a one-off.

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

**Implemented (basic) — deviates slightly from the plan above:** scope ended up on
`@react-native-async-storage/async-storage` directly (`src/services/scope-storage.ts` +
`src/hooks/use-scope.ts`) rather than `expo-sqlite/kv-store` — one small string key, not worth a
second storage dependency yet; downloads similarly skip a manifest store (see the download-layer
note above) and don't extend `ContentRepository`'s interface — they're a genuinely separate
concern (persisting a fetch result vs. how to fetch), kept as their own `downloads.ts` module
rather than folded into the fetch interface. `ProgressRepository` and `expo-sqlite/kv-store`
itself remain unbuilt, plan-only — except for one slice pulled forward early: Home's "continue
reading" card and Library's per-chapter status line used to read `catalog.chapters[0]` and a
fixed `{ segmentsRead: 5, segmentsTotal: 12 }` constant, which was fabricated data with no basis
in anything the user had actually done — a direct violation of this project's "never fabricate,
show 'not yet available' instead" rule. `src/services/reading-history.ts` (AsyncStorage,
`akshar:reading-history:default`) now records `{ path, openedAt }` when Reader actually finishes
loading a chapter (`app/reader.tsx`), and `src/hooks/use-reading-history.ts` exposes it via
`useFocusEffect` so Home/Library pick up a chapter opened in Reader on the way back, without
needing a synchronous shared store the way `downloads.ts` does. This is chapter-level only —
segment-level "N of M read" from the interface above still needs Reader to track which segments
were actually seen (scroll/viewport tracking), which is a bigger lift than this pass and stays
plan-only for now. When it's built, `reading-history.ts` should fold into the real
`ProgressRepository`/`LocalProgressRepository`, not stay a separate module.

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

## Loading states — skeletons, in-area/full-screen loaders, splash

Per `design/Akshar Mobile.dc.html`'s "Loading states" page: splash on cold start, skeletons for
first-load layout shape, and two loader treatments for in-page async waits — chosen per section
based on how much of the screen depends on the pending data.

**Implemented (basic):**
- **Skeleton (first load):** `src/components/skeleton.tsx` (`SkeletonBox`/`SkeletonLine`/
  `SkeletonCircle`) and one layout per screen in `src/components/skeletons/`, shown for
  `useAsyncResource`'s `loading` status in place of the old generic "Loading…" text (the error
  status still uses `AsyncStateView`, unchanged — the redesign didn't touch that state). Uses a
  pulsing opacity, not the design's gradient sweep — no `expo-linear-gradient` dependency needed
  just for a placeholder shape.
- **In-area loader:** already existed before this pass, just not named as such — Explore/
  Library's per-chapter download button swaps to an `ActivityIndicator` while
  `useDownloads().isPending(slug)` is true (`services/downloads.ts`/`hooks/use-downloads.ts`).
  Because the button itself is replaced rather than merely disabled, a second tap has nothing to
  land on.
- **Full-screen loader:** `src/components/loading-overlay.tsx`, used for Explore's "Download all"
  — a real gap this pass found: tapping it repeatedly while a batch was in flight could re-fire
  downloads for chapters whose fetch hadn't resolved yet (`notYetDownloaded` didn't check
  `isPending`). Fixed by excluding pending chapters from what "Download all" dispatches, plus a
  local `batchDownloading` flag that shows the overlay over the whole chapter-list section — no
  `expo-blur` dependency; a plain translucent scrim gets the same "you can't interact right now"
  read as the design's blurred one.
- **Splash:** `src/components/splash-view.tsx`, rendered by `app/_layout.tsx` for the same boot
  gate described in the content-delivery section above (`applyDevSettingsOnLaunch()`) — the native
  splash (`app.json`'s `expo-splash-screen` plugin, a static image) hides immediately on mount and
  hands off to this JS-rendered one, same background color (`Colors.light.tint`) so the swap is
  invisible, but capable of a live spinner for however long the boot check actually takes. Copy
  says "Learning app," not the design's literal "Homework helper..." — same substitution as
  Home's subtitle, and for the same reason (see `(tabs)/index.tsx`).

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
