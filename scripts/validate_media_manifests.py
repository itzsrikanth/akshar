#!/usr/bin/env python3
"""Validate media asset manifests under content/media/manifests/.

Partial manifests are valid. Orphan segment IDs (not present in the declared
source file) are errors. Missing assets for some segments are fine.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "media-asset-manifest.schema.json"
MANIFEST_ROOT = REPO_ROOT / "content" / "media" / "manifests"


def _load_source_ids(source_rel: str) -> set[str]:
    path = REPO_ROOT / source_rel
    if not path.is_file():
        raise FileNotFoundError(f"sourceFile not found: {source_rel}")
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    segments = data.get("segments") or []
    return {s["id"] for s in segments if isinstance(s, dict) and "id" in s}


def validate_manifest(path: Path, schema: dict) -> list[str]:
    errors: list[str] = []
    try:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        return [f"{path}: YAML parse error: {exc}"]

    if not isinstance(doc, dict):
        return [f"{path}: root must be a mapping"]

    validator = Draft7Validator(schema)
    for err in sorted(validator.iter_errors(doc), key=lambda e: list(e.path)):
        loc = "/".join(str(p) for p in err.path) or "(root)"
        errors.append(f"{path}: schema {loc}: {err.message}")

    if errors:
        return errors

    meta = doc["meta"]
    source_rel = meta["sourceFile"]
    try:
        source_ids = _load_source_ids(source_rel)
    except FileNotFoundError as exc:
        return [f"{path}: {exc}"]

    assets = doc.get("assets") or {}
    for seg_id, asset in assets.items():
        if seg_id not in source_ids:
            errors.append(
                f"{path}: assets.{seg_id}: orphan id (not in {source_rel})"
            )
        expected_prefix = f"audio/{meta['sourceLanguage']}/{meta['voice']['id']}/"
        key = asset.get("objectKey", "")
        if not key.startswith(expected_prefix):
            errors.append(
                f"{path}: assets.{seg_id}.objectKey must start with {expected_prefix!r}"
            )
        digest = asset.get("assetId", "")
        if digest and f"/{digest[:2]}/{digest}." not in key:
            errors.append(
                f"{path}: assets.{seg_id}.objectKey must embed assetId {digest}"
            )

    return errors


def main() -> int:
    if not MANIFEST_ROOT.is_dir():
        print("No content/media/manifests directory; nothing to validate.")
        return 0

    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    paths = sorted(
        p
        for p in MANIFEST_ROOT.rglob("*")
        if p.suffix in {".yaml", ".yml"} and p.is_file()
    )
    if not paths:
        print("No media manifests found (OK).")
        return 0

    all_errors: list[str] = []
    for path in paths:
        all_errors.extend(validate_manifest(path, schema))

    if all_errors:
        for line in all_errors:
            print(line, file=sys.stderr)
        print(f"FAIL: {len(all_errors)} media manifest error(s)", file=sys.stderr)
        return 1

    print(f"OK: {len(paths)} media manifest(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
