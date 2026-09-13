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
from datetime import datetime, timezone
from pathlib import Path

import yaml

from publication_holds import load_publication_holds

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
    if source_labels.get("title", meta["title"]) != meta["title"]:
        raise ValueError(f"labels.title must match meta.title: {source_path}")

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


def add_compatibility_views(written, manifest_chapters):
    config = json.loads((REPO_ROOT / "catalog-compatibility.json").read_text(encoding="utf-8"))
    entries = {entry["path"]: entry for entry in manifest_chapters}
    seen_paths = set()
    for mapping in config["chapters"]:
        canonical_path = mapping["canonicalPath"]
        legacy_path = mapping["legacyPath"]
        for relative_path in (canonical_path, legacy_path):
            path = Path(relative_path)
            if path.is_absolute() or ".." in path.parts or path.suffix != ".json" or relative_path in seen_paths:
                raise ValueError(f"Invalid or duplicate compatibility path: {relative_path}")
            seen_paths.add(relative_path)
        if mapping["clientPath"] not in (canonical_path, legacy_path):
            raise ValueError(f"Unknown client path for {canonical_path}")
        for relative_path, scope in ((canonical_path, config["canonicalScope"]), (legacy_path, config["legacyScope"])):
            expected = f'{scope["board"]}/{scope["state"]}/{scope["medium"]}/Grade{scope["grade"]}/{scope["subject"]}/{mapping["slug"]}.json'
            if relative_path != expected:
                raise ValueError(f"Compatibility path does not match its scope: {relative_path}")
        entry = entries[canonical_path]
        if entry["slug"] != mapping["slug"] or any(entry[key] != value for key, value in config["canonicalScope"].items()):
            raise ValueError(f"Compatibility source identity mismatch: {canonical_path}")
        if legacy_path in entries or API_DIR / legacy_path in written:
            raise ValueError(f"Compatibility output collides with source: {legacy_path}")
        canonical = written[API_DIR / canonical_path]
        legacy = {**canonical, "meta": {**canonical["meta"], **config["legacyScope"]}}
        written[API_DIR / legacy_path] = legacy
        manifest_chapters.append({
            **entry,
            **config["legacyScope"],
            "path": legacy_path,
            "contentHash": content_hash(legacy),
        })


def build_all():
    manifest_chapters = []
    written = {}
    holds = load_publication_holds(REPO_ROOT)

    for chapter_dir in find_chapter_dirs(REPO_ROOT):
        if chapter_dir.relative_to(REPO_ROOT).as_posix() in holds:
            continue
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
            title_labels = compiled["labels"].get("title", {})
            for field, codes in (("titleTranslations", langs_available), ("titleTransliterations", scripts_available)):
                titles = {code: title_labels[code] for code in codes if code in title_labels}
                if titles:
                    manifest_chapters[-1][field] = titles

    add_compatibility_views(written, manifest_chapters)
    manifest_chapters.sort(key=lambda c: (c["board"], c["state"], c["medium"], c["grade"], c["subject"], c["chapter"]))

    # Only bump generatedAt when the chapter list actually changed — a
    # timestamp that moved on every run regardless of content would make
    # `--check` fail spuriously (bytes always differ from whatever's
    # committed) and would defeat the mobile app's whole reason for wanting
    # it: a stable value it can compare against to know whether a
    # background refetch actually found anything new.
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    existing_path = API_DIR / "contents.json"
    if existing_path.exists():
        try:
            existing = json.loads(existing_path.read_text(encoding="utf-8"))
            if existing.get("chapters") == manifest_chapters:
                generated_at = existing.get("generatedAt", generated_at)
        except (json.JSONDecodeError, OSError):
            pass

    manifest = {"schemaVersion": SCHEMA_VERSION, "generatedAt": generated_at, "chapters": manifest_chapters}
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
