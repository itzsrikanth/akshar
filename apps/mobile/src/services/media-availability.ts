import { MEDIA_HEALTH_URL } from './config';

export type MediaAvailability = 'not-configured' | 'checking' | 'available' | 'unavailable';

let snapshot: MediaAvailability = 'not-configured';
let pending: Promise<MediaAvailability> | null = null;
const listeners = new Set<() => void>();

export function subscribeToMediaAvailability(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMediaAvailabilitySnapshot(): MediaAvailability {
  return snapshot;
}

function publish(next: MediaAvailability): MediaAvailability {
  snapshot = next;
  listeners.forEach((listener) => listener());
  return next;
}

export async function probeMediaOrigin(url: string | undefined, timeoutMs = 3000): Promise<MediaAvailability> {
  if (!url) return 'not-configured';
  try {
    if (new URL(url).protocol !== 'https:') return 'unavailable';
  } catch {
    return 'unavailable';
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<MediaAvailability>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve('unavailable');
    }, timeoutMs);
  });
  const request = async (): Promise<MediaAvailability> => {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('application/json')) return 'unavailable';
      const health: unknown = await response.json();
      if (!health || typeof health !== 'object' || !('service' in health) || !('schemaVersion' in health)) return 'unavailable';
      return health.service === 'akshar-media' && health.schemaVersion === 1 ? 'available' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  };
  try {
    return await Promise.race([request(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export function refreshMediaAvailability(): Promise<MediaAvailability> {
  if (pending) return pending;
  publish(MEDIA_HEALTH_URL ? 'checking' : 'not-configured');
  pending = probeMediaOrigin(MEDIA_HEALTH_URL)
    .then(publish)
    .finally(() => {
      pending = null;
    });
  return pending;
}
