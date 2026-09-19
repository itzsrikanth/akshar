import { Directory, File } from 'expo-file-system';

import { CONTENT_BASE_URL } from '../config';
import {
  childFile,
  documentSubdir,
  memoryClearPrefix,
  memoryRead,
  memoryWrite,
} from '../chapter-fs';
import { isLocalDataResetting } from '../local-reset-state';
import { isLexiconBundle, type LexiconBundle } from './types';

const DIR_NAME = 'lexicons';
const MEMORY_PREFIX = 'lexicons';

let lexiconsDir: Directory | null | undefined;
const memoryCache = new Map<string, LexiconBundle>();
const inFlight = new Map<string, Promise<LexiconBundle>>();

function getLexiconsDir(): Directory | null {
  if (lexiconsDir === undefined) lexiconsDir = documentSubdir(DIR_NAME);
  return lexiconsDir;
}

function fileFor(language: string): File | null {
  const dir = getLexiconsDir();
  if (!dir) return null;
  return childFile(dir, `${language}.json`);
}

function memoryPath(language: string): string {
  return `${MEMORY_PREFIX}/${language}.json`;
}

function readLocal(language: string): LexiconBundle | null {
  const cached = memoryCache.get(language);
  if (cached) return cached;

  const file = fileFor(language);
  let raw: string | null = null;
  if (file?.exists) {
    raw = file.textSync();
  } else {
    raw = memoryRead(memoryPath(language));
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isLexiconBundle(parsed)) return null;
    memoryCache.set(language, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(language: string, bundle: LexiconBundle): void {
  if (isLocalDataResetting()) return;
  memoryCache.set(language, bundle);
  const rendered = JSON.stringify(bundle);
  const dir = getLexiconsDir();
  if (dir) {
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const target = childFile(dir, `${language}.json`);
    const temp = childFile(dir, `${language}.tmp.json`);
    if (!temp.exists) temp.create({ overwrite: true });
    temp.write(rendered);
    if (target.exists) target.delete();
    if (!target.exists) target.create({ overwrite: true });
    target.write(temp.textSync());
    if (temp.exists) temp.delete();
  } else {
    memoryWrite(memoryPath(language), rendered);
  }
}

async function fetchRemote(language: string): Promise<LexiconBundle> {
  const url = `${CONTENT_BASE_URL}/api/v2/lexicons/${language}.json?_cb=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Lexicon ${language} failed (${res.status})`);
  }
  const parsed = (await res.json()) as unknown;
  if (!isLexiconBundle(parsed)) {
    throw new Error(`Lexicon ${language} failed schema check`);
  }
  return parsed;
}

/** Return a cached/local copy immediately when present; otherwise fetch. */
export async function ensureLexicon(language: string): Promise<LexiconBundle> {
  const local = readLocal(language);
  if (local) {
    // Refresh in background when online; keep serving local.
    void refreshLexicon(language).catch(() => undefined);
    return local;
  }

  let pending = inFlight.get(language);
  if (!pending) {
    pending = fetchRemote(language)
      .then((bundle) => {
        writeLocal(language, bundle);
        return bundle;
      })
      .finally(() => {
        inFlight.delete(language);
      });
    inFlight.set(language, pending);
  }
  return pending;
}

/** Fetch and replace local copy when the remote contentHash differs (or local missing). */
export async function refreshLexicon(language: string): Promise<LexiconBundle> {
  const remote = await fetchRemote(language);
  const local = readLocal(language);
  if (local?.contentHash && remote.contentHash && local.contentHash === remote.contentHash) {
    return local;
  }
  writeLocal(language, remote);
  return remote;
}

export function getCachedLexicon(language: string): LexiconBundle | null {
  return readLocal(language);
}

/** Best-effort download used when a chapter is saved offline. */
export function downloadLexiconInBackground(language: string): void {
  void ensureLexicon(language).catch(() => undefined);
}

export function clearDownloadedLexicons(): void {
  memoryCache.clear();
  inFlight.clear();
  const dir = getLexiconsDir();
  if (dir?.exists) dir.delete();
  memoryClearPrefix(MEMORY_PREFIX);
}
