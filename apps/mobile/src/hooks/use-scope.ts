import { useCallback, useEffect, useState } from 'react';

import type { Catalog } from '@/services/content-repository';
import { deriveScope, type Scope } from '@/services/scope';
import { loadSavedScope, saveScope } from '@/services/scope-storage';

/**
 * The effective scope is a saved preference if one exists, falling back to
 * `deriveScope(catalog)` (today's only real board/state/medium/grade) until
 * the user actually sets one via Explore. `isSaved` distinguishes the two,
 * for UI that wants to say "this is your saved scope" vs. "using default."
 */
export function useScope(catalog: Catalog) {
  const [saved, setSaved] = useState<Scope | null>(null);

  useEffect(() => {
    loadSavedScope().then(setSaved);
  }, []);

  const setScope = useCallback((next: Scope) => {
    setSaved(next);
    saveScope(next);
  }, []);

  return { scope: saved ?? deriveScope(catalog), isSaved: saved !== null, setScope };
}
