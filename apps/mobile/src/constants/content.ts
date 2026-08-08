// Hardcoded until a real scope/progress layer exists (see
// docs/tech-implementation.md's ProgressRepository plan) — Home, Reader,
// and Exercises all point at the same one chapter that has real
// translation/transliteration coverage today.
export const DEFAULT_CHAPTER_PATH = 'KSEEB/Karnataka/English/Grade5/Kannada/ch01-bannada-tagadina.json';

// Placeholder "downloaded" state, shared by Home/Library/Explore so they
// agree with each other — there's no download layer yet (see
// docs/tech-implementation.md), so nothing is really downloaded. This is
// the one chapter that's ever been shown as "downloaded" in the Claude
// Design source, kept as a single source of truth rather than each screen
// guessing independently.
export const DOWNLOADED_SLUGS: readonly string[] = ['ch01-bannada-tagadina'];
