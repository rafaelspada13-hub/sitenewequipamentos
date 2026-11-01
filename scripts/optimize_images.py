"""Gera versões otimizadas (WebP + JPEG) das fotos usadas no site em img/opt/.

Uso: python3 scripts/optimize_images.py
Os originais em img/ são mantidos.
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_originais" / "img"  # originais ficam fora do site publicado
OUT = ROOT / "img" / "opt"
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
    "fachada": ("catalogo/fachada.jpeg", (0.296, 0.298, 0.769, 0.772)),  # logo e portão, sem os carros
}


# fotos da galeria (celular, luz mista): recebem o mesmo tratamento de cor
GALERIA = {"borboleta-grande-2", "controle-azul", "borboletas-lote", "redutores"}


def tratar_cor(img):
    """Tratamento único para as fotos de celular do galpão.

    1. Balanço de branco parcial (mundo cinza, 60%): tira a dominante amarela/laranja da luz mista.
    2. Magenta das sedes e protetores um pouco menos saturado (estoura no celular).
    3. Saturação geral 92% e uma curva leve de contraste.
    """
    import numpy as np
    a = np.asarray(img, dtype=np.float32) / 255.0
    media = a.reshape(-1, 3).mean(axis=0)
    ganho = media.mean() / media
    a = a * (1 + (ganho - 1) * 0.6)
    hsv = np.asarray(Image.fromarray(np.clip(a * 255, 0, 255).astype("uint8")).convert("HSV"), dtype=np.float32)
    h, sat = hsv[..., 0], hsv[..., 1]
    magenta = (h > 200) & (h < 245)          # 282° a 345° na escala 0–255 do PIL
    sat = np.where(magenta, sat * 0.75, sat) * 0.92
    hsv[..., 1] = sat
    a = np.asarray(Image.fromarray(hsv.astype("uint8"), "HSV").convert("RGB"), dtype=np.float32) / 255.0
    a = a + (a - 0.5) * 0.08 * (1 - np.abs(a - 0.5) * 2)   # contraste suave, sem estourar as pontas
    return Image.fromarray(np.clip(a * 255, 0, 255).astype("uint8"))


def optimize(slug, filename, crop):
    img = ImageOps.exif_transpose(Image.open(SRC / filename)).convert("RGB")
    if crop:
        w, h = img.size
        img = img.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    if slug in GALERIA:
        img = tratar_cor(img)
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    img.save(OUT / f"{slug}.webp", "WEBP", quality=QUALITY, method=6)
    img.save(OUT / f"{slug}.jpg", "JPEG", quality=QUALITY, optimize=True, progressive=True)


def main(apenas=None):
    OUT.mkdir(exist_ok=True)
    for slug, (filename, crop) in PHOTOS.items():
        if apenas and slug not in apenas:
            continue
        optimize(slug, filename, crop)
        print(f"ok {slug}")


if __name__ == "__main__":
    import sys
    main(set(sys.argv[1:]) or None)
