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

/**
 * Extends a user's manual selections with any level that currently has
 * exactly one possible value — so "Explore" starts at the top of the real
 * hierarchy (board) and only ever asks the user to choose at a level that
 * actually has more than one option today. Every level in the real catalog
 * right now resolves to exactly one value except the final chapter list, so
 * this currently skips straight through to it — the moment a second board/
 * state/medium/grade/subject is added, a real picker appears at that level
 * automatically, with no screen rewrite.
 */
export function autoResolve(chapters: CatalogChapter[], manualSelected: LevelValue[]): LevelValue[] {
  const resolved = [...manualSelected];
  while (resolved.length < LEVEL_KEYS.length) {
    const options = optionsAtLevel(chapters, resolved, resolved.length);
    if (options.length !== 1) break;
    resolved.push(options[0]);
  }
  return resolved;
}
