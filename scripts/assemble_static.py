#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.12"
# ///
from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

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


if __name__ == "__main__":
    main()
