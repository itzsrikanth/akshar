#!/usr/bin/env python3
"""Generate reviewed-draft latin/devanagari contributor maps from Kannada source YAML.

Local-only helper (not a CI gate). Output is always a draft for human review.
Uses indic_transliteration sanscript for Kannada → Devanagari and Kannada → IAST.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml
from indic_transliteration import sanscript
from indic_transliteration.sanscript import SchemeMap, SCHEMES, transliterate

UNVERIFIED = "Unverified; source PDF states NOT TO BE REPUBLISHED; no CC license asserted"


def convert(text: str, target: str) -> str:
    if not text or not str(text).strip():
        return text
    return transliterate(str(text), sanscript.KANNADA, target)


def build_map(source: dict, *, script: str, target_scheme: str, held: bool) -> dict:
    license_text = UNVERIFIED if held else "CC BY 4.0"
    out: dict = {
        "meta": {
            "source": "source.kn.yaml",
            "script": script,
            "contributor": "draft-transliteration.py",
            "license": license_text,
        }
    }
    labels = source.get("labels") or {}
    if labels:
        out["labels"] = {k: convert(v, target_scheme) for k, v in labels.items()}
    for seg in source.get("segments") or []:
        sid = seg.get("id")
        text = seg.get("text")
        if isinstance(sid, str) and isinstance(text, str):
            out[sid] = convert(text, target_scheme)
    return out


def dump_yaml(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.dump(data, allow_unicode=True, sort_keys=False, width=1000),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Path to source.kn.yaml")
    parser.add_argument(
        "--held",
        action="store_true",
        help="Mark contributor license as Unverified (Git-only held chapters)",
    )
    args = parser.parse_args()
    source = yaml.safe_load(args.source.read_text(encoding="utf-8"))
    if not isinstance(source, dict):
        raise SystemExit(f"Invalid source YAML: {args.source}")
    chapter = args.source.parent
    dump_yaml(
        chapter / "transliteration" / "devanagari.yaml",
        build_map(source, script="devanagari", target_scheme=sanscript.DEVANAGARI, held=args.held),
    )
    dump_yaml(
        chapter / "transliteration" / "latin.yaml",
        build_map(source, script="latin", target_scheme=sanscript.IAST, held=args.held),
    )
    print(f"Wrote transliteration drafts under {chapter / 'transliteration'}")


if __name__ == "__main__":
    main()
