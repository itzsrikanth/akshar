#!/usr/bin/env python3
"""Seed content/lexicons/kn/ from printed Savi Kannada FL Part 1 vocabulary.

Scans every `content/books/ktbs-savi-kannada-*-fl-p1` edition (grades 1–8 as
present) for vocabulary_term / vocabulary_definition pairs and their
en/hi/latin contributor maps.

Only terms with a non-empty definition and an ASCII-safe `vocab-*` id are
included. Definitions may be linked via `ref` (Grade 3 style) or via a
sibling segment whose id is `{termId}-def` (Grades 5–8 style). Grades without
printed definitions (e.g. G1/G2 word lists) contribute nothing — no guessed
glosses.

Re-running overwrites seeded lexicon YAML (meta, function words, lemmas, forms).
Curated connecting/function words are the fixed list below, not frequency-mined.

Usage:
    python3 scripts/seed_lexicon_from_vocab.py
"""
from __future__ import annotations

import re
import sys
from collections import OrderedDict
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
BOOKS_ROOT = REPO_ROOT / "content" / "books"
BOOK_GLOB = "ktbs-savi-kannada-*-fl-p1"
EDITION_ID = "2026-27"
OUT_DIR = REPO_ROOT / "content" / "lexicons" / "kn"

# Curated connecting/function words — not inferred from frequency.
FUNCTION_WORDS = [
    "ಮತ್ತು",
    "ಆದರೆ",
    "ಆದರೂ",
    "ಎಂದರೆ",
    "ಎಂದು",
    "ಅಥವಾ",
    "ಇಲ್ಲವೇ",
    "ಹಾಗೂ",
    "ಹಾಗೆ",
    "ಹೀಗೆ",
    "ಅದು",
    "ಇದು",
    "ಅವನು",
    "ಅವಳು",
    "ಅವರು",
    "ನಾನು",
    "ನೀನು",
    "ನಾವು",
    "ನೀವು",
    "ಒಂದು",
    "ಎರಡು",
    "ಈ",
    "ಆ",
    "ಒಂದೇ",
    "ಸಹ",
    "ಕೂಡ",
    "ಮಾತ್ರ",
    "ಇನ್ನೂ",
    "ಈಗ",
    "ನಂತರ",
    "ಮೊದಲು",
    "ನಲ್ಲಿ",
    "ನಿಂದ",
    "ಗೆ",
    "ಕ್ಕೆ",
    "ಯನ್ನು",
    "ವನ್ನು",
    "ಅನ್ನು",
]


class QuotedDumper(yaml.SafeDumper):
    pass


def _str_representer(dumper, data):
    if any(ord(c) > 127 for c in data) or "\n" in data or data == "":
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


QuotedDumper.add_representer(str, _str_representer)


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def lemma_id_from_vocab(vocab_id: str) -> str | None:
    if not vocab_id.startswith("vocab-"):
        return None
    slug = vocab_id[len("vocab-") :]
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        return None
    return f"lemma-{slug}"


def find_definition(segments: list, term_id: str) -> dict | None:
    """Locate the definition for a vocabulary_term.

    Prefer an explicit `ref` link; fall back to id `{termId}-def` used by
    several Savi Kannada editions that omit `ref`.
    """
    for seg in segments:
        if seg.get("type") == "vocabulary_definition" and seg.get("ref") == term_id:
            return seg
    want = f"{term_id}-def"
    for seg in segments:
        if seg.get("type") == "vocabulary_definition" and seg.get("id") == want:
            return seg
    return None


def contributor_map(chapter_dir: Path, kind: str, stem: str) -> dict:
    path = chapter_dir / kind / f"{stem}.yaml"
    if not path.is_file():
        return {}
    data = load_yaml(path)
    return {k: v for k, v in data.items() if k != "meta" and k != "labels" and isinstance(v, str)}


def iter_edition_chapters():
    books = sorted(BOOKS_ROOT.glob(BOOK_GLOB))
    if not books:
        print(f"warning: no books matched {BOOK_GLOB}", file=sys.stderr)
    for book_dir in books:
        chapters_root = book_dir / "editions" / EDITION_ID / "chapters"
        if not chapters_root.is_dir():
            print(
                f"warning: missing chapters root {chapters_root.relative_to(REPO_ROOT)}",
                file=sys.stderr,
            )
            continue
        yield book_dir.name, chapters_root


def collect_vocab():
    lemmas: OrderedDict[str, dict] = OrderedDict()
    forms: OrderedDict[str, dict] = OrderedDict()
    per_book: OrderedDict[str, int] = OrderedDict()

    for book_id, chapters_root in iter_edition_chapters():
        seeded = 0
        for chapter_dir in sorted(chapters_root.iterdir()):
            if not chapter_dir.is_dir():
                continue
            source_path = chapter_dir / "source.kn.yaml"
            if not source_path.is_file():
                continue
            source = load_yaml(source_path)
            segments = source.get("segments") or []
            en = contributor_map(chapter_dir, "translation", "en")
            hi = contributor_map(chapter_dir, "translation", "hi")
            latin = contributor_map(chapter_dir, "transliteration", "latin")

            for seg in segments:
                if seg.get("type") != "vocabulary_term":
                    continue
                term_id = seg["id"]
                lemma_id = lemma_id_from_vocab(term_id)
                if not lemma_id:
                    continue
                defn = find_definition(segments, term_id)
                if not defn or not str(defn.get("text") or "").strip():
                    continue

                lemma_text = str(seg["text"]).strip()
                defn_id = defn.get("id") or f"{term_id}-def"
                glosses = {}
                kn_def = str(defn["text"]).strip()
                if kn_def:
                    glosses["kn"] = kn_def
                en_def = en.get(defn_id) or en.get(f"{term_id}-def") or en.get(term_id)
                if en_def:
                    glosses["en"] = en_def.strip()
                hi_def = hi.get(defn_id) or hi.get(f"{term_id}-def") or hi.get(term_id)
                if hi_def:
                    glosses["hi"] = hi_def.strip()

                ref = {
                    "bookId": book_id,
                    "editionId": EDITION_ID,
                    "chapterId": chapter_dir.name,
                    "segmentId": term_id,
                }

                if lemma_id in lemmas:
                    existing = lemmas[lemma_id]
                    if existing["lemma"] != lemma_text:
                        print(
                            f"warning: lemma text mismatch for {lemma_id}: "
                            f"{existing['lemma']!r} vs {lemma_text!r} — keeping first",
                            file=sys.stderr,
                        )
                    else:
                        existing.setdefault("sourceRefs", []).append(ref)
                        for lang, text in glosses.items():
                            existing.setdefault("glosses", {}).setdefault(lang, text)
                    seeded += 1
                    continue

                entry = {
                    "id": lemma_id,
                    "lemma": lemma_text,
                    "sourceRefs": [ref],
                }
                translit = latin.get(term_id)
                if translit:
                    entry["transliteration"] = translit.strip()
                if glosses:
                    entry["glosses"] = glosses
                lemmas[lemma_id] = entry
                seeded += 1

                if lemma_text not in forms:
                    forms[lemma_text] = {
                        "form": lemma_text,
                        "lemmaIds": [lemma_id],
                        "status": "exact",
                    }
                else:
                    ids = forms[lemma_text]["lemmaIds"]
                    if lemma_id not in ids:
                        ids.append(lemma_id)
                        forms[lemma_text]["status"] = "ambiguous"

        per_book[book_id] = seeded

    return list(lemmas.values()), list(forms.values()), per_book


def dump(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = yaml.dump(
        data,
        Dumper=QuotedDumper,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=120,
    )
    path.write_text(text, encoding="utf-8")
    print(f"wrote {path.relative_to(REPO_ROOT)}")


def main():
    lemmas, forms, per_book = collect_vocab()
    book_list = ", ".join(per_book.keys()) or "(none)"
    per_book_summary = ", ".join(f"{bid}={n}" for bid, n in per_book.items())
    dump(
        OUT_DIR / "meta.yaml",
        {
            "schemaVersion": 1,
            "language": "kn",
            "license": "Derived from textbook vocabulary definitions; see chapter meta.license and contributor licenses",
            "provenance": (
                f"Seeded from printed vocabulary_term/vocabulary_definition pairs "
                f"(and en/hi/latin contributor maps) across Savi Kannada FL Part 1 "
                f"editions {EDITION_ID}: {book_list}. "
                f"Per-book term counts: {per_book_summary}. "
                "Definitions linked by ref or {{termId}}-def id. No inferred morphology."
            ),
        },
    )
    dump(
        OUT_DIR / "function-words.yaml",
        {"forms": [{"form": f, "class": "function"} for f in FUNCTION_WORDS]},
    )
    dump(OUT_DIR / "lemmas.yaml", {"lemmas": lemmas})
    dump(OUT_DIR / "forms.yaml", {"forms": forms})
    print(f"seeded {len(lemmas)} lemmas, {len(forms)} forms, {len(FUNCTION_WORDS)} function words")
    for bid, n in per_book.items():
        print(f"  {bid}: {n} vocabulary pairs")


if __name__ == "__main__":
    main()
