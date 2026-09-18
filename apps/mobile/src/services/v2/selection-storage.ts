import AsyncStorage from '@react-native-async-storage/async-storage';

import { isLocalDataResetting } from '../local-reset-state';
import { isValidIdentityPart } from './identity';
import type { V2Selection } from './types';

const STORAGE_KEY = 'akshar:v2:selection:default';

function isV2Selection(value: unknown): value is V2Selection {
  if (!value || typeof value !== 'object') return false;
  const selection = value as V2Selection;
  return (
    typeof selection.adoptionId === 'string' &&
    isValidIdentityPart(selection.adoptionId) &&
    isValidIdentityPart(selection.bookId) &&
    isValidIdentityPart(selection.editionId)
  );
}

export async function loadV2Selection(): Promise<V2Selection | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isV2Selection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveV2Selection(selection: V2Selection): Promise<void> {
  if (isLocalDataResetting()) return;
  if (!isV2Selection(selection)) {
    throw new Error('Invalid v2 selection');
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}
