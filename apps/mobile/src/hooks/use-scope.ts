import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Catalog } from '@/services/content-repository';
import { deriveScope, type Scope } from '@/services/scope';
import { loadSavedScope, saveScope } from '@/services/scope-storage';

/**
 * The effective scope is a saved preference if one exists, falling back to
 * `deriveScope(catalog)` (today's only real board/state/medium/grade) until
 * the user actually sets one via app/scope-setup.tsx. `isSaved` distinguishes
 * the two, for UI that wants to say "this is your saved scope" vs. "using
 * default." Reloads on focus, not just on mount — scope-setup.tsx can save a
 * new scope from a separate screen instance, and Settings stays mounted
 * underneath it in the navigation stack (same reasoning as
 * hooks/use-reading-history.ts).
 *
 * `loaded` is false until the first AsyncStorage read finishes — Settings →
 * scope-setup must wait on it so the flow is not mounted with deriveScope
 * (catalog[0], often English/Grade5) and then left stale when the real saved
 * scope arrives.
 */
export function useScope(catalog: Catalog) {
  const [saved, setSaved] = useState<Scope | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadSavedScope().then((next) => {
        if (cancelled) return;
        setSaved(next);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const setScope = useCallback((next: Scope) => {
    setSaved(next);
    saveScope(next);
  }, []);

  return { scope: saved ?? deriveScope(catalog), isSaved: saved !== null, loaded, setScope };
}
