"""Recorta o render da pressure seal (fundo cinza em degradê) e põe no estúdio do site.

A válvula é cromada e em alguns trechos tem a mesma cor do fundo. O recorte usa a
diferença para o fundo estimado e, do castelo para baixo, fecha os buracos internos;
no volante os vãos continuam vazados. A sombra original sai e entra a do estúdio.

Uso: python3 scripts/pressure_seal.py  (lê _originais/renders/pressure-seal-original.jpg)
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import estudio

ORIGEM = estudio.ROOT / "_originais" / "renders" / "pressure-seal-original.jpg"
PECA = (85, 45, 355, 470)   # caixa da válvula e da sombra no original (439 x 500)
VOLANTE_ATE = 205           # acima desta linha os vãos do volante ficam vazados
BASE = 447                  # abaixo desta linha só há sombra


def fundo_ajustado(a):
    """Fundo cinza estimado em cada ponto.

    1. Polinômio de 2º grau ajustado fora da caixa da peça (primeira aproximação).
    2. Média local (gaussiana normalizada) só dos pixels que já parecem fundo, para
       seguir a vinheta real do render dentro da caixa também.
    """
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    x, y = xx / w - 0.5, yy / h - 0.5
    base = np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], axis=-1)
    fora = np.ones((h, w), bool)
    fora[PECA[1]:PECA[3], PECA[0]:PECA[2]] = False
    poli = np.empty_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(base[fora], a[..., c][fora], rcond=None)
        poli[..., c] = base @ coef
    parece = np.abs(a / np.maximum(poli, 1) - 1).max(axis=2) < 0.045
    # longe da peça: tira do "fundo" o que encosta em pixels claramente diferentes
    m = Image.fromarray((parece * 255).astype("uint8")).filter(ImageFilter.MinFilter(9))
    peso = np.asarray(m, dtype=np.float64) / 255

    k = np.exp(-0.5 * (np.arange(-66, 67) / 22.0) ** 2)
    k /= k.sum()

    def borra(v):
        v = np.pad(v, 66, mode="edge")
        v = np.apply_along_axis(lambda l: np.convolve(l, k, mode="valid"), 0, v)
        return np.apply_along_axis(lambda l: np.convolve(l, k, mode="valid"), 1, v)

    den = np.maximum(borra(peso), 1e-3)
    return np.stack([borra(a[..., c] * peso) / den for c in range(3)], axis=-1)


def recortar(src):
    a = np.asarray(src, dtype=np.float64)
    h, w, _ = a.shape
    dif = np.abs(a / np.maximum(fundo_ajustado(a), 1) - 1).max(axis=2)
    alfa = np.clip((dif - 0.035) / 0.05, 0, 1)
    yy = np.mgrid[0:h, 0:w][0]
    alfa[yy > BASE] = 0
    # sombra de contato junto à base: só passa o que é bem diferente do fundo
    alfa[(yy > BASE - 45) & (dif < 0.16)] = 0
    # fecha os buracos internos (cromado da cor do fundo) do castelo para baixo
    nucleo = Image.fromarray(((alfa > 0.5) * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5))
    cheio = nucleo.copy()
    ImageDraw.floodfill(cheio, (0, 0), 128)
    dentro = np.asarray(cheio) != 128
    dentro = np.asarray(Image.fromarray((dentro * 255).astype("uint8")).filter(ImageFilter.MinFilter(5))) > 0
    alfa = np.where((yy >= VOLANTE_ATE) & dentro, 1.0, alfa)
    mk = Image.fromarray((alfa * 255).astype("uint8")).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    out = src.copy()
    out.putalpha(mk)
    return out


if __name__ == "__main__":
    peca = recortar(Image.open(ORIGEM).convert("RGB"))
    peca.save(estudio.ROOT / "_originais" / "renders" / "pressure-seal-recorte.png")
    img = estudio.compor(peca, altura=0.74)
    img.save(estudio.OUT / "pressure-seal.jpg", quality=86)
    img.save(estudio.OUT / "pressure-seal.webp", quality=84, method=6)
    img.resize((300, 375), Image.LANCZOS).save(estudio.OUT / "pressure-seal-300.webp", quality=82, method=6)
    print("ok", img.size)
