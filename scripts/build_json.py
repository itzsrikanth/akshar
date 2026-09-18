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
from publication_identity import (
    find_adoption_files,
    find_book_files,
    find_edition_files,
    load_yaml as load_identity_yaml,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
API_DIR = REPO_ROOT / "api"
API_V2_DIR = API_DIR / "v2"
SCHEMA_VERSION = "1.0"
SCHEMA_VERSION_V2 = "2.0"

SKIP_CHAPTER_ROOT_PREFIXES = (
    "fixtures/",
    "apps/",
    "packages/",
    "api/",
    "content/",
)


def find_chapter_dirs(root):
    for path in sorted(root.rglob("source.*.yaml")):
        relative = path.relative_to(root).as_posix()
        if any(relative.startswith(prefix) for prefix in SKIP_CHAPTER_ROOT_PREFIXES):
            continue
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


def chapter_source_path(chapter_dir: Path) -> Path:
    sources = sorted(chapter_dir.glob("source.*.yaml"))
    if not sources:
        raise ValueError(f"No source.*.yaml in {chapter_dir}")
    if len(sources) > 1:
        raise ValueError(f"Multiple source files in {chapter_dir}; v2 expects one")
    return sources[0]


def build_v2(holds):
    """Compile publication fixtures into api/v2/ without touching v1 paths."""
    books = []
    editions = []
    chapters_manifest = []
    written = {}

    books_by_id = {}
    for book_path in find_book_files(REPO_ROOT):
        book = load_identity_yaml(book_path)
        books_by_id[book["id"]] = book
        books.append({
            "id": book["id"],
            "title": book["title"],
            "publisher": book["publisher"],
            "subjectLanguage": book["subjectLanguage"],
            **{k: book[k] for k in ("series", "volume", "part") if k in book},
        })

    for edition_path in find_edition_files(REPO_ROOT):
        edition = load_identity_yaml(edition_path)
        book_id = edition["bookId"]
        edition_id = edition["id"]
        if book_id not in books_by_id:
            raise ValueError(f"Edition references unknown book: {book_id}")

        edition_record = {
            "id": edition_id,
            "bookId": book_id,
            "label": edition["label"],
            "printedGrade": edition["printedGrade"],
            "languageRole": edition["languageRole"],
            "license": edition["license"],
            "chapters": [],
        }
        for optional in ("academicYears", "isbns", "provenance"):
            if optional in edition:
                edition_record[optional] = edition[optional]

        for chapter in edition["chapters"]:
            chapter_id = chapter["id"]
            legacy_path = chapter["legacyPath"]
            held_flag = bool(chapter.get("held")) or legacy_path in holds
            chapter_entry = {
                "id": chapter_id,
                "number": chapter["number"],
                "held": held_flag,
            }
            if "title" in chapter:
                chapter_entry["title"] = chapter["title"]
            edition_record["chapters"].append(chapter_entry)

            if held_flag:
                continue

            chapter_dir = REPO_ROOT / legacy_path
            source_path = chapter_source_path(chapter_dir)
            compiled, scripts_available, langs_available = compile_chapter(chapter_dir, source_path)
            payload = {
                "schemaVersion": SCHEMA_VERSION_V2,
                "identity": {
                    "bookId": book_id,
                    "editionId": edition_id,
                    "chapterId": chapter_id,
                    "number": chapter["number"],
                },
                "meta": compiled["meta"],
                "labels": compiled["labels"],
                "segments": compiled["segments"],
            }
            relative = f"books/{book_id}/editions/{edition_id}/chapters/{chapter_id}.json"
            out_path = API_V2_DIR / relative
            written[out_path] = payload
            hash_value = content_hash(payload)
            chapters_manifest.append({
                "bookId": book_id,
                "editionId": edition_id,
                "chapterId": chapter_id,
                "number": chapter["number"],
                "title": chapter.get("title") or compiled["meta"]["title"],
                "path": relative,
                "transliterations": scripts_available,
                "translations": langs_available,
                "contentHash": hash_value,
            })
            title_labels = compiled["labels"].get("title", {})
            for field, codes in (("titleTranslations", langs_available), ("titleTransliterations", scripts_available)):
                titles = {code: title_labels[code] for code in codes if code in title_labels}
                if titles:
                    chapters_manifest[-1][field] = titles

        editions.append(edition_record)

    adoptions = []
    for adoption_path in find_adoption_files(REPO_ROOT):
        data = load_identity_yaml(adoption_path)
        adoptions.extend(data.get("adoptions") or [])

    chapters_manifest.sort(key=lambda c: (c["bookId"], c["editionId"], c["number"], c["chapterId"]))
    books.sort(key=lambda b: b["id"])
    editions.sort(key=lambda e: (e["bookId"], e["id"]))
    adoptions.sort(key=lambda a: a["id"])

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    existing_path = API_V2_DIR / "contents.json"
    if existing_path.exists():
        try:
            existing = json.loads(existing_path.read_text(encoding="utf-8"))
            stable = {
                "books": books,
                "editions": editions,
                "adoptions": adoptions,
                "chapters": chapters_manifest,
            }
            prior = {
                "books": existing.get("books"),
                "editions": existing.get("editions"),
                "adoptions": existing.get("adoptions"),
                "chapters": existing.get("chapters"),
            }
            if prior == stable:
                generated_at = existing.get("generatedAt", generated_at)
        except (json.JSONDecodeError, OSError):
            pass

    written[API_V2_DIR / "contents.json"] = {
        "schemaVersion": SCHEMA_VERSION_V2,
        "generatedAt": generated_at,
        "books": books,
        "editions": editions,
        "adoptions": adoptions,
        "chapters": chapters_manifest,
    }
    return written


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
    written.update(build_v2(holds))
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
