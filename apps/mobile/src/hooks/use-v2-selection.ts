import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadV2Selection, saveV2Selection, type V2Selection } from '@/services/v2';

export function useV2Selection() {
  const [selection, setSelectionState] = useState<V2Selection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadV2Selection().then((next) => {
        setSelectionState(next);
        setLoaded(true);
      });
    }, []),
  );

  const setSelection = useCallback((next: V2Selection) => {
    setSelectionState(next);
    saveV2Selection(next);
  }, []);

  return { selection, loaded, setSelection };
}
