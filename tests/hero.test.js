// Abertura: a válvula borboleta que abre conforme a página rola.
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const VIEW = { width: 1366, height: 768 };

// Escala horizontal do disco (1 = fechado de frente, ~0 = aberto de lado).
const discScale = (page) => page.$eval('#valvula-disco', (d) => {
  const m = new DOMMatrixReadOnly(getComputedStyle(d).transform);
  return Math.abs(m.a);
});
const counter = (page) => page.textContent('#valvula-abertura');

async function scrollHeroTo(page, fraction) {
  await page.evaluate((f) => {
    const pin = document.querySelector('.hero-pin');
    const run = pin.offsetHeight - window.innerHeight;
    window.scrollTo({ top: pin.offsetTop + run * f, behavior: 'instant' });
  }, fraction);
  await page.waitForTimeout(250);
}

const tests = {
  'abertura tem a válvula desenhada, o título e o pedido de orçamento': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    assert.strictEqual(await page.locator('#inicio svg#valvula #valvula-disco').count(), 1);
    assert.strictEqual((await page.textContent('#inicio h1')).trim(), 'Válvulas industriais');
    assert.ok(await page.isVisible('#inicio a.btn[href="#contato"]'));
    assert.strictEqual(await page.locator('.hero-line, .hero-track').count(), 0, 'letreiro antigo ainda presente');
  },
  'no topo a válvula está fechada': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    await page.waitForTimeout(200);
    assert.ok((await discScale(page)) > 0.95, 'disco deveria estar de frente');
    assert.strictEqual((await counter(page)).trim(), '0%');
  },
  'na metade da rolagem a válvula está entreaberta': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    await scrollHeroTo(page, 0.5);
    const pct = parseInt(await counter(page), 10);
    assert.ok(pct > 25 && pct < 90, `abertura ${pct}%`);
    const s = await discScale(page);
    assert.ok(s > 0.1 && s < 0.95, `escala ${s}`);
  },
  'ao fim da rolagem a válvula está toda aberta': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    await scrollHeroTo(page, 1);
    assert.strictEqual((await counter(page)).trim(), '100%');
    assert.ok((await discScale(page)) < 0.1, 'disco deveria estar de lado');
  },
  'com animações reduzidas a válvula já aparece aberta e sem rolagem extra': async (browser) => {
    const ctx = await browser.newContext({ viewport: VIEW, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL);
    await page.waitForTimeout(200);
    assert.ok((await discScale(page)) < 0.1);
    assert.strictEqual((await counter(page)).trim(), '100%');
    const h = await page.$eval('.hero-pin', (p) => p.offsetHeight);
    assert.ok(h <= VIEW.height * 1.25, `abertura ocupa ${h}px`);
    await ctx.close();
  },
  'sem JavaScript a válvula aparece aberta e sem rolagem extra': async (browser) => {
    const ctx = await browser.newContext({ viewport: VIEW, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(URL);
    assert.ok((await discScale(page)) < 0.1);
    const h = await page.$eval('.hero-pin', (p) => p.offsetHeight);
    assert.ok(h <= VIEW.height * 1.25, `abertura ocupa ${h}px`);
    await ctx.close();
  },
  'no celular a abertura cabe sem rolagem horizontal': async (browser) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(URL);
    const box = await page.$eval('#valvula', (s) => s.getBoundingClientRect().right);
    assert.ok(box <= 390, `válvula passa da tela (${box})`);
    assert.ok(await page.isVisible('#inicio h1'));
  },
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(browser); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(failed ? `${failed} falha(s)` : 'hero: todos passaram');
  process.exit(failed ? 1 : 0);
})();
