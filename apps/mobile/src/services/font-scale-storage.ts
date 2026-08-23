import AsyncStorage from '@react-native-async-storage/async-storage';

// Mirrors reading-preference-storage.ts's shape — same profile-aware key, same load/save pattern.
const STORAGE_KEY = 'akshar:font-scale:default';

export async function loadFontScale(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number) : null;
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app — just means
    // no saved preference, same as a first launch.
    return null;
  }
}

export async function saveFontScale(scale: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scale));
}
