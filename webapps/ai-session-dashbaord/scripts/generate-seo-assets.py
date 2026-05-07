# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pillow",
# ]
# ///
"""Generate OG image (1200x630) and Apple touch icon (180x180) for SEO."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public"

# Brand colours (from favicon.svg)
BG_DARK = "#1d232a"
ACCENT = "#5eead4"
TEXT_WHITE = "#f5f5f5"
TEXT_MUTED = "#a0aec0"


def og_image() -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Accent bar at top
    draw.rectangle([0, 0, w, 6], fill=ACCENT)

    # Draw the favicon-style icon (simplified grid)
    icon_x, icon_y = 80, 180
    block = 36
    gap = 8
    # Top-right small block
    draw.rectangle(
        [icon_x + block + gap, icon_y, icon_x + 2 * block + gap, icon_y + block],
        fill=ACCENT,
    )
    # Left tall block
    draw.rectangle(
        [icon_x, icon_y, icon_x + block, icon_y + 2 * block + gap],
        fill=ACCENT,
    )
    # Right tall block
    draw.rectangle(
        [
            icon_x + block + gap,
            icon_y + block + gap,
            icon_x + 2 * block + gap,
            icon_y + 3 * block + 2 * gap,
        ],
        fill=ACCENT,
    )
    # Bottom-left small block
    draw.rectangle(
        [
            icon_x,
            icon_y + 2 * block + 2 * gap,
            icon_x + block,
            icon_y + 3 * block + 2 * gap,
        ],
        fill=ACCENT,
    )

    # Title text
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 54)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except OSError:
        font_large = ImageFont.load_default(54)
        font_small = ImageFont.load_default(28)

    text_x = 80 + 2 * block + gap + 50
    draw.text((text_x, 200), "AI Session", fill=TEXT_WHITE, font=font_large)
    draw.text((text_x, 268), "Dashbaord", fill=ACCENT, font=font_large)

    # Tagline
    draw.text(
        (text_x, 350),
        "Browse, search & manage your Claude Code sessions.",
        fill=TEXT_MUTED,
        font=font_small,
    )
    draw.text(
        (text_x, 390),
        "Local-first \u2022 Privacy-focused \u2022 All data stays on your machine.",
        fill=TEXT_MUTED,
        font=font_small,
    )

    # URL at bottom
    draw.text((80, h - 70), "ai-session-dashbaord.hcai.cc", fill=TEXT_MUTED, font=font_small)

    img.save(OUT / "og-image.png", "PNG")
    print(f"Created {OUT / 'og-image.png'}")


def apple_touch_icon() -> None:
    size = 180
    img = Image.new("RGB", (size, size), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Draw the same grid icon centered
    block = 32
    gap = 7
    total = 2 * block + gap
    offset_x = (size - total) // 2
    offset_y = (size - (3 * block + 2 * gap)) // 2

    # Top-right
    draw.rectangle(
        [
            offset_x + block + gap,
            offset_y,
            offset_x + 2 * block + gap,
            offset_y + block,
        ],
        fill=ACCENT,
    )
    # Left tall
    draw.rectangle(
        [offset_x, offset_y, offset_x + block, offset_y + 2 * block + gap],
        fill=ACCENT,
    )
    # Right tall
    draw.rectangle(
        [
            offset_x + block + gap,
            offset_y + block + gap,
            offset_x + 2 * block + gap,
            offset_y + 3 * block + 2 * gap,
        ],
        fill=ACCENT,
    )
    # Bottom-left
    draw.rectangle(
        [
            offset_x,
            offset_y + 2 * block + 2 * gap,
            offset_x + block,
            offset_y + 3 * block + 2 * gap,
        ],
        fill=ACCENT,
    )

    img.save(OUT / "apple-touch-icon.png", "PNG")
    print(f"Created {OUT / 'apple-touch-icon.png'}")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    og_image()
    apple_touch_icon()
