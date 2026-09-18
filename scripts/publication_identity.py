"""Validate publication identity metadata (book / edition / adoption)."""

from __future__ import annotations

import json
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

SCHEMA_DIR = Path(__file__).resolve().parent.parent / "schema"
BOOK_SCHEMA = json.loads((SCHEMA_DIR / "book.schema.json").read_text(encoding="utf-8"))
EDITION_SCHEMA = json.loads((SCHEMA_DIR / "edition.schema.json").read_text(encoding="utf-8"))
ADOPTIONS_SCHEMA = json.loads((SCHEMA_DIR / "adoptions.schema.json").read_text(encoding="utf-8"))

PUBLICATION_ROOTS = (
    Path("fixtures/publication"),
    Path("content"),
)


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def validate_schema(path, data, schema, errors):
    validator = Draft7Validator(schema)
    for err in validator.iter_errors(data):
        loc = "/".join(str(p) for p in err.path) or "(root)"
        errors.add(path, f"schema: {loc}: {err.message}")


def discovery_roots(repo_root: Path):
    roots = []
    for relative in PUBLICATION_ROOTS:
        path = repo_root / relative
        if path.is_dir():
            roots.append(path)
    return roots


def find_book_files(repo_root: Path):
    for root in discovery_roots(repo_root):
        for path in sorted(root.glob("books/*/book.yaml")):
            yield path


def find_edition_files(repo_root: Path):
    for root in discovery_roots(repo_root):
        for path in sorted(root.glob("books/*/editions/*/edition.yaml")):
            yield path


def find_adoption_files(repo_root: Path):
    for root in discovery_roots(repo_root):
        catalog = root / "catalog" / "adoptions.yaml"
        if catalog.is_file():
            yield catalog


def is_safe_relative(path: Path) -> bool:
    return not path.is_absolute() and ".." not in path.parts


def validate_publication_identity(repo_root: Path, errors, holds: dict | None = None):
    """Validate book/edition/adoption fixtures and optional content/ metadata.

    `holds` maps legacy chapter path (posix) -> reason, from load_publication_holds.
    """
    books = {}
    editions_by_book = {}
    edition_keys = set()

    for path in find_book_files(repo_root):
        data = load_yaml(path)
        if not isinstance(data, dict):
            errors.add(path, "empty or invalid YAML")
            continue
        validate_schema(path, data, BOOK_SCHEMA, errors)
        book_id = data.get("id")
        if not isinstance(book_id, str):
            continue
        expected_dir = path.parent.name
        if book_id != expected_dir:
            errors.add(path, f"book id {book_id!r} does not match folder name {expected_dir!r}")
        if book_id in books:
            errors.add(path, f"duplicate book id: {book_id!r}")
        books[book_id] = data

    for path in find_edition_files(repo_root):
        data = load_yaml(path)
        if not isinstance(data, dict):
            errors.add(path, "empty or invalid YAML")
            continue
        validate_schema(path, data, EDITION_SCHEMA, errors)
        edition_id = data.get("id")
        book_id = data.get("bookId")
        if not isinstance(edition_id, str) or not isinstance(book_id, str):
            continue

        expected_book_dir = path.parent.parent.parent.name
        expected_edition_dir = path.parent.name
        if book_id != expected_book_dir:
            errors.add(path, f"bookId {book_id!r} does not match book folder {expected_book_dir!r}")
        if edition_id != expected_edition_dir:
            errors.add(path, f"edition id {edition_id!r} does not match folder {expected_edition_dir!r}")
        if book_id not in books:
            errors.add(path, f"bookId {book_id!r} has no matching book.yaml")

        key = (book_id, edition_id)
        if key in edition_keys:
            errors.add(path, f"duplicate edition: {book_id}/{edition_id}")
        edition_keys.add(key)
        editions_by_book.setdefault(book_id, {})[edition_id] = data

        chapters = data.get("chapters") or []
        seen_chapter_ids = set()
        seen_numbers = set()
        seen_legacy = set()
        for chapter in chapters:
            if not isinstance(chapter, dict):
                continue
            chapter_id = chapter.get("id")
            number = chapter.get("number")
            legacy = chapter.get("legacyPath")
            held_flag = bool(chapter.get("held"))

            if isinstance(chapter_id, str):
                if chapter_id in seen_chapter_ids:
                    errors.add(path, f"duplicate chapter id within edition: {chapter_id!r}")
                seen_chapter_ids.add(chapter_id)
            if isinstance(number, int):
                if number in seen_numbers:
                    errors.add(path, f"duplicate chapter number within edition: {number}")
                seen_numbers.add(number)
            if not isinstance(legacy, str) or not legacy:
                continue
            if legacy in seen_legacy:
                errors.add(path, f"duplicate legacyPath within edition: {legacy!r}")
            seen_legacy.add(legacy)

            legacy_path = Path(legacy)
            if not is_safe_relative(legacy_path):
                errors.add(path, f"unsafe legacyPath: {legacy!r}")
                continue
            chapter_dir = repo_root / legacy_path
            if not chapter_dir.is_dir():
                errors.add(path, f"legacyPath does not exist: {legacy!r}")
            elif not list(chapter_dir.glob("source.*.yaml")):
                errors.add(path, f"legacyPath has no source.*.yaml: {legacy!r}")

            if holds is not None:
                held_by_config = legacy in holds
                if held_flag and not held_by_config:
                    errors.add(
                        path,
                        f"chapter {chapter_id!r} is marked held but missing from api-publication-holds.json ({legacy})",
                    )
                if held_by_config and not held_flag:
                    errors.add(
                        path,
                        f"chapter {chapter_id!r} path is held in api-publication-holds.json but edition entry lacks held: true ({legacy})",
                    )

    for path in find_adoption_files(repo_root):
        data = load_yaml(path)
        if not isinstance(data, dict):
            errors.add(path, "empty or invalid YAML")
            continue
        validate_schema(path, data, ADOPTIONS_SCHEMA, errors)
        seen_adoption_ids = set()
        for adoption in data.get("adoptions") or []:
            if not isinstance(adoption, dict):
                continue
            adoption_id = adoption.get("id")
            book_id = adoption.get("bookId")
            edition_id = adoption.get("editionId")
            if isinstance(adoption_id, str):
                if adoption_id in seen_adoption_ids:
                    errors.add(path, f"duplicate adoption id: {adoption_id!r}")
                seen_adoption_ids.add(adoption_id)
            if not isinstance(book_id, str) or not isinstance(edition_id, str):
                continue
            if book_id not in books:
                errors.add(path, f"adoption {adoption_id!r} references unknown bookId {book_id!r}")
            elif edition_id not in editions_by_book.get(book_id, {}):
                errors.add(
                    path,
                    f"adoption {adoption_id!r} references unknown edition {book_id}/{edition_id}",
                )

    return {
        "books": books,
        "editions_by_book": editions_by_book,
    }
