# Repaginação do site NEW Válvulas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir o site institucional de uma página no estilo "Engenharia de precisão", com dados técnicos do boletim DT-VB150-001 e formulário que abre o WhatsApp.

**Architecture:** Site estático: `index.html` + `css/style.css` + scripts clássicos (sem módulos, para funcionar via `file://`). Lógica pura do formulário isolada em `js/whatsapp.js` (testável); interações em `js/main.js`. Imagens otimizadas por um script Python em `img/opt/`. Testes de aceitação em Node + Playwright.

**Tech Stack:** HTML5, CSS (custom properties, grid), JS ES2020 sem build, Google Fonts, Python 3 + Pillow (otimização), Playwright (testes).

**Spec:** `docs/superpowers/specs/2026-10-30-repaginacao-site-design.md`

## Global Constraints

- Nenhuma menção a W.Burger em nenhum arquivo do site.
- WhatsApp: `5516997223976`. Não exibir `99709-4211`.
- E-mail: `comercial@newequipamentos.ind.br`.
- Rodapé: New Service Equipamentos Industriais Ltda · CNPJ 50.582.366/0001-94 · CREA-SP 2619052 · Rua Argentina Grillo Badia, 960 · Distrito Industrial · Sertãozinho/SP · CEP 14176-113.
- Dados da bi-excêntrica vêm do boletim (2"–48", ASME Classe 150, semi-lug, até 250 °C contínuo, pico 300 °C, API 609 Cat. B, WCB · ferro nodular · CF8/CF8M/CF3, sede RPTFE).
- Não inventar números (anos, quantidades).
- Sem emojis; ícones em SVG inline.
- Cor de destaque: verde da marca. Fundo base grafite.
- Sem rolagem horizontal de 360px a 1920px.
- Conteúdo visível sem JS; animações desligadas com `prefers-reduced-motion`.
- Contraste AA; foco visível; `alt` em todas as fotos.

## Review Focus

1. JS desabilitado ou com erro → todo o conteúdo visível (sem `opacity:0` preso). Teste em Task 5.
2. Celular 360px → nenhuma rolagem horizontal, tabela dimensional rola dentro do próprio contêiner. Teste em Task 6.
3. Formulário com acentos, `&`, `#`, quebras de linha → URL do WhatsApp corretamente codificada. Teste em Task 2.
4. Envio com campos obrigatórios vazios → não abre WhatsApp, campos marcados com erro e foco no primeiro. Teste em Task 5.
5. Lightbox/modal → fecham com Esc, devolvem o foco ao gatilho. Teste em Task 5.

---

### Task 1: Assets (logo, desenho, fotos otimizadas)

**Files:**
- Create: `scripts/optimize_images.py`, `img/logo.png`, `img/bi-excentrica-dimensional.png`, `img/opt/*`
- Test: `tests/assets.test.js`

**Interfaces:**
- Produces: `img/logo.png` (fundo transparente), `img/bi-excentrica-dimensional.png`, e para cada foto selecionada `img/opt/<slug>.webp` e `img/opt/<slug>.jpg` (largura ≤ 1600px, qualidade 78). Slugs: `hero-borboleta-atuador` (WhatsApp 10.07.44), `borboleta-vermelha` (galeria-vermelho), `usinagem` (10.07.42), `globo-controle` (Foto_II), `gaveta-par` (10.07.43 (1)), `borboleta-grande-1..3` (15.18.31, 15.18.32 (1), 15.18.32 (3)), `borboletas-lote` (10.07.42 (2)), `estoque-mix` (galeria-mix), `controle-azul` (19.59.43), `redutores` (09.35.41), `gaveta-galpao` (sobre-galpao), `globo-volante` (Foto_I), `lote-gavetas` (10.07.38).

- [ ] **Step 1:** Escrever `tests/assets.test.js`: para cada slug acima, existem `.webp` e `.jpg`, largura ≤ 1600, `.webp` < 400 KB; `img/logo.png` tem canal alfa.
- [ ] **Step 2:** `node tests/assets.test.js` → FAIL (arquivos ausentes).
- [ ] **Step 3:** Extrair logo e desenho do PDF com `pdfimages -png`; tornar branco do logo transparente. Implementar `optimize_images.py` (mapeamento slug→arquivo, `ImageOps.exif_transpose`, recorte opcional por slug).
- [ ] **Step 4:** `python3 scripts/optimize_images.py && node tests/assets.test.js` → PASS.
- [ ] **Step 5:** Commit `feat: assets otimizados, logo e desenho dimensional`.

### Task 2: Montagem da mensagem do WhatsApp

**Files:**
- Create: `js/whatsapp.js`, `tests/whatsapp.test.js`

**Interfaces:**
- Produces: `window.NEW.buildWhatsAppUrl({nome, empresa, email, telefone, produto, mensagem}) -> string` — retorna `https://wa.me/5516997223976?text=<encodeURIComponent(texto)>`; campos vazios omitidos; texto começa com `Olá, NEW! Gostaria de um orçamento.`. Arquivo exporta também via `module.exports` quando existir (para teste em Node).

- [ ] **Step 1:** Testes: (a) URL começa com `https://wa.me/5516997223976?text=`; (b) `decodeURIComponent` do texto contém `Nome: José & Cia #1` e a linha `Produto: Válvula Bi-excêntrica`; (c) quebra de linha na mensagem preservada; (d) `empresa` vazia não gera linha `Empresa:`.
- [ ] **Step 2:** `node tests/whatsapp.test.js` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** → PASS. Commit `feat: monta pedido de orçamento para WhatsApp`.

### Task 3: Estrutura HTML e conteúdo

**Files:**
- Modify (reescrever): `index.html`
- Test: `tests/content.test.js` (Playwright, `file://`)

**Interfaces:**
- Produces IDs de seção: `#inicio`, `#sobre`, `#produtos`, `#bi-excentrica`, `#servicos`, `#segmentos`, `#estrutura`, `#contato`. Cartões de produto: `[data-produto="<nome>"]` com botão `.js-orcar`. Fotos da galeria: `a.js-lightbox[href]`. Form `#orcamentoForm` com campos `nome*`, `empresa`, `email*`, `telefone`, `produto`, `mensagem*`.

- [ ] **Step 1:** Testes: título contém "NEW"; existem todos os IDs; texto da página não contém `Burger`, `99709`, nem emojis (regex `\p{Extended_Pictographic}`); contém `50.582.366/0001-94`; toda `img` tem `alt` não vazio; link `wa.me/5516997223976` presente.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Escrever HTML semântico com o conteúdo da spec (textos atuais revisados; produtos atuais com bi-excêntrica corrigida pelo boletim; serviços em etapas; segmentos; galeria com `<picture>` webp+jpg e `loading="lazy"`; vídeo `img/WhatsApp Video 2026-04-20 at 15.14.54.mp4` com `preload="none"` e poster; rodapé). Seção `#bi-excentrica` entra só como contêiner (preenchida na Task 6).
- [ ] **Step 4:** → PASS. Commit `feat: nova estrutura e conteúdo do site`.

### Task 4: Sistema visual (CSS)

**Files:**
- Modify (reescrever): `css/style.css`

**Interfaces:**
- Produces tokens em `:root`: `--bg` (grafite), `--bg-2`, `--surface-light`, `--text`, `--text-muted`, `--brand` (verde do logo), `--brand-bright` (verde com contraste AA sobre `--bg`), `--line`, fontes `--font-display`, `--font-body`, `--font-mono`. Classes utilitárias `.reveal` (só anima quando `html.js` presente).

- [ ] **Step 1:** Implementar CSS: header fixo com blur, hero com foto em tela cheia e gradiente, cotas técnicas (`.dim-line`), grid de produtos, modal, lightbox, mosaico, form, rodapé; breakpoints 600/900/1200.
- [ ] **Step 2:** Screenshots Playwright 390 e 1440 → conferir visualmente; `document.documentElement.scrollWidth <= innerWidth` em 360, 390, 768, 1440.
- [ ] **Step 3:** Commit `feat: sistema visual engenharia de precisão`.

### Task 5: Interações (JS)

**Files:**
- Modify (reescrever): `js/main.js`
- Test: `tests/interactions.test.js`

**Interfaces:**
- Consumes: `window.NEW.buildWhatsAppUrl` (Task 2), seletores da Task 3.

- [ ] **Step 1:** Testes: (a) com JS desabilitado (`javaScriptEnabled:false`) todo `.reveal` tem opacidade 1; (b) clicar `.js-orcar` do cartão bi-excêntrica rola para `#contato` e seleciona o produto; (c) enviar vazio → nenhum popup, `#nome` com `aria-invalid="true"` e focado; (d) enviar preenchido → `window.open` chamado com URL `wa.me` (interceptar via `page.exposeFunction`); (e) lightbox abre, Esc fecha, foco volta ao link; (f) menu mobile abre/fecha em 390px.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementar: adiciona `js` em `<html>`; IntersectionObserver para `.reveal`; menu mobile com `aria-expanded`; header compacto ao rolar; modal de ficha do produto; lightbox com navegação por setas; validação e envio via `window.open(url, '_blank', 'noopener')`.
- [ ] **Step 4:** → PASS. Commit `feat: interações, lightbox e envio para WhatsApp`.

### Task 6: Seção técnica da bi-excêntrica

**Files:**
- Modify: `index.html` (seção `#bi-excentrica`), `css/style.css`
- Test: `tests/technical.test.js`

- [ ] **Step 1:** Testes: tabela dimensional tem 19 linhas de dados, primeira `2"` com DN `50` e ISO `F07`, última `48"` com DN `1200` e `F30`; curva P×T SVG tem 3 séries (WCB, CF8/CF3, CF8M); link para `docs/tecnico/DT-VB150-001-valvula-borboleta-bi-excentrica-classe-150.pdf` existe; em 360px a página não rola horizontalmente e `.table-scroll` tem `scrollWidth > clientWidth`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementar com os valores do boletim: destaques, desenho dimensional, tabela (seção 4), normas (seção 2), configuração construtiva (seção 3), gráfico SVG P×T (seção 5: 38/100/150/200/250/300 °C), tabela de aplicações (seção 8, com status Indicada/Com restrição/Não recomendada), botão de download.
- [ ] **Step 4:** → PASS. Commit `feat: ficha técnica completa da bi-excêntrica`.

### Task 7: Revisão de qualidade visual

**Files:**
- Modify conforme achados: `index.html`, `css/style.css`, `js/main.js`

- [ ] **Step 1:** Rodar todos os testes: `for f in tests/*.test.js; do node $f || exit 1; done` → todos PASS.
- [ ] **Step 2:** Screenshots full-page em 390 e 1440; revisar com as skills taste-skill e impeccable (hierarquia, tipografia, ritmo, contraste, acabamento).
- [ ] **Step 3:** Corrigir o que for apontado; repetir Step 1.
- [ ] **Step 4:** Remover imagens originais não referenciadas? **Não** — manter originais (spec). Commit `style: ajustes finais de qualidade` e push.
