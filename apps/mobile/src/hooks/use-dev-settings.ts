import { useCallback, useEffect, useState } from 'react';

import type { ContentSourceId } from '@/services/config';
import { getDevContentSource, setDevContentSource } from '@/services/dev-settings';

export function useDevSettings() {
  const [contentSource, setContentSourceState] = useState<ContentSourceId | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getDevContentSource().then((source) => {
      setContentSourceState(source);
      setLoaded(true);
    });
  }, []);

  const setContentSource = useCallback(async (source: ContentSourceId) => {
    await setDevContentSource(source);
    setContentSourceState(source);
  }, []);

  return { contentSource, loaded, setContentSource };
}
