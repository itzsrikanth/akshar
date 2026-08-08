// Dev-only tooling (see app/dev-settings.tsx) — lets a developer flip
// between the local content server and jsDelivr without rebuilding, and is
// the seam future test-mode toggles (skip splash/onboarding, once those
// exist) hang off. Everything here is inert in a production build:
// `__DEV__` is a compile-time constant, so `if (!__DEV__)` branches are
// dead-code-eliminated from the release bundle.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CONTENT_SOURCES, type ContentSourceId } from './config';
import { setContentBaseUrlForDev } from './index';

const STORAGE_KEY = 'akshar:dev-settings';

type DevSettings = { contentSource: ContentSourceId | null };

async function load(): Promise<DevSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevSettings) : { contentSource: null };
  } catch {
    return { contentSource: null };
  }
}

/**
 * Called once at app startup (see app/_layout.tsx), before the first
 * catalog/chapter fetch goes out — applies a saved content-source override
 * so that fetch doesn't race against AsyncStorage and hit the wrong source.
 */
export async function applyDevSettingsOnLaunch(): Promise<void> {
  if (!__DEV__) return;
  const { contentSource } = await load();
  if (contentSource) setContentBaseUrlForDev(CONTENT_SOURCES[contentSource]);
}

export async function getDevContentSource(): Promise<ContentSourceId | null> {
  if (!__DEV__) return null;
  return (await load()).contentSource;
}

export async function setDevContentSource(source: ContentSourceId): Promise<void> {
  if (!__DEV__) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ contentSource: source }));
  setContentBaseUrlForDev(CONTENT_SOURCES[source]);
}
