#!/usr/bin/env python3
"""Publish approved media objects to Cloudflare R2.

Credentials come from the environment (or a local gitignored env file) — never from Git.

Preferred (same Account API token used for OpenTofu), via Cloudflare REST:

  CLOUDFLARE_API_TOKEN
  R2_ACCOUNT_ID          # Cloudflare account id (32 hex)
  R2_BUCKET              # e.g. akshar-media-dev
  R2_PUBLIC_BASE_URL     # optional; for printed / verified public URL

Alternate (S3-compatible API / boto3):

  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_ENDPOINT            # https://<accountid>.r2.cloudflarestorage.com
  R2_BUCKET
  R2_PUBLIC_BASE_URL     # optional

Optional local file (gitignored): infra/cloudflare/.env — KEY=value lines.

Missing R2_BUCKET / R2_ENDPOINT / R2_PUBLIC_BASE_URL / R2_ACCOUNT_ID are filled from
`tofu output` under infra/cloudflare when available.

Examples (from repository root):

  python3 scripts/media_publish.py --health
  python3 scripts/media_publish.py --put path/to/clip.m4a --key audio/kn/voice/ab/….m4a
  python3 scripts/media_publish.py --verify-url "$R2_PUBLIC_BASE_URL/health.json"
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
INFRA_DIR = REPO_ROOT / "infra" / "cloudflare"
DEFAULT_HEALTH = INFRA_DIR / "assets" / "health.json"
LOCAL_ENV = INFRA_DIR / ".env"
HEALTH_BODY = {"service": "akshar-media", "schemaVersion": 1}


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


def _tofu_output(name: str) -> str | None:
    try:
        completed = subprocess.run(
            ["tofu", "output", "-raw", name],
            cwd=INFRA_DIR,
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return None
    if completed.returncode != 0:
        return None
    value = completed.stdout.strip()
    return value or None


def _hydrate_from_tofu() -> None:
    mapping = {
        "R2_BUCKET": "bucket_name",
        "R2_ENDPOINT": "s3_api_endpoint",
        "R2_PUBLIC_BASE_URL": "recommended_public_base_url",
    }
    for env_name, output_name in mapping.items():
        if not os.environ.get(env_name):
            value = _tofu_output(output_name)
            if value and value != "null":
                os.environ[env_name] = value
    if not os.environ.get("R2_ACCOUNT_ID"):
        endpoint = os.environ.get("R2_ENDPOINT", "")
        match = re.match(
            r"https://([0-9a-f]{32})\.r2\.cloudflarestorage\.com/?$",
            endpoint,
        )
        if match:
            os.environ["R2_ACCOUNT_ID"] = match.group(1)


def _require_env(*names: str) -> dict[str, str]:
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        raise SystemExit(
            "Missing required environment variables: "
            + ", ".join(missing)
            + "\nSee infra/cloudflare/README.md — never commit these values."
        )
    return {n: os.environ[n] for n in names}


def _put_via_s3(
    *,
    key: str,
    body: bytes,
    content_type: str,
    cache_control: str | None,
) -> None:
    try:
        import boto3
        from botocore.client import Config
    except ImportError as exc:
        raise SystemExit(
            "boto3 is required for S3-key uploads. Install with:\n"
            "  python3 -m pip install -r scripts/requirements-media.txt\n"
            "Or set CLOUDFLARE_API_TOKEN + R2_ACCOUNT_ID + R2_BUCKET to use the REST API."
        ) from exc

    env = _require_env(
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_ENDPOINT",
        "R2_BUCKET",
    )
    client = boto3.client(
        "s3",
        endpoint_url=env["R2_ENDPOINT"],
        aws_access_key_id=env["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=env["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )
    extra: dict = {"ContentType": content_type}
    if cache_control:
        extra["CacheControl"] = cache_control
    client.put_object(Bucket=env["R2_BUCKET"], Key=key, Body=body, **extra)
    print(f"put s3://{env['R2_BUCKET']}/{key} ({len(body)} bytes, {content_type})")


def _put_via_cloudflare_rest(
    *,
    key: str,
    body: bytes,
    content_type: str,
    cache_control: str | None,
) -> None:
    env = _require_env("CLOUDFLARE_API_TOKEN", "R2_ACCOUNT_ID", "R2_BUCKET")
    # Object key path segments must keep literal slashes (Cloudflare R2 REST rule).
    encoded_key = "/".join(urllib.parse.quote(part, safe="") for part in key.split("/"))
    url = (
        f"https://api.cloudflare.com/client/v4/accounts/{env['R2_ACCOUNT_ID']}"
        f"/r2/buckets/{env['R2_BUCKET']}/objects/{encoded_key}"
    )
    headers = {
        "Authorization": f"Bearer {env['CLOUDFLARE_API_TOKEN']}",
        "Content-Type": content_type,
    }
    if cache_control:
        headers["Cache-Control"] = cache_control
    request = urllib.request.Request(url, data=body, method="PUT", headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as resp:
            payload = resp.read()
            status = resp.status
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Cloudflare REST PUT failed: HTTP {exc.code}\n{detail}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Cloudflare REST PUT failed: {exc}") from exc

    try:
        parsed = json.loads(payload.decode("utf-8")) if payload else {}
    except json.JSONDecodeError:
        parsed = {}
    if parsed and parsed.get("success") is False:
        raise SystemExit(f"Cloudflare REST PUT rejected: {parsed.get('errors')}")
    print(
        f"put cf://{env['R2_BUCKET']}/{key} ({len(body)} bytes, {content_type}, HTTP {status})"
    )


def put_object(
    *,
    key: str,
    body: bytes,
    content_type: str,
    cache_control: str | None,
    immutable: bool,
) -> None:
    if cache_control is None and immutable:
        cache_control = "public, max-age=31536000, immutable"

    if os.environ.get("R2_ACCESS_KEY_ID") and os.environ.get("R2_SECRET_ACCESS_KEY"):
        _put_via_s3(
            key=key, body=body, content_type=content_type, cache_control=cache_control
        )
        return
    if os.environ.get("CLOUDFLARE_API_TOKEN"):
        _put_via_cloudflare_rest(
            key=key, body=body, content_type=content_type, cache_control=cache_control
        )
        return
    raise SystemExit(
        "No upload credentials found.\n"
        "Set CLOUDFLARE_API_TOKEN (Account token with R2 write) plus R2_ACCOUNT_ID and R2_BUCKET,\n"
        "or set R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_ENDPOINT / R2_BUCKET.\n"
        "See infra/cloudflare/README.md — never commit these values."
    )


def publish_health(path: Path) -> None:
    raw = path.read_text(encoding="utf-8")
    parsed = json.loads(raw)
    if parsed != HEALTH_BODY:
        raise SystemExit(
            f"{path} must equal {json.dumps(HEALTH_BODY, separators=(',', ':'))}"
        )
    body = json.dumps(HEALTH_BODY, separators=(",", ":")).encode("utf-8")
    put_object(
        key="health.json",
        body=body,
        content_type="application/json; charset=utf-8",
        cache_control="public, max-age=60",
        immutable=False,
    )
    base = os.environ.get("R2_PUBLIC_BASE_URL", "").rstrip("/")
    if base:
        print(f"public URL (after CDN/r2.dev propagation): {base}/health.json")
        print(
            f"set EXPO_PUBLIC_MEDIA_HEALTH_URL={base}/health.json in a local apps/mobile/.env"
        )


def publish_file(local: Path, key: str, content_type: str | None) -> None:
    if not local.is_file():
        raise SystemExit(f"file not found: {local}")
    body = local.read_bytes()
    guessed, _ = mimetypes.guess_type(str(local))
    ctype = content_type or guessed or "application/octet-stream"
    put_object(key=key, body=body, content_type=ctype, cache_control=None, immutable=True)


def verify_url(url: str, expect_health: bool) -> None:
    # Cloudflare's r2.dev edge returns 403 for Python-urllib's default User-Agent
    # ("Python-urllib/…"). curl and normal app clients are fine.
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "AksharMediaVerify/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            data = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            status = resp.status
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"GET {url} failed: HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"GET {url} failed: {exc}") from exc

    print(f"GET {url} -> {status}, {ctype}, {len(data)} bytes")
    if expect_health:
        try:
            parsed = json.loads(data.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise SystemExit("health body is not JSON") from exc
        if parsed != HEALTH_BODY:
            raise SystemExit(f"unexpected health body: {parsed!r}")
        print("health.json OK")


def main(argv: list[str] | None = None) -> int:
    _load_dotenv(LOCAL_ENV)
    _hydrate_from_tofu()

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--health",
        action="store_true",
        help=f"Upload {DEFAULT_HEALTH.relative_to(REPO_ROOT)} as health.json",
    )
    parser.add_argument(
        "--health-file",
        type=Path,
        default=DEFAULT_HEALTH,
        help="Path to health.json body (default: infra/cloudflare/assets/health.json)",
    )
    parser.add_argument("--put", type=Path, help="Local file to upload")
    parser.add_argument("--key", help="Object key for --put")
    parser.add_argument("--content-type", help="Override Content-Type for --put")
    parser.add_argument(
        "--verify-url",
        help="Public GET URL to verify (e.g. $R2_PUBLIC_BASE_URL/health.json)",
    )
    parser.add_argument(
        "--expect-health",
        action="store_true",
        help="With --verify-url, require the akshar-media health body",
    )
    args = parser.parse_args(argv)

    if not any([args.health, args.put, args.verify_url]):
        parser.error("specify --health, --put/--key, and/or --verify-url")

    if args.health:
        publish_health(args.health_file)

    if args.put:
        if not args.key:
            parser.error("--put requires --key")
        publish_file(args.put, args.key, args.content_type)

    if args.verify_url:
        verify_url(
            args.verify_url,
            expect_health=args.expect_health or args.verify_url.endswith("health.json"),
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
