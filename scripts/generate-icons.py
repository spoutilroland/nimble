#!/usr/bin/env python3
"""
Génère les icônes Nimble depuis le logo source.
- Favicon (ico) : oiseau seul, fond transparent, 16/32/48px
- app/icon.png  : oiseau seul, fond transparent, 32×32
- app/apple-icon.png : oiseau seul, fond transparent, 180×180
- Back office   : logo complet optimisé (dimensions corrigées)
- public/       : logo WebP + PNG pour le site
"""

from PIL import Image
import struct, io, os

SRC   = "uploads/logo/logo.webp"
APP   = "app"
PUB   = "public"

# ── Helpers ──────────────────────────────────────────────────────────────

def remove_white_bg(img: Image.Image, threshold: int = 240) -> Image.Image:
    """Remplace les pixels blancs/très clairs par de la transparence."""
    import numpy as np
    arr = np.array(img.convert("RGBA"))
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    mask = (r >= threshold) & (g >= threshold) & (b >= threshold)
    arr[:,:,3] = np.where(mask, 0, a)
    return Image.fromarray(arr, "RGBA")

def crop_bird(img: Image.Image) -> Image.Image:
    """Croppe la partie gauche carrée du logo (oiseau uniquement)."""
    h = img.height
    return img.crop((0, 0, h, h))

def make_ico(png_buffers: list[bytes]) -> bytes:
    """Assemble plusieurs PNG RGBA en un ICO valide (PNG-inside-ICO)."""
    count = len(png_buffers)
    header_size = 6 + count * 16
    offsets = []
    offset = header_size
    for buf in png_buffers:
        offsets.append(offset)
        offset += len(buf)

    ico = bytearray()
    # En-tête
    ico += struct.pack("<HHH", 0, 1, count)
    # Répertoire
    for i, buf in enumerate(png_buffers):
        img_tmp = Image.open(io.BytesIO(buf))
        w, h = img_tmp.size
        ico += struct.pack("<BBBBHHII",
            w if w < 256 else 0,
            h if h < 256 else 0,
            0, 0,       # colorCount, reserved
            1, 32,      # planes, bitCount
            len(buf),
            offsets[i]
        )
    # Données PNG
    for buf in png_buffers:
        ico += buf
    return bytes(ico)

def to_png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

# ── Chargement et préparation ─────────────────────────────────────────────

print("Chargement du logo…")
logo_full = Image.open(SRC).convert("RGBA")
print(f"  Taille originale : {logo_full.size}")

# Oiseau : crop carré gauche + suppression fond blanc
bird = remove_white_bg(crop_bird(logo_full.copy()))

# Logo complet : suppression fond blanc
logo_clean = remove_white_bg(logo_full.copy())

# ── Favicon (ICO) : 16 / 32 / 48 px ─────────────────────────────────────

print("\nGénération favicon.ico…")
ico_buffers = []
for size in [16, 32, 48]:
    resized = bird.resize((size, size), Image.LANCZOS)
    ico_buffers.append(to_png_bytes(resized))
    print(f"  {size}×{size}px ✓")

ico_path = os.path.join(APP, "favicon.ico")
with open(ico_path, "wb") as f:
    f.write(make_ico(ico_buffers))
print(f"  → {ico_path} ({os.path.getsize(ico_path)} bytes)")

# ── app/icon.png : 32×32 ─────────────────────────────────────────────────

icon_path = os.path.join(APP, "icon.png")
bird.resize((32, 32), Image.LANCZOS).save(icon_path, "PNG", optimize=True)
print(f"\napp/icon.png         → {os.path.getsize(icon_path)} bytes")

# ── app/apple-icon.png : 180×180 ─────────────────────────────────────────

apple_path = os.path.join(APP, "apple-icon.png")
bird.resize((180, 180), Image.LANCZOS).save(apple_path, "PNG", optimize=True)
print(f"app/apple-icon.png   → {os.path.getsize(apple_path)} bytes")

# ── Back office : logo complet, fond transparent ─────────────────────────
# Largeur sidebar = 196px, avec marges = ~160px utiles. On vise 2× pour retina.

print("\nGénération logo back office…")
bo_w = 320  # 2× la largeur d'affichage (160px dans la sidebar)
ratio = bo_w / logo_clean.width
bo_h = round(logo_clean.height * ratio)
logo_bo = logo_clean.resize((bo_w, bo_h), Image.LANCZOS)
logo_bo.save("uploads/logo/logo-bo.webp", "WEBP", quality=90)
print(f"  uploads/logo/logo-bo.webp → {bo_w}×{bo_h}px, {os.path.getsize('uploads/logo/logo-bo.webp')} bytes")

# ── public/ : logo site (WebP + PNG fallback) ─────────────────────────────

site_w = 640
ratio = site_w / logo_clean.width
site_h = round(logo_clean.height * ratio)
logo_site = logo_clean.resize((site_w, site_h), Image.LANCZOS)

logo_site.save(os.path.join(PUB, "logo.webp"), "WEBP", quality=85)
logo_site.save(os.path.join(PUB, "logo.png"), "PNG", optimize=True)
print(f"\npublic/logo.webp     → {site_w}×{site_h}px, {os.path.getsize(os.path.join(PUB, 'logo.webp'))} bytes")
print(f"public/logo.png      → {site_w}×{site_h}px, {os.path.getsize(os.path.join(PUB, 'logo.png'))} bytes")

print("\n✓ Tous les fichiers générés.")
