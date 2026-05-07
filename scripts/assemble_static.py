#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.12"
# ///
from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

PACKAGE_OUTPUTS = {
    "ai-session-dashbaord": "ai-session-dashbaord",
    "domain-searcher": "domain-searcher",
    "ppt-doc-compressor": "ppt-doc-compressor",
    "web-authenticator": "web-authenticator",
    "XMP-editor": "xmp-editor",
}

STATIC_HTML_TOOLS = {
    "epub-trad-simp-convert.html": "epub-trad-simp-convert",
    "epub-translator.html": "epub-translator",
    "webp-convertor.html": "webp-convertor",
}


def copy_file(source: Path, target: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"Missing required file: {source.relative_to(ROOT)}")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def copy_tree(source: Path, target: Path) -> None:
    if not source.is_dir():
        raise FileNotFoundError(f"Missing required directory: {source.relative_to(ROOT)}")
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target)


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    copy_file(ROOT / "index.html", DIST / "index.html")
    copy_file(ROOT / "styles.css", DIST / "styles.css")
    copy_tree(ROOT / "assets", DIST / "assets")

    webapps_dist = DIST / "webapps"
    webapps_dist.mkdir()

    for package_dir, slug in PACKAGE_OUTPUTS.items():
        copy_tree(ROOT / "webapps" / package_dir / "dist", webapps_dist / slug)

    for filename, slug in STATIC_HTML_TOOLS.items():
        copy_file(ROOT / "webapps" / filename, webapps_dist / slug / "index.html")


if __name__ == "__main__":
    main()
