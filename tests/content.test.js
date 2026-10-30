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

  await browser.close();
  console.log(failures ? `${failures} falha(s)` : 'content: todos passaram');
  process.exit(failures ? 1 : 0);
})();
