import AsyncStorage from '@react-native-async-storage/async-storage';

// Mirrors scope-storage.ts exactly — same profile-aware key shape, same
// load/save pattern. Previously this preference lived only as local
// useState in app/settings.tsx and was thrown away on every restart; this
// is what makes it real.
const STORAGE_KEY = 'akshar:reading-preference:default';

export type ReadingPreference = {
  translationLanguage: string | null;
  transliterationScript: string | null;
};

export async function loadReadingPreference(): Promise<ReadingPreference | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadingPreference) : null;
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app — just means
    // no saved preference, same as a first launch.
    return null;
  }
}

export async function saveReadingPreference(preference: ReadingPreference): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}
