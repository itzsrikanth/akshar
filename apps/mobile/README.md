# Akshar — mobile app

React Native / Expo app for the [Akshar](../../README.md) content repo — per-line source text, transliteration, and translation for Indian school textbook chapters, so a parent who can't read their child's textbook script can still help with homework.

## Get started

1. Install dependencies (from the repo root, this is a workspace):

   ```bash
   npm install
   ```

2. Start the local content server (repo root, separate terminal) — the app reads chapter content from this in dev rather than the production CDN, so content edits show up instantly:

   ```bash
   npm run content-server
   ```

   See [`docs/local-dev-content-server.md`](docs/local-dev-content-server.md) for what this is, why it exists, and how to reach it if the app isn't running on this same machine (Simulator on a separate Mac, a physical device, etc. — it's a local SSH port forward, not a reverse one).

3. Build and install the native development app once. For iOS, install Xcode with an iOS Simulator runtime and a working CocoaPods CLI (`pod --version` must succeed). On a Mac using Homebrew, install CocoaPods with `brew install cocoapods`. Starting from the repository root:

   ```bash
   cd apps/mobile
   npm run ios
   ```

   For an Android emulator, use `npm run android` instead. These commands build and install the app and start Metro. Rebuild after changing native dependencies or config plugins; starting Metro alone cannot install a missing development build.

4. For subsequent JavaScript/TypeScript-only development, start Metro from `apps/mobile` and press `i` for the iOS Simulator or `a` for Android:

   ```bash
   npm run start
   ```

   Open in a [development build](https://docs.expo.dev/develop/development-builds/introduction/), [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), or [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/). Plain Expo Go won't work here — this project uses native modules (`@expo/ui`, `expo-router`'s native tabs) that aren't in the Expo Go sandbox. Keep the local content server running in its separate terminal.

### Local toolchain troubleshooting

Check `command -v node npm pod` if installation or builds fail before compiling app code. A managed Volta launcher or a corporate `pod` wrapper can shadow working installations. Prefer fixing the shell's toolchain configuration rather than changing app dependencies or committing machine-specific executable paths.

On the current Apple Silicon development machine, the following session-only PATH override selects the installed Node 24.15.0 and Homebrew CocoaPods instead of the failing wrappers (adjust the Node version/path for another machine):

```sh
export PATH="$HOME/.volta/tools/image/node/24.15.0/bin:/opt/homebrew/bin:$PATH"
node --version
npm --version
pod --version
```

If Xcode reports that the CocoaPods sandbox is not in sync with `Podfile.lock` after a failed pod installation, resolve the CocoaPods/toolchain error first, then run `pod install` from `apps/mobile/ios` and retry `npm run ios` from `apps/mobile`. Do not remove Xcode's manifest check or edit generated native files to hide the failure.

The iOS autolinking configuration in `package.json` builds `expo-file-system` from source. With the currently locked Expo 57 packages, its precompiled framework references `ExpoModulesCore.BaseModule.willDestroy`, which the installed core framework does not export; Xcode builds successfully but the app exits at launch with a `dyld` missing-symbol error. The targeted source-build setting avoids that binary mismatch while retaining precompiled modules elsewhere and leaving Android unchanged. Revisit this workaround when upgrading Expo and verify an actual simulator launch, not just a successful build.

## Resetting local app data

In a development build, open **Settings → Developer → Reset local data and restart**. Confirm the destructive action to remove all AsyncStorage data (onboarding completion, scope, reading preferences, font size, history, catalog cache, and developer settings) and all downloaded chapter files, then reload the app. Late catalog/history/download work cannot repopulate storage while the reset is in progress. Other apps, repository files, OS permissions, and native SDK/Metro caches are not erased; this resets Akshar's learner/content state, not the entire simulator. New persistent storage features must be included in this reset path.

Keep Metro and the local content server running: resetting removes the CDN override and restores the local content-source default. Onboarding appears once the app has fetched a usable catalog. If the server is unavailable, the app shows its normal content error state instead; restore the server and reload. If clearing data fails, retry from the reset screen; if automatic restart fails, reload from Metro or fully close and reopen the app.

Expo's normal Reload/Fast Refresh does not clear saved app data. `npx expo start --clear` resets Metro's bundler cache, not onboarding/preferences/downloads. You do not need to uninstall the app or erase the simulator to use this app-specific reset. The reset route and service are guarded by `__DEV__` and are unavailable in release builds.

## Docs

Decisions and architecture live in [`docs/`](docs/), not scattered in code comments:

- [`product-brief.md`](docs/product-brief.md) — what this app is, for whom, and why
- [`theme.md`](docs/theme.md) / [`iconography.md`](docs/iconography.md) — design tokens, icon set
- [`tech-implementation.md`](docs/tech-implementation.md) — content delivery, the no-backend repository pattern, component architecture, crash reporting/analytics choices
- [`local-dev-content-server.md`](docs/local-dev-content-server.md) — the dev content server above
- [`roadmap.md`](docs/roadmap.md) — future scope (multi-kid, audio, interactive exercises, AI grading), deliberately not built until the core reading experience has real usage
- [`user-feedback.md`](docs/user-feedback.md) — a running log of real feedback from testers/users, kept separate from the maintainer's own speculative planning in `roadmap.md`

## Learn more about Expo

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) — this project uses file-based routing
