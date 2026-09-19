#!/usr/bin/env python3
"""Compile content/lexicons/<lang>/ into api/v2/lexicons/<lang>.json.

Used by build_json.py; can also run standalone:

    python3 scripts/build_lexicon.py
    python3 scripts/build_lexicon.py --check
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

REPO_ROOT = Path(__file__).resolve().parent.parent
LEXICONS_DIR = REPO_ROOT / "content" / "lexicons"
API_LEXICONS_DIR = REPO_ROOT / "api" / "v2" / "lexicons"
BUNDLE_SCHEMA = json.loads(
    (REPO_ROOT / "schema" / "lexicon-bundle.schema.json").read_text(encoding="utf-8")
)


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def canonical_json_bytes(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def content_hash(data):
    # Hash without contentHash field.
    payload = {k: v for k, v in data.items() if k != "contentHash"}
    return hashlib.sha256(canonical_json_bytes(payload)).hexdigest()[:16]


def compile_language(lang_dir: Path) -> dict:
    meta = load_yaml(lang_dir / "meta.yaml")
    func = load_yaml(lang_dir / "function-words.yaml")
    lemmas_doc = load_yaml(lang_dir / "lemmas.yaml")
    forms_doc = load_yaml(lang_dir / "forms.yaml")

    lemmas = {}
    for entry in lemmas_doc.get("lemmas") or []:
        lemmas[entry["id"]] = entry

    forms = {}
    for entry in forms_doc.get("forms") or []:
        forms[entry["form"]] = entry

    # Optional curated overlays (not wiped by the vocab seeder).
    curated_lemmas_path = lang_dir / "curated-lemmas.yaml"
    curated_forms_path = lang_dir / "curated-forms.yaml"
    if curated_lemmas_path.is_file():
        for entry in (load_yaml(curated_lemmas_path).get("lemmas") or []):
            lemmas[entry["id"]] = entry
    if curated_forms_path.is_file():
        for entry in (load_yaml(curated_forms_path).get("forms") or []):
            forms[entry["form"]] = entry

    function_words = sorted({e["form"] for e in (func.get("forms") or [])})

    bundle = {
        "schemaVersion": meta["schemaVersion"],
        "language": meta["language"],
        "license": meta["license"],
        "provenance": meta["provenance"],
        "functionWords": function_words,
        "lemmas": lemmas,
        "forms": forms,
    }
    bundle["contentHash"] = content_hash(bundle)
    Draft7Validator(BUNDLE_SCHEMA).validate(bundle)
    return bundle


def build_all() -> dict[Path, dict]:
    written = {}
    if not LEXICONS_DIR.is_dir():
        return written
    for lang_dir in sorted(p for p in LEXICONS_DIR.iterdir() if p.is_dir()):
        out = API_LEXICONS_DIR / f"{lang_dir.name}.json"
        written[out] = compile_language(lang_dir)
    return written


def main():
    check_only = "--check" in sys.argv
    written = build_all()
    stale = []
    for path, data in written.items():
        rendered = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
        if check_only:
            existing = path.read_text(encoding="utf-8") if path.exists() else None
            if existing != rendered:
                stale.append(path)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(rendered, encoding="utf-8")
            print(f"wrote {path.relative_to(REPO_ROOT)}")

    if check_only:
        if stale:
            print("Stale or missing compiled lexicon JSON:")
            for p in stale:
                print(f"  {p.relative_to(REPO_ROOT)}")
            print("Run `python3 scripts/build_lexicon.py` (or build_json.py) and commit the result.")
            sys.exit(1)
        print(f"All compiled lexicon JSON is up to date ({len(written)} file(s)).")
        return

    if not written:
        print("No lexicons to compile.")


if __name__ == "__main__":
    main()
