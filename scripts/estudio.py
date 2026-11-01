"""Coloca as imagens de produto no mesmo "estúdio" da abertura, sem caixa.

Fundo no tom FUNDO (o mesmo do palco da abertura e das seções claras), com um leve
escurecido atrás da peça e sombra no chão. As bordas de cada imagem terminam exatamente
em FUNDO, então ela some no fundo da seção.

Uso: python3 scripts/estudio.py caminho/da/midia/da/apresentacao caminho/do/render.jpg
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "img" / "estudio"
FUNDO = (190, 184, 175)
SOMBRA_ESTUDIO = (150, 143, 133)  # tom mais escuro atrás da peça, como no render

# nome -> arquivo da apresentação (PNG com transparência)
RECORTES = {
    "concentrica": "image25.png",
    "esfera": "image27.png",
    "guilhotina": "image29.png",
    "gaveta-globo": "image40.png",
    "pressure-seal": "image46.png",
}


def fundo_estudio(w, h):
    """FUNDO nas bordas, mais escuro no centro (vinheta invertida suave)."""
    img = Image.new("RGB", (w, h))
    px = img.load()
    cx, cy = w / 2, h * 0.52
    rmax = math.hypot(w / 2, h / 2)
    for y in range(h):
        for x in range(w):
            t = min(1.0, math.hypot((x - cx) / 0.85, y - cy) / rmax)
            k = t * t * (3 - 2 * t)
            px[x, y] = tuple(round(SOMBRA_ESTUDIO[i] + (FUNDO[i] - SOMBRA_ESTUDIO[i]) * k) for i in range(3))
    return img


def sombra_chao(w, h, cx, base, largura):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).ellipse([cx - largura / 2, base - largura * 0.07, cx + largura / 2, base + largura * 0.07], fill=110)
    return m.filter(ImageFilter.GaussianBlur(largura * 0.06))


def compor(produto, w=600, h=750, altura=0.74):
    """Produto RGBA centralizado no estúdio, apoiado numa sombra."""
    bg = fundo_estudio(w, h)
    p = produto.copy()
    caixa = p.getbbox()
    if caixa:
        p = p.crop(caixa)
    escala = min(h * altura / p.height, w * 0.78 / p.width)
    p = p.resize((round(p.width * escala), round(p.height * escala)), Image.LANCZOS)
    x = (w - p.width) // 2
    base = round(h * 0.88)
    y = base - p.height
    sombra = sombra_chao(w, h, w / 2, base, p.width * 0.9)
    bg.paste((60, 55, 50), (0, 0), sombra)
    bg.paste(p, (x, y), p)
    return bg


def compor_par(atras, frente, w=600, h=750):
    """Duas peças no mesmo estúdio: uma atrás à esquerda, outra à frente à direita."""
    bg = fundo_estudio(w, h)
    camadas = []
    for peca, altura, cx, base in ((atras, 0.62, 0.37, 0.80), (frente, 0.50, 0.66, 0.90)):
        p = peca.crop(peca.getbbox())
        escala = h * altura / p.height
        p = p.resize((round(p.width * escala), round(p.height * escala)), Image.LANCZOS)
        camadas.append((p, round(w * cx - p.width / 2), round(h * base) - p.height, round(w * cx), round(h * base)))
    for p, x, y, cx, b in camadas:
        bg.paste((60, 55, 50), (0, 0), sombra_chao(w, h, cx, b, p.width * 0.9))
        bg.paste(p, (x, y), p)
    return bg


def recortar_render(render_path, caixa=(0, 110, 704, 1090), limiar=9):
    """Separa a bi-excêntrica do fundo do render.

    O fundo do render é um degradê suave: para cada linha, estima-se a cor do fundo pelas
    bordas (interpolando entre esquerda e direita) e fica opaco só o que difere dela.
    O reflexo no chão é cortado para a sombra do estúdio assumir esse papel.
    """
    src = Image.open(render_path).convert("RGB").crop(caixa)
    w, h = src.size
    px = src.load()
    alfa = Image.new("L", (w, h), 0)
    ap = alfa.load()

    def mediana(xs, y):
        vals = sorted((px[x, y] for x in xs), key=sum)
        return vals[len(vals) // 2]

    for y in range(h):
        esq, dir_ = mediana(range(0, 8), y), mediana(range(w - 8, w), y)
        for x in range(w):
            t = x / (w - 1)
            fundo = [esq[i] + (dir_[i] - esq[i]) * t for i in range(3)]
            d = math.sqrt(sum((px[x, y][i] - fundo[i]) ** 2 for i in range(3)))
            ap[x, y] = max(0, min(255, round((d - limiar) / 22 * 255)))
    alfa = alfa.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    out = src.convert("RGBA")
    out.putalpha(alfa)
    return out


def render_no_estudio(render_path, w, h):
    """A bi-excêntrica recortada do render, no estúdio, como os outros produtos."""
    return compor(recortar_render(render_path), w, h, altura=0.8)


# fotos reais já recortadas do fundo (PNG com transparência), por nome de saída
FOTOS = {
    "retencao": "retencao.png",
    "controle": "controle.png",      # render do cliente em fundo branco, já recortado
}

# renders feitos no ChatGPT no padrão da bi-excêntrica: arquivo -> (nome, caixa sem o reflexo)
RENDERS = {
    "render-concentrica.png": ("concentrica", (0, 76, 1024, 1404)),  # acima de 76 só há fundo
    "render-globo.png": ("globo", (0, 0, 1024, 1432)),               # a flange esquerda desce até 1430
}
# gaveta (marca de terceiro apagada) atrás e globo à frente, no mesmo quadro do cartão "Gaveta e globo"
PAR_GAVETA_GLOBO = (("render-gaveta.png", (0, 0, 1024, 1476), 24), ("render-globo.png", (0, 0, 1024, 1432), 9))


def salvar(img, nome):
    img.save(OUT / f"{nome}.webp", "WEBP", quality=84, method=6)
    img.save(OUT / f"{nome}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    print("ok", nome, img.size)


def main(midia, render):
    OUT.mkdir(parents=True, exist_ok=True)
    for nome, arquivo in RECORTES.items():
        salvar(compor(Image.open(Path(midia) / arquivo).convert("RGBA")), nome)
    recortes = Path(midia).parent.parent.parent.parent / "recortes"
    for nome, arquivo in FOTOS.items():
        if (recortes / arquivo).exists():
            salvar(compor(Image.open(recortes / arquivo).convert("RGBA"), altura=0.7), nome)
    for arquivo, (nome, caixa) in RENDERS.items():
        # renders do ChatGPT: guardados em _originais/renders (ou na pasta de recortes antiga)
        fonte = next((d / arquivo for d in (ROOT / "_originais" / "renders", recortes) if (d / arquivo).exists()), None)
        if fonte:
            salvar(compor(recortar_render(fonte, caixa), altura=0.8), nome)
    pasta = ROOT / "_originais" / "renders"
    if all((pasta / a).exists() for a, _, _ in PAR_GAVETA_GLOBO):
        pecas = [recortar_render(pasta / a, c, limiar=l) for a, c, l in PAR_GAVETA_GLOBO]
        salvar(compor_par(*pecas), "gaveta-globo")
    salvar(render_no_estudio(render, 600, 750), "bi-excentrica")
    salvar(render_no_estudio(render, 720, 1080), "bi-excentrica-alta")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
