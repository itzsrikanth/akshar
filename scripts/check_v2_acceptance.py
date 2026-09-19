#!/usr/bin/env python3
"""Repeatable v1/v2 acceptance spot-checks for the publication migration.

Wired into scripts/check.py so CI and pre-push cover contract invariants that
device testing alone can miss. Does not retire v1 or require a mobile device.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
BOOK_ID = "ktbs-savi-kannada-g3-fl-p1"
EDITION_ID = "2026-27"
EXPECTED_V1_CHAPTERS = 16
EXPECTED_V2_PUBLISHED = 8
EXPECTED_ADOPTIONS = {
    "savi-kannada-grade3-first-language",
    "savi-kannada-grade5-second-language",
}


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> int:
    root = REPO_ROOT
    if len(sys.argv) > 1:
        root = Path(sys.argv[1]).resolve()

    v1_path = root / "api" / "contents.json"
    v2_path = root / "api" / "v2" / "contents.json"
    holds_path = root / "api-publication-holds.json"
    edition_path = root / "content" / "books" / BOOK_ID / "editions" / EDITION_ID / "edition.yaml"

    for path in (v1_path, v2_path, holds_path, edition_path):
        if not path.is_file():
            fail(f"missing required file: {path.relative_to(root)}")

    v1 = json.loads(v1_path.read_text(encoding="utf-8"))
    v2 = json.loads(v2_path.read_text(encoding="utf-8"))
    holds = json.loads(holds_path.read_text(encoding="utf-8"))
    edition = yaml.safe_load(edition_path.read_text(encoding="utf-8"))

    if v1.get("schemaVersion") != "1.0":
        fail(f"unexpected v1 schemaVersion: {v1.get('schemaVersion')!r}")
    if v2.get("schemaVersion") != "2.0":
        fail(f"unexpected v2 schemaVersion: {v2.get('schemaVersion')!r}")

    v1_chapters = v1.get("chapters") or []
    if len(v1_chapters) != EXPECTED_V1_CHAPTERS:
        fail(f"expected {EXPECTED_V1_CHAPTERS} v1 catalog chapters, got {len(v1_chapters)}")

    v2_chapters = v2.get("chapters") or []
    if len(v2_chapters) != EXPECTED_V2_PUBLISHED:
        fail(f"expected {EXPECTED_V2_PUBLISHED} published v2 chapters, got {len(v2_chapters)}")

    adoption_ids = {a.get("id") for a in (v2.get("adoptions") or [])}
    if adoption_ids != EXPECTED_ADOPTIONS:
        fail(f"unexpected adoptions: {sorted(adoption_ids)}")

    held_paths = {entry["path"] for entry in holds.get("chapters") or []}
    if not held_paths:
        fail("api-publication-holds.json has no chapters")

    edition_chapters = edition.get("chapters") or []
    held_ids = {ch["id"] for ch in edition_chapters if ch.get("held")}
    published_ids = {ch["id"] for ch in edition_chapters if not ch.get("held")}

    v2_ids = {c["chapterId"] for c in v2_chapters}
    leaked = held_ids & v2_ids
    if leaked:
        fail(f"held chapters leaked into api/v2 catalog: {sorted(leaked)}")
    if published_ids != v2_ids:
        fail(f"v2 catalog chapters mismatch edition published set: {sorted(published_ids ^ v2_ids)}")

    for edition_record in v2.get("editions") or []:
        for ch in edition_record.get("chapters") or []:
            if ch["id"] in held_ids and not ch.get("held"):
                fail(f"v2 edition ref missing held:true for {ch['id']}")
            if ch["id"] not in held_ids and ch.get("held"):
                fail(f"v2 edition marks published chapter held: {ch['id']}")
            payload = (
                root
                / "api"
                / "v2"
                / "books"
                / BOOK_ID
                / "editions"
                / EDITION_ID
                / "chapters"
                / f"{ch['id']}.json"
            )
            if ch.get("held"):
                if payload.exists():
                    fail(f"held chapter has production v2 payload: {payload.relative_to(root)}")
            elif not payload.is_file():
                fail(f"published chapter missing v2 payload: {payload.relative_to(root)}")

    for ch in edition_chapters:
        legacy = ch.get("legacyPath")
        former = ch.get("formerPath")
        if not isinstance(legacy, str) or not (root / legacy).is_dir():
            fail(f"edition chapter {ch.get('id')!r} legacyPath missing on disk: {legacy!r}")
        if not isinstance(former, str) or not former.startswith("KSEEB/"):
            fail(f"edition chapter {ch.get('id')!r} missing formerPath evidence")
        if ch.get("held") and legacy not in held_paths:
            fail(f"held edition chapter not listed in holds: {legacy}")
        if not ch.get("held") and legacy in held_paths:
            fail(f"published chapter listed in holds: {legacy}")

    for relative in held_paths:
        chapter_dir = root / relative
        if not chapter_dir.is_dir() or not list(chapter_dir.glob("source.*.yaml")):
            fail(f"held chapter path missing source: {relative}")
        cid = chapter_dir.name
        payload = (
            root / "api" / "v2" / "books" / BOOK_ID / "editions" / EDITION_ID / "chapters" / f"{cid}.json"
        )
        if payload.exists():
            fail(f"held chapter has production v2 payload: {payload.relative_to(root)}")

    grade4_api = root / "api" / "KSEEB" / "Karnataka" / "Kannada" / "Grade4"
    if grade4_api.exists() and any(grade4_api.rglob("*.json")):
        fail("held Grade 4 chapters must not appear under api/KSEEB/.../Grade4")

    print("v2 acceptance spot-checks passed.")
    print(f"  v1 chapters: {len(v1_chapters)}")
    print(f"  v2 published chapters: {len(v2_chapters)}")
    print(f"  held chapters: {len(held_paths)}")
    print(f"  adoptions: {len(adoption_ids)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(f"v2 acceptance failed: {error}", file=sys.stderr)
        raise SystemExit(1)
