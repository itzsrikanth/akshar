# Audio clip encoding (locked decision)

← [Media delivery](media-delivery.md) · [Mobile roadmap](../apps/mobile/docs/roadmap.md)

**Status:** decided September 19, 2026. Do not re-litigate sample rate/format in a later session unless device testing proves a problem.

## Canonical clip format

| Setting | Value | Why |
|---|---|---|
| Container | `.m4a` | Small, native on iOS/Android, matches Expo `expo-audio` |
| Codec | AAC (`audio/mp4`) | Default mobile decode path |
| Sample rate | **24 kHz** | Enough for speech; common neural TTS default. Not 8 (telephone), not 48 (wasteful for speech). 16 kHz is acceptable fallback only if a synthesizer cannot emit 24 kHz |
| Channels | Mono | One speaker; stereo doubles size for no gain |
| Bitrate | ~48–64 kbps AAC | Clear on phone speakers without large objects |

Object keys stay content-addressed, e.g. `audio/kn/<voice-id>/<hash-prefix>/<asset-hash>.m4a`.

## App sample mode (UI testing, not real TTS)

- Bundled placeholder: [`apps/mobile/assets/audio/pronunciation-demo.m4a`](../apps/mobile/assets/audio/pronunciation-demo.m4a) (24 kHz AAC beep).
- Publish the same bytes once to R2 at the content-addressed key for voice `sample-voice-v1` (synthetic text `SAMPLE_PRONUNCIATION_V1`): `scripts/publish_sample_audio.py`. Set `EXPO_PUBLIC_MEDIA_BASE_URL` to the bucket’s public origin.
- Git manifests map speakable+translated segments to that one shared `assetId` (partial maps are valid): e.g. [`content/media/manifests/ktbs-savi-kannada-g3-fl-p1/2026-27/`](../content/media/manifests/ktbs-savi-kannada-g3-fl-p1/2026-27/).
- Enable with `EXPO_PUBLIC_MEDIA_SAMPLE_MODE=1` (default in `__DEV__`).
- Speaker icon is enabled only when: sample mode is on, segment type is speakable, **and the line has a non-empty translation** for the active translation language. Missing translation → icon stays disabled.
- Sample mode is **not** limited to one chapter: any chapter with a manifest (or sample fallback) and speakable segments + translations works. Good first test: Grade 3 FL · `ch05-ajjiya-totadalli-ondu-dina` or `ch06-esura-svagata`.

## Offline prefetch on chapter download

Chapter text download (`downloadV2Chapter`) also best-effort prefetches unique manifest clips into a local **`audio-v1/<assetId>.m4a`** cache (content-addressed, shared across chapters). Playback prefers that local file, then remote `MEDIA_BASE_URL/<objectKey>`, then the bundled beep. Deleting one chapter does **not** delete shared audio clips; full local reset clears the cache.

**Why not YAML-path keys in R2?** The same spoken sentence (or sample placeholder) can appear in multiple books/adoptions. Content-addressed keys keep one object; Git manifests are the book/edition/chapter → asset map. Do not mirror `content/books/...` in the bucket.

## Production path (later)

Real Azure Speech / other TTS → same 24 kHz mono AAC → R2 → per-segment manifests with real `assetId`s. Turn `EXPO_PUBLIC_MEDIA_SAMPLE_MODE=0` when real assets replace the beep.
