# Privacy Policy — Akshar

**Effective date:** 2026-08-08

Akshar ("the app") is an open-source, free app that helps parents and children read and
translate Indian school textbook content across scripts. This policy describes what data the
app collects and how it's used. The app's full source code is public — every claim below can be
verified directly against it (see the file references in each section).

## Summary

**Akshar does not collect, store, or transmit any personal data.** There is no account, no
sign-in, and no backend server that receives data from your device. Everything the app
remembers about you (your saved scope, downloaded chapters, reading history) stays on your
device, in your device's local storage, and is never sent anywhere.

## What the app does *not* do

- No account creation or sign-in of any kind.
- No collection of your name, email, phone number, or any other personal identifier.
- No location access.
- No camera or microphone access.
- No contacts access.
- No advertising, and no ad-tracking identifiers.
- No analytics or crash-reporting is active in the current version (see "Future changes" below).

## What the app stores, and where

Everything below is stored **only on your device**, using standard on-device storage
(`AsyncStorage` and the device's local filesystem) — never uploaded to any server:

| Data | Purpose | Source |
|---|---|---|
| Your selected board/state/medium/grade ("scope") | Remembers what to show by default on Home/Library | `src/services/scope-storage.ts` |
| Downloaded chapter content | Lets you read chapters offline | `src/services/downloads.ts` |
| Which chapters you've opened, and when | Powers the "Continue reading" card | `src/services/reading-history.ts` |
| A cached copy of the content catalog | Faster app startup | `src/services/catalog-cache.ts` |

None of this data identifies you personally, none of it leaves your device, and none of it is
accessible to the app's developer or anyone else. Uninstalling the app deletes all of it.

## Network requests the app makes

The app fetches textbook content (chapter text, translations, transliterations) from
[jsDelivr](https://www.jsdelivr.com/), a public CDN serving this project's own public GitHub
repository (`github.com/itzsrikanth/akshar`). These are plain content requests — no personal
data, device identifiers, or account information is attached to them.

## Children's privacy

Akshar is built to be used by children doing schoolwork, typically alongside a parent. Because
the app collects no personal data from anyone — child or adult — there is nothing to disclose
under children's privacy regulations (e.g. COPPA). No data about a child (or anyone) is ever
collected, stored remotely, or shared.

## Future changes

This project's technical roadmap (`docs/tech-implementation.md`) lists optional future
additions — crash reporting (Sentry) and basic usage analytics (Google Analytics) — that are
**not implemented in the current version of the app**. If either is added in a future release,
this policy will be updated first to disclose exactly what's collected and why, before that
release ships.

## Open source

Akshar's complete source code, including everything described in this policy, is public at
<https://github.com/itzsrikanth/akshar>. If you have questions about this policy or how the app
works, please [open an issue on GitHub](https://github.com/itzsrikanth/akshar/issues).
