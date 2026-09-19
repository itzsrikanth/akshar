# Privacy Policy — Akshar

**Effective date:** 2026-09-19

Akshar ("the app") is an open-source, free app that helps parents and children read and translate Indian school textbook content across scripts. This policy describes what data the app collects and how it's used. The app's full source code is public — every claim below can be verified directly against it (see the file references in each section).

## Summary

**Akshar does not create accounts and does not sell personal data.** Textbook content is fetched from a public CDN. Preferences, downloads, and reading history stay on your device. Production builds may send crash/error reports (and optional user-submitted feedback) to Sentry — see “Crash reporting” below.

## What the app does *not* do

- No account creation or sign-in of any kind.
- No collection of your name, email, phone number, or any other personal identifier.
- No location access.
- No camera or microphone access.
- No contacts access.
- No advertising, and no ad-tracking identifiers.
- No product-usage analytics (for example PostHog) in the current release.
- Crash reporting (Sentry) runs in **production builds only** — see "Crash reporting" below.

## What the app stores, and where

Everything below is stored **only on your device**, using standard on-device storage (`AsyncStorage` and the device's local filesystem) — never uploaded to any server:

| Data | Purpose | Source |
|---|---|---|
| Your selected board/state/medium/grade ("scope") | Remembers what to show by default on Home/Explore | `src/services/scope-storage.ts` |
| Downloaded chapter content | Lets you read chapters offline | `src/services/downloads.ts` |
| Which chapters you've opened, and when | Powers the "Continue reading" card | `src/services/reading-history.ts` |
| A cached copy of the content catalog | Faster app startup | `src/services/catalog-cache.ts` |

None of this data identifies you personally, none of it leaves your device, and none of it is accessible to the app's developer or anyone else. Uninstalling the app deletes all of it.

## Network requests the app makes

The app fetches textbook content (chapter text, translations, transliterations) from [jsDelivr](https://www.jsdelivr.com/), a public CDN serving this project's own public GitHub repository (`github.com/itzsrikanth/akshar`). These are plain content requests — no personal data, device identifiers, or account information is attached to them.

## Crash reporting

Production builds of the app send crash and error reports to [Sentry](https://sentry.io/) (`@sentry/react-native`, initialized in `src/services/crash-reporting.ts`). That data is used only to find and fix bugs — never for advertising or tracking.

What may be included in a crash/error report (typical Sentry mobile SDK fields):

- Error/crash details and stack traces
- App version and basic device/OS information
- Optional diagnostics such as breadcrumbs (recent screens/actions in the app)

What is **not** intentionally collected for crash reporting: your name or contact details, saved preferences as a profile, downloaded chapter text as a bulk upload, or advertising identifiers.

**Shake to report / “Report a problem”:** you can voluntarily open Sentry’s in-app feedback form (including an optional screenshot). If you attach a screenshot, it may show whatever is on screen at that moment (for example part of a textbook page). Submit only if you are comfortable sharing that image.

Crash reporting is **disabled in development builds** (`enabled: Boolean(dsn) && !__DEV__`) so local testing does not send events. Uninstalling the app removes on-device data; it does not delete reports already submitted to Sentry.

## Children's privacy

Akshar is built to be used by children doing schoolwork, typically alongside a parent. The app does not create accounts or profile children. Crash reports (production) and optional feedback you choose to send may include device/app technical details or a screenshot you attach — see “Crash reporting”. There is no advertising and no third-party analytics SDK in the current release.

## Future changes

This project's technical roadmap (`docs/tech-implementation.md`) lists one further optional addition not yet built: basic product-usage analytics (PostHog). If it's added in a future release, this policy will be updated first to disclose exactly what's collected and why, before that release ships.

## Open source

Akshar's complete source code, including everything described in this policy, is public at <https://github.com/itzsrikanth/akshar>. If you have questions about this policy or how the app works, please [open an issue on GitHub](https://github.com/itzsrikanth/akshar/issues).
