#!/usr/bin/env python3
"""Helpers for immutable media asset identity (provider-independent).

Asset IDs hash normalized text + language + voice identity + synthesis settings so
the same spoken sentence reuses one clip across transliterations and books.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from typing import Any, Mapping


_OBJECT_KEY_RE = re.compile(
    r"^audio/[a-z0-9-]+/[a-z0-9._-]+/[a-f0-9]{2}/[a-f0-9]{64}\.[a-z0-9]+$"
)


def normalize_text(text: str) -> str:
    """NFC + strip; collapses internal whitespace to single spaces."""
    normalized = unicodedata.normalize("NFC", text).strip()
    return re.sub(r"\s+", " ", normalized)


def sha256_hex(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def text_digest(text: str) -> str:
    return sha256_hex(normalize_text(text))


def asset_id(
    *,
    text: str,
    language: str,
    voice_id: str,
    provider: str,
    model: str,
    version: str,
    settings: Mapping[str, Any] | None = None,
) -> str:
    """Stable digest for a pronunciation clip identity."""
    payload = {
        "text": normalize_text(text),
        "language": language.strip().lower(),
        "voice": {
            "id": voice_id,
            "provider": provider,
            "model": model,
            "version": version,
        },
        "settings": dict(settings or {}),
    }
    # Canonical JSON so key order does not change the digest.
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256_hex(body)


def object_key(
    *,
    language: str,
    voice_id: str,
    asset_id_hex: str,
    extension: str = "m4a",
) -> str:
    lang = language.strip().lower()
    voice = voice_id.strip()
    digest = asset_id_hex.strip().lower()
    ext = extension.lstrip(".").lower()
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("asset_id_hex must be a 64-char lowercase hex SHA-256")
    key = f"audio/{lang}/{voice}/{digest[:2]}/{digest}.{ext}"
    if not _OBJECT_KEY_RE.match(key):
        raise ValueError(f"produced object key failed schema pattern: {key}")
    return key


def file_sha256(path: str | bytes) -> tuple[str, int]:
    """Return (hex digest, byte length) for a local file path or raw bytes."""
    if isinstance(path, bytes):
        digest = sha256_hex(path)
        return digest, len(path)
    from pathlib import Path

    data = Path(path).read_bytes()
    return sha256_hex(data), len(data)
