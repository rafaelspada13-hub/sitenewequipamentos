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
    assert.strictEqual((await page.textContent('#inicio h1')).trim(), 'Fabricamos e recuperamos válvulas industriais');
    assert.ok(await page.isVisible('#inicio a.btn[href="#contato"]'));
    assert.ok(await page.isVisible('#inicio a[href^="https://wa.me/5516997223976"]'));
    const src = await page.getAttribute('#inicio .hero-palco img', 'src');
    assert.ok(src && src.includes('palco-estatico'), `foto do palco ausente (${src})`);
    assert.ok(await page.isVisible('#inicio .hero-palco img'));
  },
  'etiquetas técnicas apontam as peças e terminam visíveis': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.goto(URL);
    assert.strictEqual(await page.locator('.anot-rotulo').count(), 5);
    await page.waitForTimeout(4500);
    const ops = await page.$$eval('.anot-rotulo > *', (els) => els.map((e) => getComputedStyle(e).opacity));
    assert.ok(ops.every((o) => o === '1'), `etiquetas invisíveis: ${ops}`);
    const fora = await page.$$eval('.anot-rotulo', (els) => els.filter((e) => e.getBoundingClientRect().right > innerWidth).length);
    assert.strictEqual(fora, 0, 'etiqueta fora da tela');
  },
  'se a biblioteca de movimento falhar, tudo fica visível': async (browser) => {
    const page = await browser.newPage({ viewport: VIEW });
    await page.route((u) => u.pathname.includes('motion-14'), (r) => r.abort());
    await page.goto(URL);
    await page.waitForTimeout(3500);
    assert.ok(!(await page.evaluate(() => document.documentElement.classList.contains('motion-on'))));
    await page.waitForTimeout(1200); // entradas do sistema simples terminam a transição
    const ops = await page.$$eval('.anot-rotulo > *, .reveal', (els) => els.map((e) => getComputedStyle(e).opacity));
    assert.ok(ops.every((o) => parseFloat(o) > 0.25), 'conteúdo escondido sem a biblioteca');
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
