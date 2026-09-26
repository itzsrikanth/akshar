import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  childFile,
  documentSubdir,
  memoryClearPrefix,
  memoryHas,
  memoryRead,
  memoryWrite,
} from './chapter-fs';
import { CONTENT_BASE_URL, MEDIA_BASE_URL, MEDIA_SAMPLE_MODE } from './config';
import { isLocalDataResetting } from './local-reset-state';
import type { ChapterIdentity } from './v2/identity';
import { assertChapterIdentity } from './v2/identity';

const DIR_NAME = 'audio-v1';
const MEMORY_PREFIX = 'audio-v1';

/** Shared sample placeholder used by sample-mode manifests (must match publish_sample_audio.py). */
export const SAMPLE_ASSET_ID =
  'bb0ef5499046e66f6d007f2edb8ad62018b173f168025a6f219f718be9a088e0';
export const SAMPLE_OBJECT_KEY =
  'audio/kn/sample-voice-v1/bb/bb0ef5499046e66f6d007f2edb8ad62018b173f168025a6f219f718be9a088e0.m4a';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BUNDLED_SAMPLE = require('../../assets/audio/pronunciation-demo.m4a') as number;

export type ManifestAsset = {
  assetId: string;
  objectKey: string;
  contentType: string;
  bytes: number;
  sha256: string;
  textDigest: string;
  segmentType?: string;
  durationMs?: number;
};

export type AudioManifest = {
  meta: {
    schemaVersion: number;
    bookId: string;
    editionId: string;
    chapterId: string;
    sourceLanguage: string;
    sourceFile: string;
    voice: { id: string; provider: string; model: string; version: string; license?: string };
    notes?: string;
  };
  assets: Record<string, ManifestAsset>;
};

let audioDir: ReturnType<typeof documentSubdir> | undefined;
const manifestCache = new Map<string, AudioManifest | null>();
const inFlightCache = new Map<string, Promise<string | null>>();

function getAudioDir() {
  if (audioDir === undefined) audioDir = documentSubdir(DIR_NAME);
  return audioDir;
}

function fileFor(assetId: string): File | null {
  const dir = getAudioDir();
  if (!dir) return null;
  return childFile(dir, `${assetId}.m4a`);
}

function memoryPath(assetId: string): string {
  return `${MEMORY_PREFIX}/${assetId}.m4a`;
}

function isManifestAsset(value: unknown): value is ManifestAsset {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.assetId === 'string' &&
    typeof r.objectKey === 'string' &&
    typeof r.contentType === 'string' &&
    typeof r.bytes === 'number' &&
    typeof r.sha256 === 'string' &&
    typeof r.textDigest === 'string'
  );
}

function isAudioManifest(value: unknown): value is AudioManifest {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if (!r.meta || typeof r.meta !== 'object' || !r.assets || typeof r.assets !== 'object') return false;
  for (const asset of Object.values(r.assets as Record<string, unknown>)) {
    if (!isManifestAsset(asset)) return false;
  }
  return true;
}

export function manifestUrl(identity: ChapterIdentity): string {
  const { bookId, editionId, chapterId } = assertChapterIdentity(identity);
  return `${CONTENT_BASE_URL}/content/media/manifests/${bookId}/${editionId}/${chapterId}.json`;
}

export async function fetchChapterAudioManifest(identity: ChapterIdentity): Promise<AudioManifest | null> {
  const key = `${identity.bookId}/${identity.editionId}/${identity.chapterId}`;
  if (manifestCache.has(key)) return manifestCache.get(key) ?? null;
  try {
    const res = await fetch(manifestUrl(identity), { cache: 'no-store' });
    if (res.status === 404) {
      manifestCache.set(key, null);
      return null;
    }
    if (!res.ok) throw new Error(`audio manifest HTTP ${res.status}`);
    const parsed: unknown = await res.json();
    if (!isAudioManifest(parsed)) throw new Error('audio manifest schema mismatch');
    manifestCache.set(key, parsed);
    return parsed;
  } catch {
    manifestCache.set(key, null);
    return null;
  }
}

/** Local URI for a cached clip, or null. */
export function getCachedAudioUri(assetId: string): string | null {
  const file = fileFor(assetId);
  if (file?.exists) return file.uri;
  if (memoryHas(memoryPath(assetId))) {
    const b64 = memoryRead(memoryPath(assetId));
    return b64 ? `data:audio/mp4;base64,${b64}` : null;
  }
  return null;
}

async function writeBytes(assetId: string, bytes: Uint8Array): Promise<string | null> {
  if (isLocalDataResetting()) return null;
  const dir = getAudioDir();
  if (dir) {
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const target = childFile(dir, `${assetId}.m4a`);
    if (!target.exists) target.create({ overwrite: true });
    target.write(bytes);
    return target.uri;
  }
  // Web fallback: base64 in memory map (small sample only).
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  if (typeof globalThis.btoa !== 'function') return null;
  const b64 = globalThis.btoa(binary);
  memoryWrite(memoryPath(assetId), b64);
  return `data:audio/mp4;base64,${b64}`;
}

async function seedFromBundledSample(assetId: string): Promise<string | null> {
  if (assetId !== SAMPLE_ASSET_ID || !MEDIA_SAMPLE_MODE) return null;
  try {
    const { Asset } = await import('expo-asset');
    const asset = Asset.fromModule(BUNDLED_SAMPLE);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return null;
    const res = await fetch(uri);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    return writeBytes(assetId, buf);
  } catch {
    return null;
  }
}

async function fetchRemoteIntoCache(assetId: string, objectKey: string): Promise<string | null> {
  if (!MEDIA_BASE_URL) return null;
  const url = `${MEDIA_BASE_URL}/${objectKey}`;
  const headers = { 'User-Agent': 'AksharMediaClient/1.0', Accept: 'audio/*,*/*' };
  const dir = getAudioDir();
  if (dir && Platform.OS !== 'web') {
    try {
      if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
      const target = childFile(dir, `${assetId}.m4a`);
      await File.downloadFileAsync(url, target, { idempotent: true, headers });
      if (target.exists) return target.uri;
    } catch {
      // fall through to fetch+write / bundled seed
    }
  }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0) return null;
    return writeBytes(assetId, buf);
  } catch {
    return null;
  }
}

/**
 * Ensure a clip is on disk. Prefer remote MEDIA_BASE_URL; for the shared sample
 * asset, fall back to the app-bundled beep when R2 is unreachable.
 */
export async function ensureAudioCached(assetId: string, objectKey: string): Promise<string | null> {
  const existing = getCachedAudioUri(assetId);
  if (existing) return existing;

  let pending = inFlightCache.get(assetId);
  if (!pending) {
    pending = (async () => {
      const remote = await fetchRemoteIntoCache(assetId, objectKey);
      if (remote) return remote;
      return seedFromBundledSample(assetId);
    })().finally(() => {
      inFlightCache.delete(assetId);
    });
    inFlightCache.set(assetId, pending);
  }
  return pending;
}

/** Best-effort: fetch chapter audio manifest and cache unique clips. Never throws. */
export async function prefetchChapterAudio(identity: ChapterIdentity): Promise<void> {
  try {
    if (isLocalDataResetting()) return;
    const manifest = await fetchChapterAudioManifest(identity);
    if (!manifest) return;
    const unique = new Map<string, string>();
    for (const asset of Object.values(manifest.assets)) {
      unique.set(asset.assetId, asset.objectKey);
    }
    await Promise.all(
      [...unique.entries()].map(([assetId, objectKey]) =>
        ensureAudioCached(assetId, objectKey).catch(() => null),
      ),
    );
  } catch {
    // Text download must succeed even if audio prefetch fails.
  }
}

export function prefetchChapterAudioInBackground(identity: ChapterIdentity): void {
  void prefetchChapterAudio(identity);
}

/** Resolve playable URI for a segment: local cache → remote fetch/cache → null. */
export async function resolveSegmentAudioUri(
  identity: ChapterIdentity,
  segmentId: string,
): Promise<string | null> {
  const manifest = await fetchChapterAudioManifest(identity);
  const entry = manifest?.assets[segmentId];
  if (entry) {
    const cached = await ensureAudioCached(entry.assetId, entry.objectKey);
    if (cached) return cached;
    if (MEDIA_BASE_URL) return `${MEDIA_BASE_URL}/${entry.objectKey}`;
  }
  // Sample mode without a chapter manifest: still allow the shared beep offline.
  if (MEDIA_SAMPLE_MODE) {
    return ensureAudioCached(SAMPLE_ASSET_ID, SAMPLE_OBJECT_KEY);
  }
  return null;
}

export function clearAudioCache(): void {
  const dir = getAudioDir();
  if (dir?.exists) dir.delete();
  memoryClearPrefix(MEMORY_PREFIX);
  manifestCache.clear();
  inFlightCache.clear();
}

export function remoteObjectUrl(objectKey: string): string | null {
  if (!MEDIA_BASE_URL) return null;
  return `${MEDIA_BASE_URL}/${objectKey}`;
}
