#!/usr/bin/env python3
"""Generate each chapter's README.md from its source + transliteration + translation YAML.

Usage:
    python3 scripts/generate_readme.py            # write README.md into every chapter folder
    python3 scripts/generate_readme.py --check     # exit 1 if any generated README is stale/missing
"""
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent

# ISO 15924 four-letter script codes — used for transliteration labels so they
# stay compact and don't imply a single language owns that script (Devanagari
# is shared by Hindi, Marathi, Nepali, Sanskrit, ... not just Hindi).
SCRIPT_CODES = {
    "devanagari": "Deva",
    "latin": "Latn",
    "tamil": "Taml",
    "telugu": "Telu",
    "kannada": "Knda",
    "malayalam": "Mlym",
    "bengali": "Beng",
    "gujarati": "Gujr",
    "gurmukhi": "Guru",
    "oriya": "Orya",
    "odia": "Orya",
    "urdu": "Arab",
}


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


def script_label(script, data):
    declared = (data.get("meta") or {}).get("script") or script
    return SCRIPT_CODES.get(declared.lower(), declared.title())


def translation_label(lang, data):
    meta = data.get("meta") or {}
    return meta.get("locale") or lang.upper()


def render_chapter(chapter_dir, source_path):
    source = load_yaml(source_path)
    meta = source["meta"]
    segments = source["segments"]
    source_labels = source.get("labels") or {}
    translits = load_contributor_files(chapter_dir, "transliteration")
    translations = load_contributor_files(chapter_dir, "translation")
    translit_labels = {script: (data.get("labels") or {}) for script, data in translits.items()}
    translation_labels = {lang: (data.get("labels") or {}) for lang, data in translations.items()}
    translit_display = {script: script_label(script, data) for script, data in translits.items()}
    translation_display = {lang: translation_label(lang, data) for lang, data in translations.items()}

    def annotate(seg_id):
        out = []
        for script, data in translits.items():
            if seg_id in data:
                out.append(f"{translit_display[script]}: {data[seg_id]}")
        for lang, data in translations.items():
            if seg_id in data:
                out.append(f"{translation_display[lang]}: {data[seg_id]}")
        return out

    answer_for = {}
    definition_for = {}
    for s in segments:
        if s["type"] == "answer" and "ref" in s:
            answer_for[s["ref"]] = s
        elif s["type"] in ("vocabulary_definition", "note_definition") and "ref" in s:
            definition_for[s["ref"]] = s

    def build_heading(section_key, fallback):
        parts = [fallback]
        if section_key in source_labels:
            parts.append(source_labels[section_key])
        for labels in translit_labels.values():
            if section_key in labels:
                parts.append(labels[section_key])
        for labels in translation_labels.values():
            if section_key in labels and labels[section_key] != fallback:
                parts.append(labels[section_key])
        return " · ".join(parts)

    script_names = ", ".join(translit_display.values()) or "none yet"
    lang_names = ", ".join(translation_display.values()) or "none yet"

    lines = [
        f"# {meta['title']}",
        "",
        f"> Auto-generated from `{source_path.name}` — do not edit manually. "
        "Edit the source YAML and run `python3 scripts/generate_readme.py` to regenerate.",
        "",
        f"> Currently showing **{script_names}** transliteration and **{lang_names}** translation "
        "as a sample — this is extensible to any script/language pair. See CONTRIBUTING.md to add one.",
        "",
        f"**Board:** {meta['board']} · **State:** {meta['state']} · **Medium:** {meta['medium']} · "
        f"**Grade:** {meta['grade']} · **Subject:** {meta['subject']} · **Chapter:** {meta['chapter']}",
        "",
        f"Source: [{meta['source_url']}]({meta['source_url']}) · License: {meta['license']} · "
        f"Publisher: {meta['original_publisher']}",
    ]

    section = [None]
    stanza = [None]

    def enter(section_key, heading=None):
        if section[0] != section_key:
            if lines and lines[-1] != "":
                lines.append("")
            if heading:
                lines.append(f"## {build_heading(section_key, heading)}")
                lines.append("")
            section[0] = section_key
            stanza[0] = None

    for seg in segments:
        t = seg["type"]
        if t in ("answer", "vocabulary_definition", "note_definition"):
            continue

        if t == "competency":
            enter("competency", "Competency")
            lines.append(f"> {seg['text']}  ")
            for a in annotate(seg["id"]):
                lines.append(f"> {a}  ")

        elif t == "prose" and seg.get("section") == "intro":
            enter("intro", "Introduction")
            lines.append(f"- {seg['text']}")
            for a in annotate(seg["id"]):
                lines.append(f"  - {a}")

        elif t == "poem_line":
            enter("poem", "Poem")
            if seg.get("stanza") != stanza[0]:
                if stanza[0] is not None:
                    lines.append("")
                stanza[0] = seg.get("stanza")
            lines.append(f"{seg['text']}  ")
            for a in annotate(seg["id"]):
                lines.append(f"*{a}*  ")

        elif t == "prose" and seg.get("section") == "story":
            enter("story", "Story")
            lines.append(f"{seg['text']}  ")
            for a in annotate(seg["id"]):
                lines.append(f"*{a}*  ")

        elif t == "dialogue" and seg.get("section") == "story":
            enter("story", "Story")
            speaker = seg.get("speaker")
            prefix = f"**{speaker}:** " if speaker else "**(speaker unknown):** "
            lines.append(f"{prefix}{seg['text']}  ")
            for a in annotate(seg["id"]):
                lines.append(f"*{a}*  ")

        elif t == "vocabulary_term":
            enter("vocab", "Word Meanings")
            defn = definition_for.get(seg["id"])
            lines.append(f"- **{seg['text']}** — {defn['text'] if defn else ''}")
            for a in annotate(seg["id"]):
                lines.append(f"  - {a}")
            if defn:
                for a in annotate(defn["id"]):
                    lines.append(f"  - {a}")

        elif t == "note_term":
            enter("notes", "Notes")
            defn = definition_for.get(seg["id"])
            lines.append(f"- **{seg['text']}** — {defn['text'] if defn else ''}")
            for a in annotate(seg["id"]):
                lines.append(f"  - {a}")
            if defn:
                for a in annotate(defn["id"]):
                    lines.append(f"  - {a}")

        elif t in ("prose", "question", "fill_blank") and seg.get("exercise"):
            ex = seg["exercise"]
            enter(f"exercise-{ex}", f"Exercise {ex}")
            if t == "prose":
                lines.append(f"{seg['text']}  ")
                for a in annotate(seg["id"]):
                    lines.append(f"*{a}*  ")
            else:
                lines.append(f"- {seg['text']}")
                for a in annotate(seg["id"]):
                    lines.append(f"  - {a}")
                ans = answer_for.get(seg["id"])
                if ans:
                    lines.append(f"  - **Answer:** {ans['text']}")
                    for a in annotate(ans["id"]):
                        lines.append(f"    - {a}")

        else:
            enter(f"other-{t}", t.replace("_", " ").title())
            lines.append(f"- {seg['text']}")

    return "\n".join(lines).rstrip() + "\n"


def main():
    check_only = "--check" in sys.argv
    stale = []

    for chapter_dir in find_chapter_dirs(REPO_ROOT):
        for source_path in sorted(chapter_dir.glob("source.*.yaml")):
            rendered = render_chapter(chapter_dir, source_path)
            readme_path = chapter_dir / "README.md"
            if check_only:
                existing = readme_path.read_text(encoding="utf-8") if readme_path.exists() else None
                if existing != rendered:
                    stale.append(readme_path)
            else:
                readme_path.write_text(rendered, encoding="utf-8")
                print(f"wrote {readme_path.relative_to(REPO_ROOT)}")

    if check_only:
        if stale:
            print("Stale or missing generated README(s):")
            for p in stale:
                print(f"  {p.relative_to(REPO_ROOT)}")
            print("Run `python3 scripts/generate_readme.py` and commit the result.")
            sys.exit(1)
        print("All chapter READMEs are up to date.")


if __name__ == "__main__":
    main()
