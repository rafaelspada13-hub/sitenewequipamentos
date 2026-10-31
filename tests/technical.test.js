// Seção técnica da bi-excêntrica: dados do boletim DT-VB150-001.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');
const PDF = 'docs/tecnico/DT-VB150-001-valvula-borboleta-bi-excentrica-classe-150.pdf';

const cells = (page, row) => page.$$eval(`#tabela-dimensional tbody tr:nth-child(${row}) > *`, (c) => c.map((x) => x.textContent.trim()));

const tests = {
  'tabela dimensional tem as 19 bitolas do boletim': async (page) => {
    assert.strictEqual(await page.locator('#tabela-dimensional tbody tr').count(), 19);
    const first = await cells(page, 1);
    assert.deepStrictEqual([first[0], first[1], first[first.length - 1]], ['2"', '50', 'F07']);
    const eighth = await cells(page, 6);
    assert.deepStrictEqual(eighth, ['8"', '200', '182', '64', '22', '270', '12,7', '102', '4', 'F10']);
    const last = await cells(page, 19);
    assert.deepStrictEqual([last[0], last[1], last[last.length - 1]], ['48"', '1200', 'F30']);
  },
  'tabela dimensional fica recolhida e abre pelo link': async (page) => {
    assert.ok(!(await page.isVisible('#tabela-dimensional')), 'tabela aparece sem ser pedida');
    await page.click('.dim-more summary');
    assert.ok(await page.isVisible('#tabela-dimensional'), 'tabela não abre');
  },
  'curva P×T tem as três séries de material': async (page) => {
    const series = await page.$$eval('#curva-pt [data-serie]', (s) => s.map((x) => x.getAttribute('data-serie')));
    assert.deepStrictEqual(series.sort(), ['CF8/CF3', 'CF8M', 'WCB']);
    assert.strictEqual(await page.locator('#tabela-pt tbody tr').count(), 6);
  },
  'boletim em PDF disponível para download': async (page) => {
    assert.ok(fs.existsSync(path.join(ROOT, PDF)));
    assert.strictEqual(await page.locator(`a[href="${PDF}"][download]`).count(), 1);
  },
  'tabela de aplicações mostra os três status': async (page) => {
    const text = await page.$eval('#aplicacoes', (e) => e.textContent);
    for (const s of ['Indicada', 'Com restrição', 'Não recomendada']) assert.ok(text.includes(s), s);
  },
  'seletor de bitola mostra as dimensões reais': async (page) => {
    await page.locator('#bitola').scrollIntoViewIfNeeded();
    await page.fill('#bitola', '5');
    await page.dispatchEvent('#bitola', 'input');
    assert.strictEqual(await page.textContent('#bx-bitola'), '8"');
    assert.strictEqual(await page.textContent('#bx-A'), '182');
    assert.strictEqual(await page.textContent('#bx-B'), '64');
    assert.strictEqual(await page.textContent('#bx-iso'), 'F10');
    await page.focus('#bitola');
    await page.keyboard.press('End');
    assert.strictEqual(await page.textContent('#bx-bitola'), '48"');
    assert.strictEqual(await page.textContent('#bx-D'), '1380');
  },
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(URL);
    try { await fn(page); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
    await page.close();
  }
  const phone = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await phone.goto(URL);
  try {
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= 360), 'página rola na horizontal');
    await phone.click('.dim-more summary');
    const [sw, cw] = await phone.$eval('#tabela-dimensional', (t) => [t.closest('.table-scroll').scrollWidth, t.closest('.table-scroll').clientWidth]);
    assert.ok(sw > cw, 'tabela não rola dentro do contêiner');
    console.log('ok   em 360px a tabela rola dentro do contêiner');
  } catch (e) { failed++; console.log('FAIL 360px -', e.message.split('\n')[0]); }
  await browser.close();
  console.log(failed ? `${failed} falha(s)` : 'technical: todos passaram');
  process.exit(failed ? 1 : 0);
})();
