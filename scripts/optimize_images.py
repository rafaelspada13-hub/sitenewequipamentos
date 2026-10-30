"""Gera versões otimizadas (WebP + JPEG) das fotos usadas no site em img/opt/.

Uso: python3 scripts/optimize_images.py
Os originais em img/ são mantidos.
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "img"
OUT = SRC / "opt"
MAX_WIDTH = 1600
QUALITY = 78

# slug -> (arquivo original, recorte opcional em frações (esq, topo, dir, base))
PHOTOS = {
    "borboleta-vermelha": ("galeria-vermelho.jpg", None),
    "usinagem": ("WhatsApp Image 2026-04-08 at 10.07.42 (2).jpeg", None),
    "globo-controle": ("Foto_II.jpeg", None),
    "gaveta-par": ("WhatsApp Image 2026-04-08 at 10.07.43 (1).jpeg", None),
    "borboleta-grande-1": ("WhatsApp Image 2026-04-20 at 15.18.31.jpeg", None),
    "borboleta-grande-2": ("WhatsApp Image 2026-04-20 at 15.18.32 (1).jpeg", None),
    "borboleta-grande-3": ("WhatsApp Image 2026-04-20 at 15.18.32 (3).jpeg", None),
    "borboletas-lote": ("WhatsApp Image 2026-04-08 at 10.07.42.jpeg", None),
    "estoque-mix": ("galeria-mix.jpg", None),
    "controle-azul": ("WhatsApp Image 2026-04-08 at 19.59.43.jpeg", None),
    "redutores": ("WhatsApp Image 2026-06-03 at 09.35.41.jpeg", None),
    "gaveta-galpao": ("sobre-galpao.jpg", None),
    "globo-volante": ("Foto_I.jpeg", None),
    "lote-gavetas": ("WhatsApp Image 2026-04-08 at 10.07.38.jpeg", None),
    "fachada": ("catalogo/fachada.jpeg", None),
}


def optimize(slug, filename, crop):
    img = ImageOps.exif_transpose(Image.open(SRC / filename)).convert("RGB")
    if crop:
        w, h = img.size
        img = img.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    img.save(OUT / f"{slug}.webp", "WEBP", quality=QUALITY, method=6)
    img.save(OUT / f"{slug}.jpg", "JPEG", quality=QUALITY, optimize=True, progressive=True)


def main():
    OUT.mkdir(exist_ok=True)
    for slug, (filename, crop) in PHOTOS.items():
        optimize(slug, filename, crop)
        print(f"ok {slug}")


if __name__ == "__main__":
    main()
