// Abertura parada: a bi-excêntrica NEW no palco de estúdio, título e dois botões.
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const VIEW = { width: 1366, height: 768 };

const tests = {
  'abertura tem a foto no palco, o título e os dois botões': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    assert.strictEqual((await page.textContent('#inicio h1')).trim(), 'Válvulas industriais');
    assert.ok(await page.isVisible('#inicio a.btn[href="#contato"]'));
    assert.ok(await page.isVisible('#inicio a[href^="https://wa.me/5516997223976"]'));
    const src = await page.getAttribute('#inicio .hero-palco img', 'src');
    assert.ok(src && src.includes('palco-estatico'), `foto do palco ausente (${src})`);
    assert.ok(await page.isVisible('#inicio .hero-palco img'));
  },
  'sem animação de rolagem: nada de canvas, vapor ou disco separado': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    for (const sel of ['#inicio canvas', '#valvula-disco', '.hero-flash', '.hero-hint', 'script[src*="vapor.js"]']) {
      assert.strictEqual(await page.locator(sel).count(), 0, `${sel} deveria ter saído`);
    }
  },
  'a abertura ocupa uma tela e a rolagem segue direto para o site': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    const h = await page.$eval('#inicio', (s) => s.offsetHeight);
    assert.ok(h <= VIEW.height * 1.05, `abertura ocupa ${h}px`);
  },
  'no celular a válvula aparece inteira, sem rolagem horizontal': async (browser) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(URL);
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'página rola na horizontal');
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
