#!/usr/bin/env python3
"""Generate SkillTree brand assets using DALL-E 3 + Pillow post-processing."""

import os
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI

PUBLIC = Path(__file__).resolve().parent.parent / "public"
PUBLIC.mkdir(exist_ok=True)

client = OpenAI()

# ─── Font setup ─────────────────────────────────────────────────────

FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_PATH = next((p for p in FONT_PATHS if os.path.exists(p)), None)

# ─── Prompts ────────────────────────────────────────────────────────

LOGO_PROMPT = (
    "A minimal, clean vector-style logo mark of a cosmic tree on a pure black background. "
    "The tree has a clear vertical trunk at the bottom that branches upward into an elegant "
    "symmetric canopy. Branch tips end in small glowing circle nodes connected by thin luminous "
    "lines, giving it a neural-network constellation feel while clearly reading as a tree silhouette. "
    "Color palette: deep indigo, purple, violet, and bright cyan for the crown node at the top. "
    "The nodes glow softly. Style: flat vector, minimal, geometric, no texture, no text, no leaves — "
    "just glowing nodes and clean branching lines forming a beautiful tree shape against darkness. "
    "Think: tech startup logo meets constellation map meets tree of life."
)

AVATAR_PROMPT = (
    "A square profile avatar for a tech brand called SkillTree. "
    "Centered cosmic tree mark on a dark background. The tree is made of glowing nodes "
    "connected by thin luminous branching lines — indigo and purple at the branches, bright cyan "
    "at the crown node on top. Clear vertical trunk, symmetric branching canopy, 5-9 glowing nodes. "
    "Neural network meets tree of life aesthetic. Clean vector style, minimal, geometric. "
    "Soft glow halos around the nodes. No text. Pure dark background. "
    "Iconic and recognizable even at small sizes."
)

OG_PROMPT = (
    "A wide cinematic banner image for a tech brand called SkillTree. "
    "Dark cosmic background transitioning from near-black to deep indigo with subtle scattered "
    "star-like particles. On the LEFT side, a glowing cosmic tree made of interconnected nodes "
    "and constellation-like branching lines in indigo, purple, violet, and cyan colors. "
    "The tree glows with a soft purple-cyan aura against the darkness. "
    "The RIGHT side is mostly empty dark space (reserved for text overlay). "
    "Style: clean, modern, dark tech aesthetic with deep space feel. "
    "Cinematic lighting. No text at all. Ultra-wide 16:9 composition."
)


def generate_image(prompt, size="1024x1024", quality="hd"):
    """Generate an image with DALL-E 3 and return as PIL Image."""
    print(f"  Calling DALL-E 3 ({size}, {quality})...")
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size=size,
        n=1,
        quality=quality,
    )
    url = response.data[0].url
    revised = response.data[0].revised_prompt or ""
    print(f"  Revised: {revised[:120]}...")

    tmp = PUBLIC / "_tmp_dl.png"
    urllib.request.urlretrieve(url, str(tmp))
    img = Image.open(tmp).convert("RGBA")
    tmp.unlink()
    return img


def load_font(size):
    """Load a TrueType font or fall back to default."""
    if FONT_PATH:
        return ImageFont.truetype(FONT_PATH, size)
    return ImageFont.load_default()


def add_text_overlay(img, title, subtitle=None, centered=False):
    """Add brand text to an image."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    font_lg = load_font(int(h * 0.09))
    font_sm = load_font(int(h * 0.04))

    if centered:
        # Center text horizontally
        bbox = draw.textbbox((0, 0), title, font=font_lg)
        tw = bbox[2] - bbox[0]
        tx = (w - tw) // 2
        ty = int(h * 0.55)
    else:
        tx = int(w * 0.50)
        ty = int(h * 0.35)

    # Drop shadow
    draw.text((tx + 2, ty + 2), title, fill=(0, 0, 0, 180), font=font_lg)
    draw.text((tx, ty), title, fill=(255, 255, 255, 245), font=font_lg)

    if subtitle:
        sy = ty + int(h * 0.13)
        draw.text((tx + 1, sy + 1), subtitle, fill=(0, 0, 0, 120), font=font_sm)
        draw.text((tx, sy), subtitle, fill=(167, 139, 250, 210), font=font_sm)

    return img


def main():
    print("=== SkillTree Brand Asset Generator (DALL-E 3) ===\n")

    # ── 1. Logo mark ────────────────────────────────────────────────
    print("[1/3] Generating logo mark...")
    logo = generate_image(LOGO_PROMPT, size="1024x1024", quality="hd")
    logo.save(PUBLIC / "logo-mark.png")
    print(f"  -> logo-mark.png")

    # Derive favicons
    for sz in [512, 192]:
        resized = logo.resize((sz, sz), Image.LANCZOS)
        resized.convert("RGB").save(PUBLIC / f"favicon-{sz}.png")
        print(f"  -> favicon-{sz}.png ({sz}x{sz})")

    # ── 2. Avatar ───────────────────────────────────────────────────
    print("\n[2/3] Generating avatar...")
    avatar = generate_image(AVATAR_PROMPT, size="1024x1024", quality="hd")
    avatar_sm = avatar.resize((400, 400), Image.LANCZOS)
    avatar_sm.convert("RGB").save(PUBLIC / "avatar.png")
    print(f"  -> avatar.png (400x400)")

    # ── 3. OG / Banner ──────────────────────────────────────────────
    print("\n[3/3] Generating OG/banner base image...")
    og_raw = generate_image(OG_PROMPT, size="1792x1024", quality="hd")

    # OG image 1200x630
    og = og_raw.copy().resize((1200, 630), Image.LANCZOS)
    og = add_text_overlay(og, "SkillTree", "Agent-Native Skill Marketplace")
    og.convert("RGB").save(PUBLIC / "og-image.png")
    print(f"  -> og-image.png (1200x630)")

    # Twitter card 800x418
    tw = og_raw.copy().resize((800, 418), Image.LANCZOS)
    tw = add_text_overlay(tw, "SkillTree", "Agent-Native Skill Marketplace")
    tw.convert("RGB").save(PUBLIC / "og-twitter.png")
    print(f"  -> og-twitter.png (800x418)")

    # Social banner 1500x500
    banner = og_raw.copy().resize((1500, 500), Image.LANCZOS)
    banner = add_text_overlay(banner, "SkillTree", "Discover, purchase, and install agent skills")
    banner.convert("RGB").save(PUBLIC / "banner-social.png")
    print(f"  -> banner-social.png (1500x500)")

    # ── Summary ─────────────────────────────────────────────────────
    print("\n=== Done! ===")
    print("Generated assets:")
    for f in sorted(PUBLIC.glob("*.png")):
        kb = f.stat().st_size // 1024
        print(f"  {f.name:24s}  {kb:>5d} KB")


if __name__ == "__main__":
    main()
