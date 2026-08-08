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
