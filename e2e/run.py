#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""E2E checks for ascdm.cc using Lightpanda headless browser.

Starts a local HTTP server, fetches each page through Lightpanda, and
verifies key content/links are present.

Usage:
    uv run e2e/run.py

Exit codes:
    0 — all checks passed
    1 — one or more checks failed
"""

from __future__ import annotations

import http.server
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIGHTPANDA = Path.home() / ".cache" / "lightpanda-node" / "lightpanda"
PORT = 8765
BASE_URL = f"http://127.0.0.1:{PORT}"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:  # noqa: A002, D401
        return None


def serve_static(directory: Path) -> socketserver.TCPServer:
    handler = lambda *a, **kw: QuietHandler(*a, directory=str(directory), **kw)
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def fetch_html(url: str, attempts: int = 2) -> str:
    last_err = ""
    for i in range(attempts):
        try:
            result = subprocess.run(
                [
                    str(LIGHTPANDA),
                    "fetch",
                    "--dump", "html",
                    "--strip-mode", "ui,css",
                    "--wait-until", "load",
                    url,
                ],
                capture_output=True,
                text=True,
                timeout=60,
            )
        except subprocess.TimeoutExpired:
            last_err = f"timeout (attempt {i + 1}/{attempts})"
            continue
        if result.returncode == 0:
            return result.stdout
        last_err = result.stderr[:400]
    raise RuntimeError(f"lightpanda failed for {url}: {last_err}")


def check(name: str, url: str, must_contain: list[str], must_not: list[str] | None = None) -> bool:
    print(f"  → {name}  [{url}]")
    try:
        html = fetch_html(url)
    except Exception as exc:  # noqa: BLE001
        print(f"     FAIL: {exc}")
        return False

    missing = [s for s in must_contain if s not in html]
    forbidden = [s for s in (must_not or []) if s in html]
    if missing or forbidden:
        for m in missing:
            print(f"     FAIL: missing {m!r}")
        for f in forbidden:
            print(f"     FAIL: forbidden content present {f!r}")
        return False
    print("     OK")
    return True


def main() -> int:
    if not LIGHTPANDA.exists():
        print(f"Lightpanda not found at {LIGHTPANDA}", file=sys.stderr)
        print("Install via: bun install -g lightpanda && lightpanda upgrade", file=sys.stderr)
        return 2

    print(f"Starting static server on {BASE_URL}, root={ROOT}")
    server = serve_static(ROOT)
    time.sleep(0.3)

    passed = 0
    failed = 0
    try:
        checks = [
            # --- homepage ---
            (
                "homepage · hero",
                "/",
                [
                    "讓搜尋需求變成",
                    "可持續成長",
                    "上升數位行銷顧問",
                    "Ascendant Digital Marketing Consultancy",
                    "sales@ascdm.cc",
                ],
                None,
            ),
            (
                "homepage · services Core 5",
                "/",
                [
                    "SEO Strategy",
                    "Content Operations",
                    "Shopify SEO",
                    "Reporting",
                    "Repurposing",
                ],
                None,
            ),
            (
                "homepage · extended capabilities Five",
                "/",
                [
                    "Video SEO",
                    "Visual",
                    "Graphic",
                    "Shopify Theme Dev",
                    "Newsletter Ops",
                    "Automation Pipelines",
                    "加值能力",
                ],
                None,
            ),
            (
                "homepage · case study section + CTA",
                "/",
                [
                    "Case Study",
                    "查看完整案例",
                    "瀏覽銷售簡報",
                    "/case-study/",
                    "/deck/",
                ],
                None,
            ),
            (
                "homepage · client anonymity (no TePe leak)",
                "/",
                [],
                ["TePe", "tepe", "TePE", "tepetw"],
            ),
            (
                "homepage · trust bar tools",
                "/",
                [
                    "Shopify Theme Dev",
                    "YouTube",
                    "Threads",
                    "GitHub Actions",
                ],
                None,
            ),
            # --- case-study ---
            (
                "case-study · hero + scope",
                "/case-study/",
                [
                    "某台灣口腔保健領導品牌",
                    "Year 1 SEO Operations",
                    "Engagement Scope",
                    "Brand Context",
                    "200+ 關鍵字",
                ],
                None,
            ),
            (
                "case-study · architecture + cadence + outcomes",
                "/case-study/",
                [
                    "Content Engine",
                    "Operating Cadence",
                    "Outcomes",
                    "FIRST PAGE",
                    "TRIPLE-DIGIT",
                    "FIVE-FIGURE",
                ],
                None,
            ),
            (
                "case-study · client anonymity",
                "/case-study/",
                [],
                ["TePe", "tepe", "TePE"],
            ),
            # --- deck (reveal.js HTML slides) ---
            (
                "deck · 13 slides + reveal.js",
                "/deck/",
                [
                    "reveal.js",
                    "讓搜尋需求變成",
                    "Operating Loop",
                    "Content Engine",
                    "Engagement Models",
                    "Why Us",
                    "Next Steps",
                ],
                None,
            ),
            (
                "deck · client anonymity",
                "/deck/",
                [],
                ["TePe", "tepe", "TePE"],
            ),
        ]

        for name, path, must, must_not in checks:
            ok = check(name, BASE_URL + path, must, must_not)
            if ok:
                passed += 1
            else:
                failed += 1
    finally:
        server.shutdown()

    total = passed + failed
    print(f"\n{passed}/{total} passed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
