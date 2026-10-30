// Verifica estrutura e conteúdo obrigatório do index.html (Task 3).
const path = require('path');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const SECTIONS = ['inicio', 'sobre', 'produtos', 'bi-excentrica', 'servicos', 'segmentos', 'estrutura', 'contato'];

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

  const semAlt = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.getAttribute('alt')).map((i) => i.src));
  check(semAlt.length === 0, `imagens sem alt: ${semAlt.join(', ')}`);
  const quebradas = await page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src));
  check(quebradas.length === 0, `imagens quebradas: ${quebradas.join(', ')}`);

  check(await page.locator('[data-produto] .js-orcar').count() >= 4, 'cartões de produto sem botão .js-orcar');
  check(await page.locator('a.js-lightbox[href]').count() >= 6, 'galeria com menos de 6 fotos ampliáveis');
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
  for (const produto of ['Borboleta concêntrica', 'Esfera segmentada', 'Guilhotina', 'Gaveta e globo', 'Pressure seal']) {
    check(await page.locator(`.item summary:has-text("${produto}")`).count() === 1, `produto "${produto}" ausente do catálogo`);
  }
  check(text.includes('24 anos'), 'tempo de experiência ausente');
  check(await page.locator('img[src*="fachada"]').count() === 1, 'foto da fachada ausente');
  check(await page.locator('#bi-excentrica img[src*="bi-excentrica-new"]').count() === 1, 'render da bi-excêntrica NEW ausente da ficha técnica');
  check(await page.locator('[data-produto*="Bi-excêntrica"] img[src*="bi-excentrica-new"]').count() === 1, 'render ausente do item do catálogo');
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
