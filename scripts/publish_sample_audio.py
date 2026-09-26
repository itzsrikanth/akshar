#!/usr/bin/env python3
"""Publish the bundled pronunciation demo clip to R2 at its content-addressed key.

Requires R2 S3 credentials (or CLOUDFLARE_API_TOKEN) — see infra/cloudflare/README.md.

  python3 scripts/publish_sample_audio.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from media_asset_id import asset_id, file_sha256, object_key  # noqa: E402

DEMO = REPO_ROOT / "apps" / "mobile" / "assets" / "audio" / "pronunciation-demo.m4a"
PUBLISH = REPO_ROOT / "scripts" / "media_publish.py"

SAMPLE_TEXT = "SAMPLE_PRONUNCIATION_V1"
VOICE_ID = "sample-voice-v1"


def main() -> int:
    if not DEMO.is_file():
        print(f"missing {DEMO}", file=sys.stderr)
        return 1
    aid = asset_id(
        text=SAMPLE_TEXT,
        language="kn",
        voice_id=VOICE_ID,
        provider="akshar",
        model="placeholder-beep",
        version="1",
        settings={"encoding": "aac-24khz-mono", "purpose": "ui-sample"},
    )
    key = object_key(language="kn", voice_id=VOICE_ID, asset_id_hex=aid, extension="m4a")
    sha, nbytes = file_sha256(DEMO)
    print(f"assetId={aid}")
    print(f"objectKey={key}")
    print(f"fileSha256={sha} bytes={nbytes}")
    return subprocess.call(
        [
            sys.executable,
            str(PUBLISH),
            "--put",
            str(DEMO),
            "--key",
            key,
            "--content-type",
            "audio/mp4",
        ]
    )


if __name__ == "__main__":
    raise SystemExit(main())
