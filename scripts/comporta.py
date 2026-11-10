"""Recorta o render da comporta (fundo em degradê cinza) e põe no estúdio do site.

Uso: python3 scripts/comporta.py   (lê _originais/renders/comporta-original.jpg)
"""
import numpy as np
from PIL import Image, ImageFilter

import estudio

ORIGEM = estudio.ROOT / "_originais" / "renders" / "comporta-original.jpg"


def recortar(im):
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    fundo = np.median(a[:, :60, :], axis=1)  # o degradê é igual em cada linha
    m = np.abs(a - fundo[:, None, :]).max(axis=2) > 22
    yy, xx = np.mgrid[0:h, 0:w]
    m &= ~(yy > 768 - (xx - 385) * 0.637 + 2)  # sombra projetada no chão
    m[:, 720:] = False
    esq = int(np.median([np.where(m[y])[0].min() for y in range(240, 735)]))
    m[225:742, esq:407] = True   # face lateral: tem trechos da mesma cor do fundo
    m[350:592, 578:650] = True   # guia direita
    mk = Image.fromarray((m * 255).astype("uint8"))
    mk = mk.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.copy()
    out.putalpha(mk)
    return out


if __name__ == "__main__":
    img = estudio.compor(recortar(Image.open(ORIGEM).convert("RGB")), altura=0.78)
    img.save(estudio.OUT / "comporta.jpg", quality=86)
    img.save(estudio.OUT / "comporta.webp", quality=84, method=6)
    img.resize((300, 375), Image.LANCZOS).save(estudio.OUT / "comporta-300.webp", quality=82, method=6)
    print("ok", img.size)
