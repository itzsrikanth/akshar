import compatibility from '../../../../catalog-compatibility.json';

import type { Catalog, CatalogChapter, Chapter } from './content-repository';

function mappingFor(path: string) {
  return compatibility.chapters.find((mapping) => mapping.canonicalPath === path || mapping.legacyPath === path);
}

function matchesKnownScope(meta: typeof compatibility.canonicalScope): boolean {
  return [compatibility.canonicalScope, compatibility.legacyScope].some((scope) =>
    meta.board === scope.board && meta.state === scope.state && meta.medium === scope.medium &&
    meta.grade === scope.grade && meta.subject === scope.subject);
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
    chapters: [...chapters.values()].sort((first, second) =>
      first.board.localeCompare(second.board) || first.state.localeCompare(second.state) ||
      first.medium.localeCompare(second.medium) || first.grade - second.grade ||
      first.subject.localeCompare(second.subject) || first.chapter - second.chapter),
  };
}

export function matchesLegacyScope(chapter: CatalogChapter, selected: (string | number)[]): boolean {
  const legacy = compatibility.legacyScope;
  const mapping = mappingFor(chapter.path);
  return selected.length >= 4 && selected[0] === legacy.board && selected[1] === legacy.state &&
    selected[2] === legacy.medium && selected[3] === legacy.grade &&
    (selected.length === 4 || selected[4] === legacy.subject) && mapping?.slug === chapter.slug && matchesKnownScope(chapter);
}
