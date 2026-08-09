import type { CatalogChapter } from './content-repository';

// The catalog's real hierarchy, top to bottom — board is the outermost
// grouping (e.g. KSEEB), subject the innermost before individual chapters.
export const LEVEL_KEYS = ['board', 'state', 'medium', 'grade', 'subject'] as const;
export type LevelKey = (typeof LEVEL_KEYS)[number];
export type LevelValue = string | number;

export function levelName(key: LevelKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function levelLabel(key: LevelKey, value: LevelValue): string {
  return key === 'grade' ? `Grade ${value}` : String(value);
}

/** Chapters matching every selection made so far, in level order. */
export function filterChapters(chapters: CatalogChapter[], selected: LevelValue[]): CatalogChapter[] {
  return chapters.filter((c) => LEVEL_KEYS.every((key, i) => i >= selected.length || c[key] === selected[i]));
}

/** Every distinct value chapters-matching-`selected` have at `LEVEL_KEYS[levelIndex]`. */
export function optionsAtLevel(chapters: CatalogChapter[], selected: LevelValue[], levelIndex: number): LevelValue[] {
  const key = LEVEL_KEYS[levelIndex];
  return Array.from(new Set(filterChapters(chapters, selected).map((c) => c[key])));
}

// Auto-fills board/state/medium/grade (curriculum identity — usually one
// real value per family for a long time) but never subject: that's the
// actual content pick, and should always land on an explicit list to choose
// from, even while there's only one. Otherwise "Explore" would silently
// drop a first-time visitor straight into one subject's chapter list with
// no sense that subject was ever a choice.
const AUTO_FILL_LEVELS = LEVEL_KEYS.length - 1;

/**
 * Extends a user's manual selections with any level up to (not including)
 * subject that currently has exactly one possible value — so "Explore"
 * starts at the top of the real hierarchy (board) and only ever asks the
 * user to choose at a level that actually has more than one option today.
 * Every level up to grade in the real catalog right now resolves to exactly
 * one value, so this currently skips straight through to the subject list —
 * the moment a second board/state/medium/grade is added, a real picker
 * appears at that level automatically, with no screen rewrite.
 */
export function autoResolve(chapters: CatalogChapter[], manualSelected: LevelValue[]): LevelValue[] {
  const resolved = [...manualSelected];
  while (resolved.length < AUTO_FILL_LEVELS) {
    const options = optionsAtLevel(chapters, resolved, resolved.length);
    if (options.length !== 1) break;
    resolved.push(options[0]);
  }
  return resolved;
}
