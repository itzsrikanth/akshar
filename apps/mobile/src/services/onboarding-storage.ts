import AsyncStorage from '@react-native-async-storage/async-storage';

// Deliberately its own flag, not derived from whether a scope/reading
// preference happens to be saved — a scope can get saved other ways (e.g.
// Explore's "Set as my default scope") without the user ever having gone
// through onboarding, and that shouldn't silently skip it.
const STORAGE_KEY = 'akshar:onboarding-completed:default';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}
