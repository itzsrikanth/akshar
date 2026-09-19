// jsDelivr serves raw files straight from the public GitHub repo — no
// server, no auth, no rate-limited key (see docs/tech-implementation.md).
// The catch: jsDelivr caches a branch alias like `@main` for hours, which
// makes it painful to iterate against while actively editing content. In
// dev, point at a local static server instead — see the repo root
// package.json's "content-server" script (`python3 -m http.server`, no new
// dependency) and docs/local-dev-content-server.md for how to reach it from
// a device/Simulator that isn't running on this same machine.
export const CONTENT_SOURCES = {
  local: 'http://localhost:8787',
  cdn: 'https://cdn.jsdelivr.net/gh/itzsrikanth/akshar@main',
} as const;
export type ContentSourceId = keyof typeof CONTENT_SOURCES;

export const CONTENT_BASE_URL = __DEV__ ? CONTENT_SOURCES.local : CONTENT_SOURCES.cdn;

export const MEDIA_HEALTH_URL = process.env.EXPO_PUBLIC_MEDIA_HEALTH_URL?.trim() || undefined;

/**
 * Public origin for media objects (no trailing slash), e.g. https://pub-….r2.dev.
 * Used when real per-segment clips are published; sample mode uses a bundled clip.
 */
export const MEDIA_BASE_URL = process.env.EXPO_PUBLIC_MEDIA_BASE_URL?.trim().replace(/\/$/, '') || undefined;

/**
 * When true, speakable reader lines play a bundled placeholder m4a so playback UI
 * can be tested before TTS generation. Turn off once real manifests/assets exist.
 */
export const MEDIA_SAMPLE_MODE =
  (process.env.EXPO_PUBLIC_MEDIA_SAMPLE_MODE ?? (__DEV__ ? '1' : '0')).trim() === '1';

