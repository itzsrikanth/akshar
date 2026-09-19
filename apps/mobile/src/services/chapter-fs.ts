import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

/**
 * Expo's web stub for the new FileSystem Directory class has no validatePath(),
 * so `new Directory(Paths.document, …)` throws at construction. Keep downloads
 * off the critical import path and fall back to an in-memory store on web (and
 * if the native module is missing/mismatched).
 */
let cachedAvailable: boolean | undefined;

export function modernFileSystemAvailable(): boolean {
  if (cachedAvailable !== undefined) return cachedAvailable;
  if (Platform.OS === 'web') {
    cachedAvailable = false;
    return cachedAvailable;
  }
  try {
    const probe = Paths.document;
    cachedAvailable = typeof probe.uri === 'string' && probe.uri.length > 0;
  } catch {
    cachedAvailable = false;
  }
  return cachedAvailable;
}

export function documentSubdir(name: string): Directory | null {
  if (!modernFileSystemAvailable()) return null;
  try {
    return new Directory(Paths.document, name);
  } catch {
    cachedAvailable = false;
    return null;
  }
}

export function childDirectory(parent: Directory, name: string): Directory {
  return new Directory(parent, name);
}

export function childFile(parent: Directory, name: string): File {
  return new File(parent, name);
}

/** In-memory fallback for web / unavailable native FS. Keys are relative paths. */
const memoryFiles = new Map<string, string>();

export function memoryHas(path: string): boolean {
  return memoryFiles.has(path);
}

export function memoryRead(path: string): string | null {
  return memoryFiles.get(path) ?? null;
}

export function memoryWrite(path: string, contents: string): void {
  memoryFiles.set(path, contents);
}

export function memoryDelete(path: string): void {
  memoryFiles.delete(path);
}

export function memoryClearPrefix(prefix: string): void {
  for (const key of [...memoryFiles.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}/`)) memoryFiles.delete(key);
  }
}

export function memoryList(prefix: string): string[] {
  const out: string[] = [];
  const root = prefix.endsWith('/') ? prefix : `${prefix}/`;
  for (const key of memoryFiles.keys()) {
    if (!key.startsWith(root)) continue;
    out.push(key.slice(root.length));
  }
  return out;
}
