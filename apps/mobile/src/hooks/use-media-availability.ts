import { useSyncExternalStore } from 'react';

import { getMediaAvailabilitySnapshot, subscribeToMediaAvailability } from '@/services/media-availability';

export function useMediaAvailability() {
  return useSyncExternalStore(subscribeToMediaAvailability, getMediaAvailabilitySnapshot, getMediaAvailabilitySnapshot);
}
