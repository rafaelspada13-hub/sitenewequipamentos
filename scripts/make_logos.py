"""Gera img/logo.png (cores originais) e img/logo-claro.png (para fundo escuro)
a partir do logo extraído do boletim técnico, com transparência proporcional à tinta.

Uso: python3 scripts/make_logos.py caminho/do/logo-extraido.png
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LIGHT_INK = (240, 240, 236)
LIGHT_GREEN = (74, 196, 128)
GRAPHITE_ALPHA = 212  # alfa da tinta grafite (#2b2b2b) do logo


def build(src):
    rgb = Image.open(src).convert("RGB")
    original = Image.new("RGBA", rgb.size)
    light = Image.new("RGBA", rgb.size)
    src_px, orig_px, light_px = rgb.load(), original.load(), light.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = src_px[x, y]
            alpha = 255 - min(r, g, b)
            if alpha == 0:
                continue
            k = 255 / alpha  # desfaz a mistura com o branco
            pure = tuple(min(255, max(0, round(255 - (255 - c) * k))) for c in (r, g, b))
            is_green = g > r + 25
            orig_px[x, y] = (*pure, alpha)
            light_alpha = alpha if is_green else min(255, round(alpha * 255 / GRAPHITE_ALPHA))
            light_px[x, y] = (*(LIGHT_GREEN if is_green else LIGHT_INK), light_alpha)
    original.save(ROOT / "img/logo.png", optimize=True)
    light.save(ROOT / "img/logo-claro.png", optimize=True)


if __name__ == "__main__":
    build(sys.argv[1])
