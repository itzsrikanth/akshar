"""Keep explicitly held editorial YAML out of the production API."""

import json
from pathlib import Path

import yaml

UNVERIFIED_LICENSE = "Unverified; source PDF states NOT TO BE REPUBLISHED; no CC license asserted"
API_LICENSES = {"CC BY 4.0", "CC BY-SA 4.0"}


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
        if path.is_absolute() or ".." in path.parts or len(path.parts) != 6 or path.as_posix() != relative:
            raise ValueError(f"Invalid held chapter path: {relative}")
        if relative in holds or not list((root / path).glob("source.*.yaml")):
            raise ValueError(f"Duplicate or missing held chapter: {relative}")
        payload = root / "api" / path.parent / f"{path.name}.json"
        if payload.exists():
            raise ValueError(f"Held chapter has a production payload: {payload.relative_to(root)}")
        holds[relative] = reason

    for source_path in sorted(root.rglob("source.*.yaml")):
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
