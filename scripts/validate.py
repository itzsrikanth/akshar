#!/usr/bin/env python3
"""Validate Akshar content: JSON-schema conformance, structural checks, and encoding checks.

Usage:
    python3 scripts/validate.py
"""
import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = REPO_ROOT / "schema"

SOURCE_SCHEMA = json.loads((SCHEMA_DIR / "source.schema.json").read_text(encoding="utf-8"))
CONTRIBUTOR_SCHEMA = json.loads((SCHEMA_DIR / "contributor.schema.json").read_text(encoding="utf-8"))

INVISIBLE_CHARS = {
    "﻿": "BOM / zero-width no-break space (U+FEFF)",
    "�": "replacement character (U+FFFD) — indicates a prior encoding error",
    "​": "zero-width space (U+200B)",
    "‌": "zero-width non-joiner (U+200C)",
    "‍": "zero-width joiner (U+200D)",
    "⁠": "word joiner (U+2060)",
}


class Errors(list):
    def add(self, path, msg):
        self.append(f"{path.relative_to(REPO_ROOT)}: {msg}")


def find_chapter_dirs(root):
    for path in sorted(root.rglob("source.*.yaml")):
        yield path.parent


def check_invisible_chars(path, errors):
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        errors.add(path, "file starts with a UTF-8 BOM — re-save as plain UTF-8 without BOM")
    text = raw.decode("utf-8", errors="replace")
    for ch, desc in INVISIBLE_CHARS.items():
        if ch in text:
            errors.add(path, f"contains {desc}")


def validate_schema(path, data, schema, errors):
    validator = Draft7Validator(schema)
    for err in validator.iter_errors(data):
        loc = "/".join(str(p) for p in err.path) or "(root)"
        errors.add(path, f"schema: {loc}: {err.message}")


def validate_source(path, errors):
    check_invisible_chars(path, errors)
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        errors.add(path, "empty or invalid YAML")
        return None

    validate_schema(path, data, SOURCE_SCHEMA, errors)

    segments = data.get("segments") or []
    ids = [s.get("id") for s in segments if isinstance(s, dict) and "id" in s]
    seen = set()
    for sid in ids:
        if sid in seen:
            errors.add(path, f"duplicate segment id: {sid!r}")
        seen.add(sid)
    id_set = set(ids)

    for s in segments:
        if isinstance(s, dict) and "ref" in s and s["ref"] not in id_set:
            errors.add(path, f"segment {s.get('id')!r} has ref {s['ref']!r} which does not match any segment id")

    meta = data.get("meta") or {}
    slug = meta.get("slug")
    if slug and path.parent.name != slug:
        errors.add(path, f"meta.slug ({slug!r}) does not match folder name ({path.parent.name!r})")

    parts = path.relative_to(REPO_ROOT).parts
    if len(parts) == 7:
        board, state, medium, grade_part, subject, _chapter, _filename = parts
        for key, actual in (("board", board), ("state", state), ("medium", medium), ("subject", subject)):
            expected = meta.get(key)
            if expected is not None and str(expected) != actual:
                errors.add(path, f"meta.{key} ({expected!r}) does not match path segment ({actual!r})")
        grade = meta.get("grade")
        if grade is not None:
            expected_grade_part = f"Grade{grade}"
            if grade_part != expected_grade_part:
                errors.add(
                    path,
                    f"meta.grade ({grade!r}) — expected folder {expected_grade_part!r}, found {grade_part!r}",
                )
    else:
        errors.add(
            path,
            "unexpected path depth — expected "
            "{board}/{state}/{medium}/{grade}/{subject}/{chapter}/source.*.yaml, got "
            f"{path.relative_to(REPO_ROOT)}",
        )

    return id_set


def validate_contributor(path, source_ids_by_filename, errors):
    check_invisible_chars(path, errors)
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        errors.add(path, "empty or invalid YAML")
        return

    validate_schema(path, data, CONTRIBUTOR_SCHEMA, errors)

    meta = data.get("meta") or {}
    source_name = meta.get("source")
    if not source_name:
        return

    source_ids = source_ids_by_filename.get(source_name)
    if source_ids is None:
        errors.add(path, f"meta.source ({source_name!r}) does not match any source.*.yaml file in this chapter")
        return

    for key in data:
        if key == "meta":
            continue
        if key not in source_ids:
            errors.add(path, f"id {key!r} does not exist in {source_name}")


def main():
    errors = Errors()

    for chapter_dir in find_chapter_dirs(REPO_ROOT):
        source_ids_by_filename = {}
        for source_path in sorted(chapter_dir.glob("source.*.yaml")):
            ids = validate_source(source_path, errors)
            if ids is not None:
                source_ids_by_filename[source_path.name] = ids

        for sub in ("transliteration", "translation"):
            folder = chapter_dir / sub
            if folder.is_dir():
                for f in sorted(folder.glob("*.yaml")):
                    validate_contributor(f, source_ids_by_filename, errors)

    if errors:
        print(f"{len(errors)} validation error(s):\n")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print("All content files valid.")


if __name__ == "__main__":
    main()
