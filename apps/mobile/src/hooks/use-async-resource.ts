import { useEffect, useState } from 'react';

export type AsyncResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

/**
 * Generic fetch-on-mount hook. `key` re-triggers the fetch when it changes
 * (a chapter path, for example) — for a resource with no natural key (the
 * catalog), pass a constant.
 */
export function useAsyncResource<T>(key: string, fetcher: () => Promise<T>): AsyncResourceState<T> {
  const [state, setState] = useState<AsyncResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by `key`, not `fetcher` identity
  }, [key]);

  return state;
}
