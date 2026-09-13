let resetting = false;

export function isLocalDataResetting(): boolean {
  return resetting;
}

export function beginLocalDataReset(): void {
  if (!__DEV__) throw new Error('Local data reset is only available in development builds.');
  resetting = true;
}
