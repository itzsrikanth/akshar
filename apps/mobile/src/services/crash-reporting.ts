// Sentry (see docs/tech-implementation.md's "Crash reporting" decision) — works across both
// iOS and Android through the same `@sentry/react-native` SDK, no per-platform code needed.
//
// The DSN below is real client-side config (not a secret — same category as a Firebase apiKey,
// per AGENTS.md), populated once the akshar Sentry project existed. `enabled` stays false in
// dev so local development errors don't burn the free/OSS tier's monthly event quota.
//
// This only captures unhandled JS errors and native crashes — there's no general telemetry and
// no way (yet) for a user to report something that's wrong but doesn't crash. That's what
// `feedbackIntegration` below adds: shaking the device (or calling `openFeedbackForm()` from
// anywhere, e.g. Settings' "Report a problem") pops Sentry's built-in feedback form, optionally
// with a screenshot attached, and submits straight to the same Sentry project.
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = (Constants.expoConfig?.extra?.sentryDsn as string | undefined) || '';

/** Call once, as early as possible — see app/_layout.tsx. */
export function initCrashReporting(): void {
  Sentry.init({
    dsn,
    enabled: Boolean(dsn) && !__DEV__,
    debug: __DEV__,
    // Error/crash reporting only for now — no performance tracing wired up yet.
    tracesSampleRate: 0,
    integrations: [
      Sentry.feedbackIntegration({
        enableScreenshot: true,
        enableTakeScreenshot: true,
        enableShakeToReport: true,
      }),
    ],
  });
}

/** Shared entry point for every feedback trigger — shake, a Settings button, anything added
 *  later — so changing how feedback is invoked never touches capture/submit logic. */
export function openFeedbackForm(): void {
  Sentry.showFeedbackForm();
}
