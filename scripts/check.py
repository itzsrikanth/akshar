#!/usr/bin/env python3
"""Run the content CI checks locally, or against commits about to be pushed."""

import argparse
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CHECKS = (
    ("Validate schema, structure, and encoding", "validate.py", ()),
    ("Validate lexicons", "validate_lexicon.py", ()),
    ("Check generated chapter READMEs", "generate_readme.py", ("--check",)),
    ("Check compiled API JSON", "build_json.py", ("--check",)),
    ("Check v1/v2 acceptance contracts", "check_v2_acceptance.py", ()),
    ("Smoke v2 cutover payloads", "smoke_v2_cutover.py", ()),
)


def check_tree(root):
    for label, script, arguments in CHECKS:
        print(f"\n== {label} ==", flush=True)
        # Acceptance checks take an optional root so git-archive snapshots work.
        cmd = [sys.executable, str(root / "scripts" / script), *arguments]
        if script == "check_v2_acceptance.py":
            cmd.append(str(root))
        subprocess.run(cmd, cwd=root, check=True)


def check_revision(revision):
    commit = subprocess.check_output(
        ["git", "rev-parse", "--verify", "--end-of-options", f"{revision}^{{commit}}"],
        cwd=REPO_ROOT,
        text=True,
    ).strip()
    print(f"Checking committed snapshot {commit}; working files are not used.", flush=True)
    with tempfile.TemporaryDirectory(prefix="akshar-check-") as temporary:
        archive_path = Path(temporary) / "snapshot.tar"
        snapshot = Path(temporary) / "tree"
        snapshot.mkdir()
        subprocess.run(
            ["git", "archive", "--format=tar", f"--output={archive_path}", commit],
            cwd=REPO_ROOT,
            check=True,
        )
        with tarfile.open(archive_path) as archive:
            archive.extractall(snapshot, filter="data")
        check_tree(snapshot)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--revision", help="Check an isolated committed snapshot, e.g. HEAD")
    mode.add_argument("--pre-push", action="store_true", help="Read Git's ref updates from stdin")
    args = parser.parse_args()
    try:
        if args.pre_push:
            checked = set()
            for update in sys.stdin:
                fields = update.split()
                if len(fields) != 4:
                    parser.error("Expected four fields in each pre-push ref update")
                local_ref, local_oid, remote_ref, remote_oid = fields
                if not local_oid.strip("0") or local_oid in checked:
                    continue
                print(f"\nPre-push: {local_ref} -> {remote_ref}", flush=True)
                check_revision(local_oid)
                checked.add(local_oid)
        elif args.revision:
            check_revision(args.revision)
        else:
            check_tree(REPO_ROOT)
    except (subprocess.CalledProcessError, OSError, tarfile.TarError) as error:
        print(f"\nContent checks failed: {error}", file=sys.stderr)
        print("Fix the reported issue, regenerate artifacts, and commit them before pushing.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
