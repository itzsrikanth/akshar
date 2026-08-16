# Play Store Submission Readiness

Status: In progress — tracks what's done vs. still needed for a first Play Store submission.

## Done

- **App icon, adaptive icon, splash icon, favicon** — real Akshar brand assets (`assets/images/`),
  replacing the unmodified Expo template defaults. Built from a Gemini-generated glyph (the raw
  ~2MB source exports were removed afterward to keep repo size down — only the derived PNGs
  actually in use are committed) using ImageMagick: removed a stray generation artifact, rebuilt real alpha
  transparency for the Android layers (the raw Gemini "transparent" export was actually a
  baked-in checkerboard texture on an opaque background, not real transparency). Android adaptive
  foreground is scaled to fit Google's "safe zone" (center ~61% of the canvas) so it survives
  circular/squircle launcher masks without clipping. To regenerate from scratch later, the two
  Gemini prompts used are preserved in this conversation's history — re-run them and repeat the
  ImageMagick cleanup steps (sparkle removal, chroma-key transparency, safe-zone scaling).
- **`app.json` branding** — `name`/`slug` were still the Expo default `"mobile"`; now `"Akshar"` /
  `"akshar"`. `scheme` (deep link prefix) updated the same way, confirmed nothing in code
  referenced the old value. Removed `ios.icon`'s Icon Composer bundle (`assets/expo.icon/`) — an
  unbranded Expo template asset in a format ImageMagick can't produce; iOS now falls back to the
  same flat PNG as everything else.
- **Android adaptive icon contrast fix** — the background color was cream (`#FCEADD`) with a white
  glyph on top, which is nearly illegible (verified by compositing and masking to a circle, the
  worst-case launcher shape). Changed to the same terracotta as the main icon for real contrast.
- **Play Console store-listing assets** — `assets/images/play-store/icon-512.png` (512×512, the
  size Play Console wants for the listing itself, separate from the in-app launcher icon) and
  `assets/images/play-store/feature-graphic.png` (1024×500). The feature graphic uses only
  already-established copy (the "Learning app" tagline already used in-app) — it's a functional
  placeholder, not a finished marketing asset; swapping in a real screenshot-based version once
  the app has been used is worth doing later.
- **Privacy policy** — `apps/mobile/PRIVACY_POLICY.md`, publicly viewable on GitHub, linked from
  Settings → About. Play Console requires a privacy policy URL for every app regardless of
  whether it collects data.
- **In-app "About" section** (`app/settings.tsx`) — privacy policy link, source code link, real
  app version (read from `app.json` via `expo-constants`, not hardcoded).
- **`.gitignore`** — added a pattern for a Play Console service account key
  (`google-service-account*.json`) so it can't be accidentally committed once one exists (see
  below).
- **Version management** — already correctly configured before this pass: `eas.json`'s
  `appVersionSource: "remote"` + `production.autoIncrement: true` means EAS Build manages
  Android's `versionCode` automatically; nothing to add in `app.json` for that.

- **Screenshots** — `assets/images/play-store/screenshot-{1-home,2-reader,3-explore}.png`
  (1080×2160, cropped to satisfy Play Console's "max dimension ≤ 2× min dimension" rule — the
  emulator's native 1080×2280 is 2.11:1, just over the limit). Captured from a real run: an
  Android emulator (API 34, x86_64) provisioned on the dev VM, running the actual signed
  `production`-profile release build (converted from the submitted `.aab` via `bundletool`, not a
  separate debug build) — so these reflect real release behavior (jsDelivr content, no dev tools),
  not fabricated mockups.

## Still needed — can't be done from this repo alone
- **Google Play Console developer account** — a one-time $25 registration, done directly on Play
  Console, not from this repo.
- **Play Console service account key** — required for `eas submit` (already scaffolded in
  `eas.json`'s `submit.production`) to upload builds without manually using the Play Console
  UI each time. Generated from Google Cloud Console under the Play Console developer account;
  save it locally as `google-service-account.json` (matches the `.gitignore` pattern just added)
  and reference it from `eas submit`'s prompts — **never commit this file**, same rule as every
  other credential this project has avoided committing so far.
- **Content rating questionnaire** (Play Console) — answered directly in Play Console based on
  actual app behavior (no user-generated content, no violence, educational). One real decision
  point: whether to declare children as part of the target audience. Since the app collects zero
  data and has no ads/analytics active, either answer is compliant today — but if Sentry/GA4 (see
  `docs/tech-implementation.md`) are added later, a "children" target audience declaration adds
  real restrictions (e.g. limits on third-party SDKs) worth knowing about before choosing.
- **Data Safety form** (Play Console) — the answers are exactly what `PRIVACY_POLICY.md` already
  says: no data collected. Just needs transcribing into Play Console's specific form UI.
- **Store listing copy** — short description (≤80 chars) and full description (≤4000 chars).
  Not drafted yet; the root `README.md`'s existing description is the right source to adapt from
  rather than writing new copy from scratch.
- **App signing** — handled automatically by EAS Build's managed credentials by default; no local
  keystore needed unless that default is deliberately opted out of.
- **Recommended: submit to the "Internal testing" track first**, not production, for the first
  build — standard practice, not Akshar-specific.
