import compatibility from '../../../../catalog-compatibility.json';

import type { Catalog, CatalogChapter, Chapter } from './content-repository';

type DiscoveryScope = {
  board: string;
  state: string;
  medium: string;
  grade: number;
  subject: string;
};

type DiscoveryAdoption = {
  board: string;
  state: string;
  sourceMedium: string;
  sourceSubject: string;
  learnerMedium: string;
  learnerSubject: string;
  gradeOffset: number;
};

function mappingFor(path: string) {
  return compatibility.chapters.find((mapping) => mapping.canonicalPath === path || mapping.legacyPath === path);
}

function matchesKnownScope(meta: DiscoveryScope): boolean {
  return [compatibility.canonicalScope, compatibility.legacyScope].some(
    (scope) =>
      meta.board === scope.board &&
      meta.state === scope.state &&
      meta.medium === scope.medium &&
      meta.grade === scope.grade &&
      meta.subject === scope.subject,
  );
}

function scopesEqual(a: DiscoveryScope, b: DiscoveryScope): boolean {
  return (
    a.board === b.board &&
    a.state === b.state &&
    a.medium === b.medium &&
    a.grade === b.grade &&
    a.subject === b.subject
  );
}

function pushUnique(scopes: DiscoveryScope[], next: DiscoveryScope) {
  if (!scopes.some((scope) => scopesEqual(scope, next))) scopes.push(next);
}

function chapterAsScope(chapter: CatalogChapter): DiscoveryScope {
  return {
    board: chapter.board,
    state: chapter.state,
    medium: chapter.medium,
    grade: chapter.grade,
    subject: chapter.subject,
  };
}

/** Pair Kannada FL grade N with English-medium learner grade N+offset (config-driven). */
const BUILTIN_DISCOVERY_ADOPTIONS: DiscoveryAdoption[] = [
  {
    board: 'KSEEB',
    state: 'Karnataka',
    sourceMedium: 'Kannada',
    sourceSubject: 'Kannada',
    learnerMedium: 'English',
    learnerSubject: 'Kannada',
    gradeOffset: 2,
  },
];

function discoveryAdoptionRules(): DiscoveryAdoption[] {
  // Always include the built-in KSEEB offset so a stale Metro cache of
  // catalog-compatibility.json (outside apps/mobile until watchFolders) cannot
  // drop English grades 3–10. JSON may add further rules later.
  const fromFile = (compatibility as { discoveryAdoptions?: DiscoveryAdoption[] }).discoveryAdoptions ?? [];
  const merged = [...BUILTIN_DISCOVERY_ADOPTIONS];
  for (const rule of fromFile) {
    const duplicate = merged.some(
      (existing) =>
        existing.board === rule.board &&
        existing.state === rule.state &&
        existing.sourceMedium === rule.sourceMedium &&
        existing.sourceSubject === rule.sourceSubject &&
        existing.learnerMedium === rule.learnerMedium &&
        existing.learnerSubject === rule.learnerSubject &&
        existing.gradeOffset === rule.gradeOffset,
    );
    if (!duplicate) merged.push(rule);
  }
  return merged;
}

function adoptionScopesFor(chapter: CatalogChapter): DiscoveryScope[] {
  const adopted: DiscoveryScope[] = [];
  for (const rule of discoveryAdoptionRules()) {
    if (
      chapter.board !== rule.board ||
      chapter.state !== rule.state ||
      chapter.medium !== rule.sourceMedium ||
      chapter.subject !== rule.sourceSubject
    ) {
      continue;
    }
    adopted.push({
      board: rule.board,
      state: rule.state,
      medium: rule.learnerMedium,
      grade: chapter.grade + rule.gradeOffset,
      subject: rule.learnerSubject,
    });
  }
  return adopted;
}

export function canonicalChapterPath(path: string): string {
  return mappingFor(path)?.canonicalPath ?? path;
}

export function normalizeChapter(chapter: Chapter, path: string): Chapter {
  const mapping = mappingFor(path);
  return mapping && chapter.meta.slug === mapping.slug && matchesKnownScope(chapter.meta)
    ? { ...chapter, meta: { ...chapter.meta, ...compatibility.canonicalScope } }
    : chapter;
}

export function normalizeCatalog(catalog: Catalog): Catalog {
  const chapters = new Map<string, CatalogChapter>();
  for (const chapter of catalog.chapters) {
    const mapping = mappingFor(chapter.path);
    if (!mapping || chapter.slug !== mapping.slug || !matchesKnownScope(chapter)) {
      chapters.set(chapter.path, chapter);
      continue;
    }
    const previous = chapters.get(mapping.canonicalPath);
    if (!previous || chapter.path === mapping.clientPath) {
      chapters.set(mapping.canonicalPath, { ...chapter, ...compatibility.canonicalScope });
    }
  }
  return {
    ...catalog,
    chapters: [...chapters.values()].sort(
      (first, second) =>
        first.board.localeCompare(second.board) ||
        first.state.localeCompare(second.state) ||
        first.medium.localeCompare(second.medium) ||
        first.grade - second.grade ||
        first.subject.localeCompare(second.subject) ||
        first.chapter - second.chapter,
    ),
  };
}

/**
 * Learner contexts where this chapter should appear in Explore / scope setup.
 * Includes the chapter's own scope, the bounded G3↔G5 path pairs, and config
 * discovery adoptions (Kannada FL grade N → English medium grade N+2).
 */
export function discoveryScopesFor(chapter: CatalogChapter): DiscoveryScope[] {
  const scopes: DiscoveryScope[] = [];
  const mapping = mappingFor(chapter.path);
  if (mapping?.slug === chapter.slug && matchesKnownScope(chapter)) {
    pushUnique(scopes, compatibility.canonicalScope);
    pushUnique(scopes, compatibility.legacyScope);
  } else {
    pushUnique(scopes, chapterAsScope(chapter));
  }
  for (const adopted of adoptionScopesFor(chapter)) {
    pushUnique(scopes, adopted);
  }
  return scopes;
}
