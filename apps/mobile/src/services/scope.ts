import type { Catalog } from './content-repository';

// Deliberately board/state/medium/grade only, no subject — those four are
// genuinely fixed per child (a kid doesn't switch board or grade day to
// day), but subject is the one axis where a family wants breadth (a Grade 5
// kid studies Kannada *and* English *and* Math). Subject stays a free list
// (see Home's "Subjects" section) rather than something scope narrows.
export type Scope = { board: string; state: string; medium: string; grade: number };

// Display labels for language/script codes — falls back to the raw code
// for anything not listed, so an unrecognized code still renders instead
// of disappearing.
const LANGUAGE_LABELS: Record<string, string> = { en: 'English' };
const SCRIPT_LABELS: Record<string, string> = { devanagari: 'Devanagari' };

export function labelForLanguage(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}

export function labelForScript(code: string): string {
  return SCRIPT_LABELS[code] ?? code;
}

/**
 * Fallback when nothing has been saved yet (see services/scope-storage.ts +
 * hooks/use-scope.ts) — every chapter in the catalog today shares one
 * board/state/medium/grade, so this is a reasonable default, not a guess.
 */
export function deriveScope(catalog: Catalog): Scope | null {
  const first = catalog.chapters[0];
  if (!first) return null;
  return { board: first.board, state: first.state, medium: first.medium, grade: first.grade };
}

export function scopesEqual(a: Scope | null, b: Scope | null): boolean {
  if (!a || !b) return a === b;
  return a.board === b.board && a.state === b.state && a.medium === b.medium && a.grade === b.grade;
}

/** Union of every `translations` code across the catalog — not scoped to one chapter yet. */
export function availableLanguages(catalog: Catalog): string[] {
  return Array.from(new Set(catalog.chapters.flatMap((c) => c.translations))).sort();
}

/** Union of every `transliterations` code across the catalog — not scoped to one chapter yet. */
export function availableScripts(catalog: Catalog): string[] {
  return Array.from(new Set(catalog.chapters.flatMap((c) => c.transliterations))).sort();
}
