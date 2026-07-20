#!/usr/bin/env python3
"""Compile each chapter's YAML (source + transliteration + translation + labels) into one
denormalized JSON file under api/, plus a top-level api/contents.json manifest.

This is the machine-readable API for downstream apps — flat, presentation-agnostic, and
generic across segment types (it never branches on `type`; see AGENTS.md).

Usage:
    python3 scripts/build_json.py            # write api/**/*.json
    python3 scripts/build_json.py --check     # exit 1 if any compiled file is stale/missing
"""
import hashlib
import json
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
API_DIR = REPO_ROOT / "api"
SCHEMA_VERSION = "1.0"


def find_chapter_dirs(root):
    for path in sorted(root.rglob("source.*.yaml")):
        yield path.parent


def load_yaml(path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def load_contributor_files(chapter_dir, subfolder):
    result = {}
    folder = chapter_dir / subfolder
    if not folder.is_dir():
        return result
    for f in sorted(folder.glob("*.yaml")):
        result[f.stem] = load_yaml(f) or {}
    return result


def source_lang_code(source_path):
    # source.kn.yaml -> "kn"
    return source_path.name.removeprefix("source.").removesuffix(".yaml")


def canonical_json_bytes(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def content_hash(data):
    return hashlib.sha256(canonical_json_bytes(data)).hexdigest()[:16]


def compile_chapter(chapter_dir, source_path):
    source = load_yaml(source_path)
    meta = source["meta"]
    segments = source["segments"]
    src_lang = source_lang_code(source_path)
    source_labels = source.get("labels") or {}

    translits = load_contributor_files(chapter_dir, "transliteration")
    translations = load_contributor_files(chapter_dir, "translation")

    labels = {}
    for key, text in source_labels.items():
        labels.setdefault(key, {})[src_lang] = text
    for script, data in translits.items():
        for key, text in (data.get("labels") or {}).items():
            labels.setdefault(key, {})[script] = text
    for lang, data in translations.items():
        for key, text in (data.get("labels") or {}).items():
            labels.setdefault(key, {})[lang] = text

    compiled_segments = []
    for seg in segments:
        compiled = dict(seg)
        seg_id = seg["id"]
        seg_translits = {script: data[seg_id] for script, data in translits.items() if seg_id in data}
        seg_translations = {lang: data[seg_id] for lang, data in translations.items() if seg_id in data}
        if seg_translits:
            compiled["transliterations"] = seg_translits
        if seg_translations:
            compiled["translations"] = seg_translations
        compiled_segments.append(compiled)

    return {
        "schemaVersion": SCHEMA_VERSION,
        "meta": meta,
        "labels": labels,
        "segments": compiled_segments,
    }, sorted(translits.keys()), sorted(translations.keys())


def api_path_for(source_path):
    chapter_dir = source_path.parent
    rel_parts = chapter_dir.relative_to(REPO_ROOT).parts  # board/state/medium/Grade{n}/subject/slug
    *parent_parts, slug = rel_parts
    return API_DIR.joinpath(*parent_parts, f"{slug}.json")


def build_all():
    manifest_chapters = []
    written = {}

    for chapter_dir in find_chapter_dirs(REPO_ROOT):
        for source_path in sorted(chapter_dir.glob("source.*.yaml")):
            compiled, scripts_available, langs_available = compile_chapter(chapter_dir, source_path)
            out_path = api_path_for(source_path)
            written[out_path] = compiled

            meta = compiled["meta"]
            manifest_chapters.append({
                "board": meta["board"],
                "state": meta["state"],
                "medium": meta["medium"],
                "grade": meta["grade"],
                "subject": meta["subject"],
                "chapter": meta["chapter"],
                "slug": meta["slug"],
                "title": meta["title"],
                "path": str(out_path.relative_to(API_DIR)),
                "transliterations": scripts_available,
                "translations": langs_available,
                "contentHash": content_hash(compiled),
            })

    manifest_chapters.sort(key=lambda c: (c["board"], c["state"], c["medium"], c["grade"], c["subject"], c["chapter"]))
    manifest = {"schemaVersion": SCHEMA_VERSION, "chapters": manifest_chapters}
    written[API_DIR / "contents.json"] = manifest
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
            print("Stale or missing compiled JSON:")
            for p in stale:
                print(f"  {p.relative_to(REPO_ROOT)}")
            print("Run `python3 scripts/build_json.py` and commit the result.")
            sys.exit(1)
        print("All compiled JSON is up to date.")


if __name__ == "__main__":
    main()
