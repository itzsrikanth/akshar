import type { V2Adoption, V2Catalog, V2CatalogChapter, V2Selection } from './types';

export type AdoptionOption = {
  adoption: V2Adoption;
  bookTitle: string;
  editionLabel: string;
  /** Short learner-facing label, e.g. "Grade 3 · First language · Kannada medium". */
  displayLabel: string;
  chapterCount: number;
};

function roleLabel(role: V2Adoption['languageRole']): string {
  switch (role) {
    case 'first-language':
      return 'First language';
    case 'second-language':
      return 'Second language';
    case 'third-language':
      return 'Third language';
  }
}

export function adoptionDisplayLabel(adoption: V2Adoption): string {
  const parts = [`Grade ${adoption.learnerGrade}`, roleLabel(adoption.languageRole)];
  if (adoption.schoolMedium) parts.push(`${adoption.schoolMedium} medium`);
  return parts.join(' · ');
}

/** Published (non-held) chapters for an adoption's book/edition. */
export function chaptersForAdoption(catalog: V2Catalog, selection: Pick<V2Selection, 'bookId' | 'editionId'>): V2CatalogChapter[] {
  return catalog.chapters
    .filter((c) => c.bookId === selection.bookId && c.editionId === selection.editionId)
    .sort((a, b) => a.number - b.number);
}

export function listAdoptionOptions(catalog: V2Catalog): AdoptionOption[] {
  return catalog.adoptions
    .map((adoption) => {
      const book = catalog.books.find((b) => b.id === adoption.bookId);
      const edition = catalog.editions.find((e) => e.bookId === adoption.bookId && e.id === adoption.editionId);
      const chapters = chaptersForAdoption(catalog, adoption);
      return {
        adoption,
        bookTitle: book?.title ?? adoption.bookId,
        editionLabel: edition?.label ?? adoption.editionId,
        displayLabel: adoptionDisplayLabel(adoption),
        chapterCount: chapters.length,
      };
    })
    .filter((option) => option.chapterCount > 0)
    .sort((a, b) => a.adoption.learnerGrade - b.adoption.learnerGrade || a.adoption.id.localeCompare(b.adoption.id));
}

export function findAdoptionOption(catalog: V2Catalog, adoptionId: string): AdoptionOption | undefined {
  return listAdoptionOptions(catalog).find((option) => option.adoption.id === adoptionId);
}

export function selectionFromAdoption(adoption: V2Adoption): V2Selection {
  return {
    adoptionId: adoption.id,
    bookId: adoption.bookId,
    editionId: adoption.editionId,
  };
}
