import { useCallback, useEffect, useState } from 'react';

import type { Catalog } from '@/services/content-repository';
import {
  loadReadingPreference,
  saveReadingPreference,
  type ReadingPreference,
} from '@/services/reading-preference-storage';
import { availableLanguages, availableScripts } from '@/services/scope';

/**
 * Same shape as use-scope.ts: a saved preference (per-field — either axis
 * can be set independently, e.g. onboarding only ever sets one at a time)
 * falling back to the first real catalog-derived option until the user
 * actually picks one, via Settings or onboarding.
 */
export function useReadingPreference(catalog: Catalog) {
  const [saved, setSaved] = useState<ReadingPreference | null>(null);

  useEffect(() => {
    loadReadingPreference().then(setSaved);
  }, []);

  const translationLanguage = saved?.translationLanguage ?? availableLanguages(catalog)[0] ?? null;
  const transliterationScript = saved?.transliterationScript ?? availableScripts(catalog)[0] ?? null;

  const setPreference = useCallback((next: Partial<ReadingPreference>) => {
    setSaved((prev) => {
      const merged: ReadingPreference = {
        translationLanguage: prev?.translationLanguage ?? null,
        transliterationScript: prev?.transliterationScript ?? null,
        ...next,
      };
      saveReadingPreference(merged);
      return merged;
    });
  }, []);

  return {
    preference: { translationLanguage, transliterationScript },
    isSaved: saved !== null,
    setPreference,
  };
}
