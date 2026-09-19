#!/usr/bin/env python3
"""Validate content/lexicons/*/ YAML against schemas and structural rules.

Usage:
    python3 scripts/validate_lexicon.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = REPO_ROOT / "schema"
LEXICONS_DIR = REPO_ROOT / "content" / "lexicons"


class Errors(list):
    def add(self, path: Path, msg: str):
        self.append(f"{path.relative_to(REPO_ROOT)}: {msg}")


def load_schema(name: str):
    return json.loads((SCHEMA_DIR / name).read_text(encoding="utf-8"))


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def validate_schema(errors: Errors, path: Path, data, schema):
    validator = Draft7Validator(schema)
    for err in sorted(validator.iter_errors(data), key=lambda e: list(e.path)):
        loc = "/".join(str(p) for p in err.path) or "(root)"
        errors.add(path, f"{loc}: {err.message}")


def validate_language(lang_dir: Path, errors: Errors):
    meta_path = lang_dir / "meta.yaml"
    func_path = lang_dir / "function-words.yaml"
    lemmas_path = lang_dir / "lemmas.yaml"
    forms_path = lang_dir / "forms.yaml"

    for required in (meta_path, func_path, lemmas_path, forms_path):
        if not required.is_file():
            errors.add(lang_dir, f"missing {required.name}")
            return

    meta = load_yaml(meta_path)
    func = load_yaml(func_path)
    lemmas_doc = load_yaml(lemmas_path)
    forms_doc = load_yaml(forms_path)

    validate_schema(errors, meta_path, meta, load_schema("lexicon-meta.schema.json"))
    validate_schema(errors, func_path, func, load_schema("lexicon-function-words.schema.json"))
    validate_schema(errors, lemmas_path, lemmas_doc, load_schema("lexicon-lemmas.schema.json"))
    validate_schema(errors, forms_path, forms_doc, load_schema("lexicon-forms.schema.json"))

    curated_lemmas_path = lang_dir / "curated-lemmas.yaml"
    curated_forms_path = lang_dir / "curated-forms.yaml"
    if curated_lemmas_path.is_file():
        curated_lemmas = load_yaml(curated_lemmas_path)
        validate_schema(
            errors, curated_lemmas_path, curated_lemmas, load_schema("lexicon-lemmas.schema.json")
        )
        lemmas_doc.setdefault("lemmas", []).extend(curated_lemmas.get("lemmas") or [])
    if curated_forms_path.is_file():
        curated_forms = load_yaml(curated_forms_path)
        validate_schema(
            errors, curated_forms_path, curated_forms, load_schema("lexicon-forms.schema.json")
        )
        forms_doc.setdefault("forms", []).extend(curated_forms.get("forms") or [])

    if meta.get("language") != lang_dir.name:
        errors.add(meta_path, f"language {meta.get('language')!r} must match directory name {lang_dir.name!r}")

    lemma_ids = set()
    lemma_surfaces = {}
    for lemma in lemmas_doc.get("lemmas") or []:
        lid = lemma.get("id")
        if lid in lemma_ids:
            errors.add(lemmas_path, f"duplicate lemma id {lid!r}")
        lemma_ids.add(lid)
        surface = lemma.get("lemma")
        if surface in lemma_surfaces and lemma_surfaces[surface] != lid:
            # Same headword text with different ids is allowed only if forms mark ambiguous;
            # still warn via structural check below when forms collide.
            pass
        lemma_surfaces[surface] = lid

    function_forms = set()
    for entry in func.get("forms") or []:
        form = entry.get("form")
        if form in function_forms:
            errors.add(func_path, f"duplicate function-word form {form!r}")
        function_forms.add(form)

    form_keys = set()
    for entry in forms_doc.get("forms") or []:
        form = entry.get("form")
        if form in form_keys:
            errors.add(forms_path, f"duplicate form {form!r}")
        form_keys.add(form)
        if form in function_forms:
            errors.add(
                forms_path,
                f"form {form!r} is listed as a function word; remove from forms or function-words",
            )
        for lid in entry.get("lemmaIds") or []:
            if lid not in lemma_ids:
                errors.add(forms_path, f"form {form!r} references unknown lemma id {lid!r}")
        status = entry.get("status")
        lemma_ids_list = entry.get("lemmaIds") or []
        if status == "ambiguous" and len(lemma_ids_list) < 2:
            errors.add(forms_path, f"form {form!r} status ambiguous requires ≥2 lemmaIds")
        if status != "ambiguous" and len(lemma_ids_list) > 1:
            errors.add(forms_path, f"form {form!r} has multiple lemmaIds but status is {status!r}")


def main():
    errors = Errors()
    if not LEXICONS_DIR.is_dir():
        print("No content/lexicons/ directory — nothing to validate.")
        return 0

    langs = [p for p in sorted(LEXICONS_DIR.iterdir()) if p.is_dir()]
    if not langs:
        errors.add(LEXICONS_DIR, "no language directories present")

    for lang_dir in langs:
        validate_language(lang_dir, errors)

    if errors:
        print(f"{len(errors)} lexicon validation error(s):")
        for e in errors:
            print(f"  {e}")
        return 1
    print(f"Lexicon OK ({len(langs)} language(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
