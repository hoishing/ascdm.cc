#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# ///
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


def cmux(args: list[str]) -> str:
    result = subprocess.run(
        ["cmux", "browser", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def access_token(surface: str) -> str:
    script_html = cmux([surface, "get", "html", "script#client-bootstrap"])
    match = re.search(
        r'<script[^>]*id="client-bootstrap"[^>]*>(.*)</script>',
        script_html,
        re.S,
    )
    if not match:
        raise RuntimeError("client bootstrap script not found")
    bootstrap = json.loads(html.unescape(match.group(1)))
    token = bootstrap.get("session", {}).get("accessToken")
    if not token:
        raise RuntimeError("ChatGPT access token not found in browser session")
    return str(token)


def image_url(surface: str, selector: str) -> str:
    src = cmux([surface, "get", "attr", selector, "src"])
    if not src.startswith("https://chatgpt.com/backend-api/estuary/content"):
        raise RuntimeError(f"unexpected image URL: {src[:120]}")
    return src


def download(url: str, token: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "image/png,image/*,*/*;q=0.8",
            "Referer": "https://chatgpt.com/",
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                "Version/26.2 Safari/605.1.15"
            ),
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"download failed: HTTP {exc.code}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download a ChatGPT generated image through the active cmux browser session."
    )
    parser.add_argument("--surface", required=True, help="cmux browser surface, e.g. surface:14")
    parser.add_argument("--out", required=True, help="output PNG path")
    parser.add_argument(
        "--url",
        help="explicit ChatGPT estuary content URL; defaults to the first generated image in the page",
    )
    parser.add_argument(
        "--selector",
        default='img[src*="backend-api/estuary/content"]',
        help="image selector to read when --url is omitted",
    )
    args = parser.parse_args()

    url = args.url or image_url(args.surface, args.selector)
    data = download(url, access_token(args.surface))
    if len(data) < 100_000:
        raise RuntimeError(f"downloaded response is too small: {len(data)} bytes")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    print(f"saved {out}")
    print(f"bytes {len(data)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
