# Akshar — mobile app

React Native / Expo app for the [Akshar](../../README.md) content repo — per-line source text,
transliteration, and translation for Indian school textbook chapters, so a parent who can't read
their child's textbook script can still help with homework.

## Get started

1. Install dependencies (from the repo root, this is a workspace):

   ```bash
   npm install
   ```

2. Start the local content server (repo root, separate terminal) — the app reads chapter content
   from this in dev rather than the production CDN, so content edits show up instantly:

   ```bash
   npm run content-server
   ```

   See [`docs/local-dev-content-server.md`](docs/local-dev-content-server.md) for what this is,
   why it exists, and how to reach it if the app isn't running on this same machine (Simulator on
   a separate Mac, a physical device, etc. — it's a local SSH port forward, not a reverse one).

3. Start Metro (from `apps/mobile`):

   ```bash
   npx expo start
   ```

   Open in a [development build](https://docs.expo.dev/develop/development-builds/introduction/),
   [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), or
   [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/). Plain Expo Go won't work here —
   this project uses native modules (`@expo/ui`, `expo-router`'s native tabs) that aren't in the
   Expo Go sandbox.

## Docs

Decisions and architecture live in [`docs/`](docs/), not scattered in code comments:

- [`product-brief.md`](docs/product-brief.md) — what this app is, for whom, and why
- [`theme.md`](docs/theme.md) / [`iconography.md`](docs/iconography.md) — design tokens, icon set
- [`tech-implementation.md`](docs/tech-implementation.md) — content delivery, the no-backend
  repository pattern, component architecture, crash reporting/analytics choices
- [`local-dev-content-server.md`](docs/local-dev-content-server.md) — the dev content server above
- [`roadmap.md`](docs/roadmap.md) — future scope (multi-kid, audio, interactive exercises, AI
  grading), deliberately not built until the core reading experience has real usage

## Learn more about Expo

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) — this project uses file-based routing
