#!/usr/bin/env python3
"""Split verified textbook pages and create temporary extraction drafts, never canonical YAML."""

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("book_id")
    parser.add_argument("--chapter", type=int, required=True)
    parser.add_argument("--first-page", type=int, required=True, help="1-based PDF page, inclusive")
    parser.add_argument("--last-page", type=int, required=True, help="1-based PDF page, inclusive")
    parser.add_argument("--directory", type=Path, default=Path("/tmp/akshar-kannada-2026-27"))
    parser.add_argument("--converter", type=Path, help="Optional external ASCII2Unicode knconverter executable source")
    args = parser.parse_args()
    if args.directory.resolve().is_relative_to(ROOT):
        parser.error("Keep conversion working files outside the public repository")
    manifest = json.loads((ROOT / "docs/kannada-pdf-inventory.json").read_text())
    entry = next((book for book in manifest["books"] if book["id"] == args.book_id), None)
    if not entry or not entry["sha256"]:
        parser.error("Download and record the book checksum first with scripts/fetch_kannada.py")
    source = args.directory / entry["filename"]
    with source.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    if digest != entry["sha256"]:
        parser.error("PDF checksum differs from the inventory; review the source instead of overwriting evidence")
    with fitz.open(source) as document:
        if not 1 <= args.first_page <= args.last_page <= len(document) or args.chapter < 1:
            parser.error("Invalid chapter/page interval")
        directory = args.directory / f"{args.book_id}-ch{args.chapter:02d}"
        directory.mkdir(parents=True, exist_ok=True)
        output_pdf = directory / "chapter.pdf"
        with fitz.open() as chapter:
            chapter.insert_pdf(document, from_page=args.first_page - 1, to_page=args.last_page - 1)
            chapter.save(output_pdf)
        draft = []
        raw = []
        for page_number in range(args.first_page, args.last_page + 1):
            page = document[page_number - 1]
            marker = f"\n=== PDF PAGE {page_number}; DRAFT REQUIRES VISUAL REVIEW ===\n"
            raw.append(marker + page.get_text(sort=True))
            draft.append(marker)
            page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(directory / f"pdf-page-{page_number}.png")
            for block in page.get_text("dict", sort=True)["blocks"]:
                for line in block.get("lines", []):
                    parts = []
                    for span in line["spans"]:
                        text = span["text"]
                        if args.converter and span["font"].lower().startswith("nudi"):
                            try:
                                result = subprocess.run([sys.executable, str(args.converter)], input=text.encode("cp1252"), capture_output=True, check=True)
                                text = result.stdout.decode("utf-8").strip()
                            except (UnicodeError, subprocess.CalledProcessError):
                                text = f"[UNCONVERTED {span['font']}: {text}]"
                        elif span["font"].lower().startswith("nudi"):
                            text = f"[LEGACY {span['font']}: {text}]"
                        parts.append(text)
                    draft.append("".join(parts))
        (directory / "raw-extraction.txt").write_text("\n".join(raw), encoding="utf-8")
        (directory / "unicode-draft.txt").write_text("\n".join(draft), encoding="utf-8")
        print(f"Prepared PDF pages {args.first_page}–{args.last_page} in {directory}; no canonical content written.")


if __name__ == "__main__":
    main()
