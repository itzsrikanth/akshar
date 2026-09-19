import { normalizeLookupForm } from './tokenize';
import type { ChapterVocabPair, LexiconBundle, MeaningResult } from './types';

function pickGloss(
  glosses: Record<string, string> | undefined,
  preferredLanguage: string | null,
): { gloss: string; language: string } | null {
  if (!glosses) return null;
  if (preferredLanguage && glosses[preferredLanguage]) {
    return { gloss: glosses[preferredLanguage], language: preferredLanguage };
  }
  for (const lang of ['en', 'hi', 'kn']) {
    if (glosses[lang]) return { gloss: glosses[lang], language: lang };
  }
  const first = Object.entries(glosses)[0];
  return first ? { gloss: first[1], language: first[0] } : null;
}

/**
 * Resolve one surface form. Order: function word → lexicon form → chapter vocab → unavailable.
 */
export function resolveMeaning(
  rawForm: string,
  bundle: LexiconBundle | null,
  chapterVocab: ChapterVocabPair[],
  preferredLanguage: string | null,
): MeaningResult {
  const selectedForm = normalizeLookupForm(rawForm);
  if (!selectedForm) {
    return { kind: 'unavailable', selectedForm: rawForm };
  }

  const functionSet = new Set(bundle?.functionWords ?? []);
  if (functionSet.has(selectedForm)) {
    return { kind: 'function', selectedForm };
  }

  const formEntry = bundle?.forms[selectedForm];
  if (formEntry && bundle) {
    const lemmas = formEntry.lemmaIds
      .map((id) => bundle.lemmas[id])
      .filter(Boolean);
    if (lemmas.length > 0) {
      const primary = lemmas[0];
      const picked = pickGloss(primary.glosses, preferredLanguage);
      return {
        kind: 'matched',
        selectedForm,
        lemma: primary.lemma,
        transliteration: primary.transliteration,
        gloss: picked?.gloss,
        glossLanguage: picked?.language,
        notes: primary.notes,
        ambiguous: formEntry.status === 'ambiguous' || lemmas.length > 1,
        status: formEntry.status,
      };
    }
  }

  const vocabHit = chapterVocab.find((v) => v.term === selectedForm);
  if (vocabHit) {
    const glosses = {
      kn: vocabHit.definitionKn,
      ...(vocabHit.glosses ?? {}),
    };
    const picked = pickGloss(glosses, preferredLanguage);
    return {
      kind: 'matched',
      selectedForm,
      lemma: vocabHit.term,
      transliteration: vocabHit.transliteration,
      gloss: picked?.gloss,
      glossLanguage: picked?.language,
      status: 'exact',
    };
  }

  return { kind: 'unavailable', selectedForm };
}

export function resolveMeanings(
  forms: string[],
  bundle: LexiconBundle | null,
  chapterVocab: ChapterVocabPair[],
  preferredLanguage: string | null,
): MeaningResult[] {
  return forms.map((form) => resolveMeaning(form, bundle, chapterVocab, preferredLanguage));
}
