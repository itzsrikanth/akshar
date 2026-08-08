import type { Catalog } from './content-repository';

export type Scope = { board: string; state: string; medium: string; grade: number; subject: string };

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
 * Every chapter in the catalog today shares one board/state/medium/grade/
 * subject — "the current scope" is just the first chapter's, until a real
 * multi-scope picker exists (see docs/product-brief.md's scoping model and
 * docs/roadmap.md's multi-kid item). Not fabricated: this genuinely is the
 * one scope present in the real catalog right now.
 */
export function deriveScope(catalog: Catalog): Scope | null {
  const first = catalog.chapters[0];
  if (!first) return null;
  return { board: first.board, state: first.state, medium: first.medium, grade: first.grade, subject: first.subject };
}

/** Union of every `translations` code across the catalog — not scoped to one chapter yet. */
export function availableLanguages(catalog: Catalog): string[] {
  return Array.from(new Set(catalog.chapters.flatMap((c) => c.translations))).sort();
}

/** Union of every `transliterations` code across the catalog — not scoped to one chapter yet. */
export function availableScripts(catalog: Catalog): string[] {
  return Array.from(new Set(catalog.chapters.flatMap((c) => c.transliterations))).sort();
}
