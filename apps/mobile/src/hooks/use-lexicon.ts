import { useEffect, useState } from 'react';

import {
  ensureLexicon,
  getCachedLexicon,
  type LexiconBundle,
} from '@/services/lexicon';

/** Load (and background-refresh) a language lexicon for the reader. */
export function useLexicon(language: string | null) {
  const [bundle, setBundle] = useState<LexiconBundle | null>(() =>
    language ? getCachedLexicon(language) : null,
  );

  useEffect(() => {
    if (!language) {
      setBundle(null);
      return;
    }
    const cached = getCachedLexicon(language);
    if (cached) setBundle(cached);
    let cancelled = false;
    void ensureLexicon(language)
      .then((loaded) => {
        if (!cancelled) setBundle(loaded);
      })
      .catch(() => {
        if (!cancelled && !getCachedLexicon(language)) setBundle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return bundle;
}
