// Interações da página (js/main.js): entradas, orçar item, formulário, lightbox, menu.
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');

async function openPage(browser, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (url) => { window.__opened.push(url); return null; };
  });
  await page.goto(URL);
  return page;
}

const tests = {
  'sem JS todo o conteúdo fica visível': async (browser) => {
    const page = await openPage(browser, { javaScriptEnabled: false });
    const hidden = await page.$$eval('.reveal', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    assert.strictEqual(hidden, 0, `${hidden} elementos .reveal invisíveis`);
  },
  'com JS os elementos aparecem ao rolar': async (browser) => {
    const page = await openPage(browser);
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('js')), 'html sem classe js');
    const before = await page.$eval('#servicos .reveal', (e) => getComputedStyle(e).opacity);
    assert.strictEqual(before, '0', 'elemento abaixo da dobra já visível antes de rolar');
    await page.locator('#servicos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const op = await page.$eval('#servicos .reveal', (e) => getComputedStyle(e).opacity);
    assert.strictEqual(op, '1');
  },
  '"Orçar este item" leva ao formulário com o produto selecionado': async (browser) => {
    const page = await openPage(browser);
    await page.locator('[data-produto="Válvula Borboleta Bi-excêntrica Classe 150"] .js-orcar').click();
    await page.waitForTimeout(900);
    assert.strictEqual(await page.$eval('#produto', (s) => s.value), 'Válvula Borboleta Bi-excêntrica Classe 150');
    const top = await page.$eval('#orcamentoForm', (f) => f.getBoundingClientRect().top);
    assert.ok(top >= 0 && top < 900, `formulário fora da tela (top ${top})`);
  },
  'envio vazio não abre o WhatsApp e marca o primeiro campo': async (browser) => {
    const page = await openPage(browser);
    await page.locator('#orcamentoForm button[type=submit]').click();
    assert.deepStrictEqual(await page.evaluate(() => window.__opened), []);
    assert.strictEqual(await page.getAttribute('#nome', 'aria-invalid'), 'true');
    assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'nome');
    assert.ok(await page.isVisible('#formError'));
  },
  'e-mail inválido é recusado': async (browser) => {
    const page = await openPage(browser);
    await page.fill('#nome', 'Ana');
    await page.fill('#email', 'ana-sem-arroba');
    await page.fill('#mensagem', 'Preciso de 4 válvulas');
    await page.locator('#orcamentoForm button[type=submit]').click();
    assert.deepStrictEqual(await page.evaluate(() => window.__opened), []);
    assert.strictEqual(await page.getAttribute('#email', 'aria-invalid'), 'true');
  },
  'envio preenchido abre o WhatsApp com o pedido': async (browser) => {
    const page = await openPage(browser);
    await page.fill('#nome', 'Ana Souza');
    await page.fill('#email', 'ana@usina.com.br');
    await page.selectOption('#produto', 'Caixa Redutora');
    await page.fill('#mensagem', 'Preciso de 4 unidades');
    await page.locator('#orcamentoForm button[type=submit]').click();
    const opened = await page.evaluate(() => window.__opened);
    assert.strictEqual(opened.length, 1);
    assert.ok(opened[0].startsWith('https://wa.me/5516997223976?text='));
    assert.ok(decodeURIComponent(opened[0]).includes('Produto: Caixa Redutora'));
    assert.strictEqual(await page.getAttribute('#nome', 'aria-invalid'), null);
  },
  'lightbox abre, navega, fecha com Esc e devolve o foco': async (browser) => {
    const page = await openPage(browser);
    const link = page.locator('a.js-lightbox').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const dialog = page.locator('dialog.lightbox');
    assert.ok(await dialog.isVisible(), 'lightbox não abriu');
    const src1 = await dialog.locator('img').getAttribute('src');
    await page.keyboard.press('ArrowRight');
    const src2 = await dialog.locator('img').getAttribute('src');
    assert.notStrictEqual(src1, src2, 'seta não trocou a foto');
    await page.keyboard.press('Escape');
    assert.ok(!(await dialog.isVisible()), 'Esc não fechou');
    const focused = await page.evaluate(() => document.activeElement.classList.contains('js-lightbox'));
    assert.ok(focused, 'foco não voltou ao link');
  },
  'menu do celular abre e fecha': async (browser) => {
    const page = await openPage(browser, { viewport: { width: 390, height: 844 } });
    assert.ok(!(await page.isVisible('#nav a[href="#servicos"]')));
    await page.click('#menuToggle');
    assert.strictEqual(await page.getAttribute('#menuToggle', 'aria-expanded'), 'true');
    assert.ok(await page.isVisible('#nav a[href="#servicos"]'));
    await page.click('#nav a[href="#servicos"]');
    assert.strictEqual(await page.getAttribute('#menuToggle', 'aria-expanded'), 'false');
  },
  'botão flutuante do WhatsApp só aparece depois da abertura': async (browser) => {
    const page = await openPage(browser);
    assert.strictEqual(await page.$eval('.whatsapp-float', (e) => getComputedStyle(e).opacity), '0');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(500);
    assert.strictEqual(await page.$eval('.whatsapp-float', (e) => getComputedStyle(e).opacity), '1');
  },
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(browser); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(failed ? `${failed} falha(s)` : 'interactions: todos passaram');
  process.exit(failed ? 1 : 0);
})();
