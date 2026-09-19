#!/usr/bin/env python3
"""Filesystem + optional HTTP smoke for the v2 cutover contract.

Usage:
  python3 scripts/smoke_v2_cutover.py
  python3 scripts/smoke_v2_cutover.py --base-url http://127.0.0.1:8787
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BOOK_ID = "ktbs-savi-kannada-g3-fl-p1"
EDITION_ID = "2026-27"


def fail(msg: str) -> None:
    raise AssertionError(msg)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fetch_json(base_url: str, relative: str):
    url = f"{base_url.rstrip('/')}/{relative.lstrip('/')}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            if response.status != 200:
                fail(f"{url} returned {response.status}")
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        fail(f"{url} HTTP {error.code}")
    except urllib.error.URLError as error:
        fail(f"{url} unreachable: {error.reason}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", help="Optional content-server origin, e.g. http://127.0.0.1:8787")
    args = parser.parse_args()

    v2 = load_json(REPO_ROOT / "api" / "v2" / "contents.json")
    if v2.get("schemaVersion") != "2.0":
        fail("v2 schemaVersion must be 2.0")
    chapters = v2.get("chapters") or []
    if len(chapters) != 8:
        fail(f"expected 8 published chapters, got {len(chapters)}")

    for chapter in chapters:
        relative = chapter["path"]
        path = REPO_ROOT / "api" / "v2" / relative
        if not path.is_file():
            fail(f"missing payload: {relative}")
        payload = load_json(path)
        identity = payload.get("identity") or {}
        expected = {
            "bookId": chapter["bookId"],
            "editionId": chapter["editionId"],
            "chapterId": chapter["chapterId"],
        }
        for key, value in expected.items():
            if identity.get(key) != value:
                fail(f"identity mismatch in {relative}: {key}={identity.get(key)!r} want {value!r}")
        if payload.get("schemaVersion") != "2.0":
            fail(f"bad schemaVersion in {relative}")
        if not payload.get("segments"):
            fail(f"no segments in {relative}")

    # Held chapters must 404 / be absent
    holds = load_json(REPO_ROOT / "api-publication-holds.json")
    for entry in holds.get("chapters") or []:
        cid = Path(entry["path"]).name
        payload = REPO_ROOT / "api" / "v2" / "books" / BOOK_ID / "editions" / EDITION_ID / "chapters" / f"{cid}.json"
        if payload.exists():
            fail(f"held payload present: {payload.relative_to(REPO_ROOT)}")

    # Dual adoptions share the same eight chapter ids
    adoptions = v2.get("adoptions") or []
    if len(adoptions) != 2:
        fail("expected two adoptions")
    edition_ids = {(a["bookId"], a["editionId"]) for a in adoptions}
    if edition_ids != {(BOOK_ID, EDITION_ID)}:
        fail(f"adoptions must point at pilot edition, got {edition_ids}")

    if args.base_url:
        remote = fetch_json(args.base_url, "api/v2/contents.json")
        if remote.get("chapters") != chapters:
            fail("HTTP catalog chapters differ from filesystem api/v2/contents.json")
        for chapter in chapters:
            fetch_json(args.base_url, f"api/v2/{chapter['path']}")
        # Sample held URL must 404
        held_id = Path(holds["chapters"][0]["path"]).name
        held_url = f"{args.base_url.rstrip('/')}/api/v2/books/{BOOK_ID}/editions/{EDITION_ID}/chapters/{held_id}.json"
        try:
            with urllib.request.urlopen(held_url, timeout=10) as response:
                fail(f"held URL unexpectedly {response.status}: {held_url}")
        except urllib.error.HTTPError as error:
            if error.code != 404:
                fail(f"held URL expected 404, got {error.code}")
        print(f"HTTP smoke against {args.base_url} passed.")

    print("v2 cutover smoke passed.")
    print(f"  published chapters: {len(chapters)}")
    print(f"  held chapters: {len(holds.get('chapters') or [])}")
    print(f"  adoptions: {len(adoptions)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(f"v2 cutover smoke failed: {error}", file=sys.stderr)
        raise SystemExit(1)
