"""Keep explicitly held editorial YAML out of the production API."""

import json
from pathlib import Path

import yaml

UNVERIFIED_LICENSE = "Unverified; source PDF states NOT TO BE REPUBLISHED; no CC license asserted"
API_LICENSES = {"CC BY 4.0", "CC BY-SA 4.0"}

# Legacy board trees: board/state/medium/GradeN/subject/chapter (6 parts)
# Publication layout: content/books/<book>/editions/<edition>/chapters/<chapter> (7 parts)
LEGACY_HOLD_DEPTH = 6
CONTENT_HOLD_DEPTH = 7

SKIP_LICENSE_SCAN_PREFIXES = ("fixtures/", "apps/", "packages/", "api/")


def _is_safe_relative(path: Path, relative: str) -> bool:
    return not path.is_absolute() and ".." not in path.parts and path.as_posix() == relative


def _production_payloads_for(root: Path, chapter_dir: Path):
    """Paths that must not exist for a held chapter."""
    payloads = []
    sources = list(chapter_dir.glob("source.*.yaml"))
    if sources:
        meta = yaml.safe_load(sources[0].read_text(encoding="utf-8")).get("meta") or {}
        board = meta.get("board")
        state = meta.get("state")
        medium = meta.get("medium")
        grade = meta.get("grade")
        subject = meta.get("subject")
        slug = meta.get("slug") or chapter_dir.name
        if all(isinstance(v, str) and v for v in (board, state, medium, subject)) and isinstance(grade, int):
            payloads.append(root / "api" / board / state / medium / f"Grade{grade}" / subject / f"{slug}.json")

    parts = chapter_dir.relative_to(root).parts
    if len(parts) == CONTENT_HOLD_DEPTH and parts[0] == "content" and parts[1] == "books":
        book_id, edition_id, chapter_id = parts[2], parts[4], parts[6]
        payloads.append(root / "api" / "v2" / "books" / book_id / "editions" / edition_id / "chapters" / f"{chapter_id}.json")
    return payloads


def load_publication_holds(root):
    config = json.loads((root / "api-publication-holds.json").read_text(encoding="utf-8"))
    if not isinstance(config, dict) or set(config) != {"chapters"} or not isinstance(config["chapters"], list):
        raise ValueError("Invalid API publication holds configuration")
    holds = {}
    for entry in config["chapters"]:
        if not isinstance(entry, dict) or set(entry) != {"path", "reason"}:
            raise ValueError("Each publication hold requires path and reason")
        relative = entry["path"]
        reason = entry["reason"]
        if not isinstance(relative, str) or not isinstance(reason, str) or not reason.strip():
            raise ValueError("Publication hold path and reason must be nonempty strings")
        path = Path(relative)
        if not _is_safe_relative(path, relative) or len(path.parts) not in (LEGACY_HOLD_DEPTH, CONTENT_HOLD_DEPTH):
            raise ValueError(f"Invalid held chapter path: {relative}")
        if relative.startswith("content/") and (
            len(path.parts) != CONTENT_HOLD_DEPTH
            or path.parts[0:2] != ("content", "books")
            or path.parts[3] != "editions"
            or path.parts[5] != "chapters"
        ):
            raise ValueError(f"Invalid held content chapter path: {relative}")
        if relative in holds or not list((root / path).glob("source.*.yaml")):
            raise ValueError(f"Duplicate or missing held chapter: {relative}")
        for payload in _production_payloads_for(root, root / path):
            if payload.exists():
                raise ValueError(f"Held chapter has a production payload: {payload.relative_to(root)}")
        holds[relative] = reason

    for source_path in sorted(root.rglob("source.*.yaml")):
        relative = source_path.relative_to(root).as_posix()
        if any(relative.startswith(prefix) for prefix in SKIP_LICENSE_SCAN_PREFIXES):
            continue
        chapter = source_path.parent
        held = chapter.relative_to(root).as_posix() in holds
        files = [source_path, *chapter.glob("translation/*.yaml"), *chapter.glob("transliteration/*.yaml")]
        for path in files:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
            meta = data.get("meta") if isinstance(data, dict) else None
            license_text = meta.get("license") if isinstance(meta, dict) else None
            if not isinstance(license_text, str) or (not held and license_text not in API_LICENSES):
                raise ValueError(f"Unapproved API license requires an explicit publication hold: {path.relative_to(root)}")
            if held and license_text not in API_LICENSES | {UNVERIFIED_LICENSE}:
                raise ValueError(f"Invalid held chapter license status: {path.relative_to(root)}")
    return holds
