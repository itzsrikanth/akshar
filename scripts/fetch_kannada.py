#!/usr/bin/env python3
"""Inventory official Kannada language textbooks and resume verified temporary downloads."""

import argparse
import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
CATALOG_URL = "https://textbooks.karnataka.gov.in/textbooks/en"
MANIFEST = ROOT / "docs/kannada-pdf-inventory.json"


class CatalogParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = set()

    def handle_starttag(self, tag, attributes):
        if tag == "a":
            url = dict(attributes).get("href", "")
            if url.startswith("https://textbooks.karnataka.gov.in/"):
                self.urls.add(url)


def save_manifest(manifest):
    temporary = MANIFEST.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(MANIFEST)


def checksum(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def discover(html_path, previous):
    parser = CatalogParser()
    parser.feed(html_path.read_text(encoding="utf-8"))
    old_entries = {entry["id"]: entry for entry in previous.get("books", [])}
    entries = {}
    for url in sorted(parser.urls):
        filename = unquote(urlparse(url).path).split("/")[-1]
        match = re.fullmatch(r"(\d+)(?:st|nd|rd|th)\s+KANNADA\s+(FL|SL|TL)\s*(?:Part\s*-?\s*(\d+)\s*)?2026-27\.pdf", filename, re.I)
        if not match or "2026-27" not in unquote(url):
            continue
        grade, role, part = match.groups()
        book_id = f"g{int(grade):02d}-{role.lower()}-p{part or 'whole'}"
        if book_id in entries:
            raise ValueError(f"Ambiguous catalog entry: {book_id}; review URLs before proceeding")
        entry = {
            "id": book_id,
            "printedGrade": int(grade),
            "languageRole": {"FL": "first-language", "SL": "second-language", "TL": "third-language"}[role.upper()],
            "part": int(part) if part else None,
            "url": url,
            "filename": f"{book_id}-2026-27.pdf",
            "sha256": None,
            "bytes": None,
            "licenseStatus": "not-yet-verified",
        }
        old = old_entries.get(book_id)
        if old:
            if old["url"] != url:
                raise ValueError(f"Source URL changed for {book_id}; review before replacing provenance")
            entry = old
        entries[book_id] = entry
    if not entries:
        raise ValueError("No matching Kannada PDFs found; refusing to overwrite the inventory")
    for book_id, entry in old_entries.items():
        entries.setdefault(book_id, entry)
    return {"catalogUrl": CATALOG_URL, "academicYear": "2026-27", "books": sorted(entries.values(), key=lambda entry: entry["id"])}


def download(entry, directory):
    if Path(entry["filename"]).name != entry["filename"]:
        raise ValueError("PDF filename must not contain directories")
    destination = directory / entry["filename"]
    expected = entry["sha256"]
    if destination.exists() and expected and checksum(destination) == expected:
        print(f"Verified existing {destination}", flush=True)
        return
    parsed = urlparse(entry["url"])
    if parsed.scheme != "https" or parsed.netloc != "textbooks.karnataka.gov.in":
        raise ValueError("Only the official HTTPS textbook host is allowed")
    temporary = destination.with_suffix(".pdf.part")
    subprocess.run(["curl", "-fsSL", "--retry", "2", "--connect-timeout", "20", "--max-time", "300", entry["url"], "-o", str(temporary)], check=True)
    with temporary.open("rb") as stream:
        if stream.read(5) != b"%PDF-":
            raise ValueError(f"Not a PDF: {entry['id']}; response left at {temporary}")
    actual = checksum(temporary)
    if expected and actual != expected:
        raise ValueError(f"PDF bytes changed for {entry['id']}; preserve and review {temporary}")
    temporary.replace(destination)
    entry["sha256"] = actual
    entry["bytes"] = destination.stat().st_size
    print(f"Downloaded {destination} ({entry['bytes']} bytes; sha256 {actual})", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-html", type=Path, help="Discover from a saved official catalog; otherwise reuse inventory")
    parser.add_argument("--output", type=Path, default=Path("/tmp/akshar-kannada-2026-27"))
    parser.add_argument("--download", nargs="*", default=[], metavar="BOOK_ID")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    if args.catalog_html:
        manifest = discover(args.catalog_html, manifest)
        save_manifest(manifest)
    if not manifest:
        parser.error("Save the official catalog with curl and pass --catalog-html first")
    entries = {entry["id"]: entry for entry in manifest["books"]}
    unknown = set(args.download) - entries.keys()
    if unknown:
        parser.error(f"Unknown book IDs: {sorted(unknown)}")
    args.output.mkdir(parents=True, exist_ok=True)
    for book_id in dict.fromkeys(args.download):
        download(entries[book_id], args.output)
        save_manifest(manifest)
    print(f"Inventory: {len(entries)} books; hashes recorded for {sum(bool(entry['sha256']) for entry in entries.values())}.")


if __name__ == "__main__":
    main()
