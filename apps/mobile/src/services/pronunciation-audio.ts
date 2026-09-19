import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';

import { MEDIA_SAMPLE_MODE } from './config';

/** Bundled placeholder clip (24 kHz AAC). Replace with per-segment R2 assets later. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SAMPLE_ASSET = require('../../assets/audio/pronunciation-demo.m4a');

const SPEAKABLE_TYPES = new Set([
  'competency',
  'prose',
  'dialogue',
  'poem_line',
  'vocabulary_term',
  'note_term',
]);

let player: AudioPlayer | null = null;
let audioModeReady: Promise<void> | null = null;
let playingSegmentId: string | null = null;
/** Monotonic id so an older playPronunciation cannot clear/override a newer tap. */
let playGeneration = 0;
let statusSubscription: EventSubscription | null = null;
const listeners = new Set<() => void>();

function publish(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToPronunciationPlayback(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlayingSegmentId(): string | null {
  return playingSegmentId;
}

export function isSpeakableSegmentType(type: string | undefined): boolean {
  return !!type && SPEAKABLE_TYPES.has(type);
}

/**
 * Sample mode: speakable segments with a non-empty translation may play the
 * bundled demo clip. Missing translation keeps the speaker disabled.
 * Production will require a revision-matched per-segment asset instead.
 */
export function canPlayPronunciation(
  segmentType: string | undefined,
  translation: string | undefined,
): boolean {
  return (
    MEDIA_SAMPLE_MODE &&
    isSpeakableSegmentType(segmentType) &&
    !!translation?.trim()
  );
}

async function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = setAudioModeAsync({
      playsInSilentMode: true,
      // Exclusive focus so a new clip reliably cuts off the previous one.
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
      allowsRecording: false,
    }).then(() => undefined);
  }
  await audioModeReady;
}

function getPlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(SAMPLE_ASSET, { updateInterval: 100 });
    player.volume = 1;
    player.muted = false;
  }
  return player;
}

function clearStatusSubscription(): void {
  statusSubscription?.remove();
  statusSubscription = null;
}

/**
 * Play pronunciation for a segment. If another clip is already playing, it is
 * stopped immediately and this one starts (after seek-to-start completes).
 * Sample mode uses one shared bundled clip for every segment.
 */
export async function playPronunciation(segmentId: string): Promise<void> {
  await ensureAudioMode();
  const audio = getPlayer();
  const generation = ++playGeneration;
  clearStatusSubscription();

  // Stop whatever is currently audible right away, then claim the UI state.
  try {
    audio.pause();
  } catch {
    // ignore
  }
  playingSegmentId = segmentId;
  publish();

  // seekTo is async — not awaiting it was the main cause of intermittent silence
  // (play() raced ahead and often started at EOF after a prior finish).
  try {
    await audio.seekTo(0);
  } catch {
    // Fall through; replace below if still not at start.
  }
  if (generation !== playGeneration) return;

  if (audio.currentTime > 0.05) {
    audio.replace(SAMPLE_ASSET);
    try {
      await audio.seekTo(0);
    } catch {
      // ignore
    }
    if (generation !== playGeneration) return;
  }

  audio.volume = 1;
  audio.muted = false;
  audio.play();

  statusSubscription = audio.addListener('playbackStatusUpdate', (status) => {
    if (generation !== playGeneration) return;
    if (status.didJustFinish) {
      if (playingSegmentId === segmentId) {
        playingSegmentId = null;
        publish();
      }
      clearStatusSubscription();
    }
  });
}

export function stopPronunciation(): void {
  playGeneration += 1;
  clearStatusSubscription();
  if (!player) {
    playingSegmentId = null;
    publish();
    return;
  }
  try {
    player.pause();
    void player.seekTo(0);
  } catch {
    // ignore
  }
  playingSegmentId = null;
  publish();
}
