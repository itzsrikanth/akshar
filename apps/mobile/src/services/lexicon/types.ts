/** Compiled lexicon bundle (api/v2/lexicons/<lang>.json). */

export type LexiconFormStatus = 'exact' | 'reviewed-inflection' | 'ambiguous';

export type LexiconLemma = {
  id: string;
  lemma: string;
  transliteration?: string;
  glosses?: Record<string, string>;
  notes?: string;
  sourceRefs?: Array<{
    bookId: string;
    editionId: string;
    chapterId: string;
    segmentId: string;
  }>;
};

export type LexiconForm = {
  form: string;
  lemmaIds: string[];
  status: LexiconFormStatus;
};

export type LexiconBundle = {
  schemaVersion: number;
  language: string;
  license: string;
  provenance: string;
  contentHash?: string;
  functionWords: string[];
  lemmas: Record<string, LexiconLemma>;
  forms: Record<string, LexiconForm>;
};

export type ChapterVocabPair = {
  term: string;
  definitionKn: string;
  glosses?: Record<string, string>;
  transliteration?: string;
};

export type MeaningKind = 'function' | 'matched' | 'unavailable';

export type MeaningResult = {
  kind: MeaningKind;
  selectedForm: string;
  lemma?: string;
  transliteration?: string;
  gloss?: string;
  glossLanguage?: string;
  notes?: string;
  ambiguous?: boolean;
  status?: LexiconFormStatus;
};

export function isLexiconBundle(value: unknown): value is LexiconBundle {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === 1 &&
    typeof record.language === 'string' &&
    typeof record.license === 'string' &&
    typeof record.provenance === 'string' &&
    Array.isArray(record.functionWords) &&
    record.lemmas != null &&
    typeof record.lemmas === 'object' &&
    record.forms != null &&
    typeof record.forms === 'object'
  );
}
