"""Gera versões menores das imagens para o navegador escolher pelo tamanho de tela (srcset).

Uso: python3 scripts/variantes.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# (arquivo de origem, larguras a gerar)
ALVOS = [
    *[(f"img/estudio/{n}.webp", (300,)) for n in
      ("bi-excentrica", "concentrica", "retencao", "gaveta-globo", "guilhotina", "controle")],
    *[(f"img/opt/{n}.webp", (600,)) for n in ("borboleta-grande-2", "controle-azul", "borboletas-lote", "redutores", "fachada")],
    ("img/produtos/palco-estatico.webp", (1600,)),
]


def variante(origem, largura):
    im = Image.open(ROOT / origem)
    if im.width <= largura:
        return
    alt = round(im.height * largura / im.width)
    menor = im.resize((largura, alt), Image.LANCZOS)
    destino = ROOT / origem.replace(".webp", f"-{largura}.webp")
    menor.save(destino, "WEBP", quality=82, method=6)
    print("ok", destino.relative_to(ROOT), menor.size)


def logos():
    for nome, largura in (("logo-claro", 160), ("logo", 288)):
        im = Image.open(ROOT / f"img/{nome}.png")
        alt = round(im.height * largura / im.width)
        im.resize((largura, alt), Image.LANCZOS).save(ROOT / f"img/{nome}-{largura}.png", optimize=True)
        print("ok", f"img/{nome}-{largura}.png", (largura, alt))


if __name__ == "__main__":
    for origem, larguras in ALVOS:
        for largura in larguras:
            variante(origem, largura)
    logos()
