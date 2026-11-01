// Verifica estrutura e conteúdo obrigatório do index.html (Task 3).
const path = require('path');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const SECTIONS = ['inicio', 'sobre', 'linha', 'bi-excentrica', 'servicos', 'segmentos', 'estrutura', 'contato'];

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('FAIL', msg); } };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL);

  check((await page.title()).includes('NEW'), 'título sem "NEW"');
  check(await page.locator('h1').count() === 1, 'precisa de exatamente um h1');
  for (const id of SECTIONS) check(await page.locator('#' + id).count() === 1, `seção #${id} ausente`);

  const html = await page.content();
  const text = await page.evaluate(() => document.body.innerText);
  check(!/burger/i.test(html), 'menciona W.Burger');
  check(!html.includes('99709'), 'exibe o telefone 99709-4211');
  check(!/\p{Extended_Pictographic}/u.test(text), 'contém emoji');
  for (const s of ['50.582.366/0001-94', 'CREA-SP 2619052', 'Rua Argentina Grillo Badia, 960', '14176-113', 'comercial@newequipamentos.ind.br']) {
    check(text.includes(s), `rodapé/contato sem "${s}"`);
  }
  check(await page.locator('a[href^="https://wa.me/5516997223976"]').count() > 0, 'sem link de WhatsApp');

  // alt vazio só vale para camadas dentro de um contêiner role="img" que já tem a descrição.
  const semAlt = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.getAttribute('alt') && !i.closest('[role="img"][aria-label]')).map((i) => i.src));
  check(semAlt.length === 0, `imagens sem alt: ${semAlt.join(', ')}`);
  const quebradas = await page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src));
  check(quebradas.length === 0, `imagens quebradas: ${quebradas.join(', ')}`);

  check(await page.locator('[data-produto] .js-orcar').count() >= 4, 'cartões de produto sem botão .js-orcar');
  check(await page.locator('a.js-lightbox[href]').count() >= 4, 'galeria com menos de 4 fotos ampliáveis');
  for (const f of ['nome', 'empresa', 'email', 'telefone', 'produto', 'mensagem']) {
    check(await page.locator(`#orcamentoForm [name="${f}"]`).count() === 1, `form sem campo ${f}`);
  }
  for (const f of ['nome', 'email', 'mensagem']) {
    check(await page.locator(`#orcamentoForm [name="${f}"][required]`).count() === 1, `campo ${f} deveria ser obrigatório`);
  }
  check(await page.locator('video[poster]').count() === 1, 'vídeo com poster ausente');
  // Conteúdo do catálogo de apresentação e da ficha cadastral.
  for (const nome of ['Usina Caeté', 'Usina Santa Isabel', 'Usina Santa Fé', 'ADM do Brasil', 'Usiminas', 'Ball']) {
    check(text.includes(nome), `cliente "${nome}" ausente`);
  }
  for (const produto of ['Borboleta bi‑excêntrica', 'Borboleta concêntrica', 'Retenção dupla porta', 'Esfera segmentada', 'Guilhotina', 'Gaveta e globo', 'Pressure seal']) {
    check(await page.locator(`.produto h3:has-text("${produto}")`).count() === 1, `produto "${produto}" ausente da linha`);
  }
  check(await page.locator('#item-retencao img[src*="estudio/retencao"]').count() === 1, 'retenção sem foto no estúdio');
  check(await page.locator('.outros summary:has-text("Retenção")').count() === 0, 'retenção repetida em "outros"');
  // enxugado: sem faixa de clientes, radar, recibo, linhas gigantes de contato e marcador da abertura
  for (const sel of ['.segments-band', '.map-radar', '.slip', '.contact-rows', '#valvula-abertura', '.rail-track', '.catalog-section']) {
    check(await page.locator(sel).count() === 0, `${sel} deveria ter saído`);
  }
  // um só estilo de botão principal e nenhum "quadrado" em volta das imagens de produto
  check(await page.locator('.btn--dark').count() === 0, 'ainda há botão .btn--dark');
  const imgsProduto = await page.$$eval('.produto img, .tech-render img', (i) => i.map((x) => x.getAttribute('src')));
  check(imgsProduto.length >= 8 && imgsProduto.every((src) => src.startsWith('img/estudio/')), `imagens de produto fora do estúdio: ${imgsProduto}`);
  check(text.includes('24 anos'), 'tempo de experiência ausente');
  check(await page.locator('.servico-destaque img[src*="estudio/redutora"]').count() === 1, 'redutora ausente dos serviços');
  check(await page.locator('.servico-destaque img[src*="estudio/controle"]').count() === 1, 'válvula de controle ausente dos serviços');
  check(await page.locator('#segmentos img[src*="opt/industria"]').count() === 1, 'imagem da indústria ausente dos segmentos');
  for (const t of ['válvulas condicionadoras de vapor', 'válvulas redutoras de pressão', 'válvulas automáticas', 'Hiter', 'Foxwall']) {
    check(text.toLowerCase().includes(t.toLowerCase()), `manutenção especializada sem "${t}"`);
  }
  check(await page.locator('header a.nav-whatsapp[href^="https://wa.me/5516997223976"]').count() === 1, 'ícone do WhatsApp ausente no menu');
  check(!text.includes('72"') && !/borboletas? de 150# a 300#/.test(text), 'borboleta só até 48" Classe 150');
  check(!/18\s*clientes/i.test(text) && !text.includes('clientes atendidos'), 'contagem de clientes não deve aparecer');
  check(text.includes('Principais clientes'), 'título "Principais clientes" ausente');
  check(await page.locator('img[src*="fachada"]').count() === 1, 'foto da fachada ausente');
  check(await page.locator('#bi-excentrica img[src*="estudio/bi-excentrica"]').count() === 1, 'render da bi-excêntrica NEW ausente da ficha técnica');
  check(await page.locator('[data-produto*="Bi-excêntrica"] img[src*="estudio/bi-excentrica"]').count() === 1, 'render ausente do item do catálogo');
  for (const s of ['Caldeiraria', 'Frota própria']) check(text.includes(s), `serviço "${s}" ausente`);
  // Endereços versionados: o navegador não pode reaproveitar o CSS/JS do site antigo em cache.
  for (const sel of ['link[rel=stylesheet][href^="css/style.css"]', 'script[src^="js/main.js"]', 'script[src^="js/whatsapp.js"]']) {
    const url = await page.getAttribute(sel, sel.startsWith('link') ? 'href' : 'src');
    check(/\?v=\d+/.test(url || ''), `${sel} sem versão no endereço (${url})`);
  }

  await browser.close();
  console.log(failures ? `${failures} falha(s)` : 'content: todos passaram');
  process.exit(failures ? 1 : 0);
})();
