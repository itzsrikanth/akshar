// Sentry (see docs/tech-implementation.md's "Crash reporting" decision) — works across both
// iOS and Android through the same `@sentry/react-native` SDK, no per-platform code needed.
//
// `dsn` is intentionally empty until a real Sentry project exists (the plan is to apply for
// Sentry's open-source program once the app has real users — see the doc above). A DSN is
// client-side config, not a secret, so it's safe to commit here once one exists — same category
// as a Firebase apiKey, per AGENTS.md. Until then `enabled` stays false and this is a genuine
// no-op: no events are captured or sent anywhere.
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = (Constants.expoConfig?.extra?.sentryDsn as string | undefined) || '';

/** Call once, as early as possible — see app/_layout.tsx. */
export function initCrashReporting(): void {
  Sentry.init({
    dsn,
    // Off in dev even with a real DSN set — local development errors would just be noise
    // against the free/OSS tier's monthly event quota. Flip this if actively testing
    // symbolication/reporting itself.
    enabled: Boolean(dsn) && !__DEV__,
    debug: __DEV__,
    // Error/crash reporting only for now — no performance tracing wired up yet.
    tracesSampleRate: 0,
  });
}
