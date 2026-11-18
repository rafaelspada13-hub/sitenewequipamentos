"""Recorta o render da válvula esfera (fundo branco) e põe no estúdio do site.

O fundo é branco puro: sai tudo o que é branco e está ligado à borda da imagem, e
também os furos vazados dos flanges (branco puro cercado pela peça).

Uso: python3 scripts/esfera.py  (lê _originais/renders/esfera-original.webp)
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import estudio

ORIGEM = estudio.ROOT / "_originais" / "renders" / "esfera-original.webp"


def recortar(src):
    a = np.asarray(src).astype(int)
    claro = a.min(axis=2) >= 243
    # fundo = branco ligado à borda
    m = Image.fromarray((claro * 255).astype("uint8"))
    ImageDraw.floodfill(m, (0, 0), 128)
    fundo = np.asarray(m) == 128
    furos = (a.min(axis=2) >= 251) & ~fundo          # furos vazados: branco puro dentro da peça
    furos = np.asarray(Image.fromarray((furos * 255).astype("uint8")).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(9))) > 0
    furos &= a.min(axis=2) >= 243
    alfa = ~(fundo | furos)
    mk = Image.fromarray((alfa * 255).astype("uint8")).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
    out = src.copy()
    out.putalpha(mk)
    return out


if __name__ == "__main__":
    img = estudio.compor(recortar(Image.open(ORIGEM).convert("RGB")), altura=0.6)
    img.save(estudio.OUT / "esfera.jpg", quality=86)
    img.save(estudio.OUT / "esfera.webp", quality=84, method=6)
    img.resize((300, 375), Image.LANCZOS).save(estudio.OUT / "esfera-300.webp", quality=82, method=6)
    print("ok", img.size)
