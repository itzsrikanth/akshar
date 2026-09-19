import { useEffect, useState } from 'react';

import {
  ensureLexicon,
  getCachedLexicon,
  refreshLexicon,
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
      .then(async (loaded) => {
        if (!cancelled) setBundle(loaded);
        try {
          const refreshed = await refreshLexicon(language);
          if (!cancelled) setBundle(refreshed);
        } catch {
          // Keep the last good bundle when offline refresh fails.
        }
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
