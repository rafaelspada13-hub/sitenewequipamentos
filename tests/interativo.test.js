// Peças interativas: simulador, configurador, linha de válvulas, mapa e números.
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const VIEW = { width: 1366, height: 768 };

async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: VIEW, ...opts });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto(URL);
  page.ctx = ctx;
  return page;
}
const setRange = (page, sel, v) => page.$eval(sel, (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const waitForm = (page) => page.waitForFunction(() => { const t = document.getElementById('orcamentoForm').getBoundingClientRect().top; return t >= 0 && t < innerHeight; }, null, { timeout: 6000 }).catch(() => {});

const tests = {
  'simulador começa com vapor saturado indicado': async (b) => {
    const page = await open(b);
    assert.strictEqual(await page.$eval('input[name="fluido"]:checked', (i) => i.value), 'vapor');
    assert.strictEqual((await page.textContent('#sim-status')).trim(), 'Indicada');
  },
  'simulador reage à temperatura e ao fluido': async (b) => {
    const page = await open(b);
    await setRange(page, '#sim-temp', 270);
    assert.strictEqual((await page.textContent('#sim-status')).trim(), 'Não recomendada');
    assert.ok((await page.textContent('#sim-motivos')).includes('250'));
    await setRange(page, '#sim-temp', 200);
    await page.check('input[name="fluido"][value="oleo"]', { force: true });
    assert.strictEqual((await page.textContent('#sim-status')).trim(), 'Com restrição');
  },
  'ponto se move sobre a curva P×T': async (b) => {
    const page = await open(b);
    const x1 = Number(await page.getAttribute('#sim-ponto', 'cx'));
    await setRange(page, '#sim-temp', 240);
    const x2 = Number(await page.getAttribute('#sim-ponto', 'cx'));
    assert.ok(x2 > x1, `ponto não andou (${x1} → ${x2})`);
  },
  '"Orçar esta aplicação" preenche o formulário': async (b) => {
    const page = await open(b);
    await page.click('#sim-orcar');
    await waitForm(page);
    assert.strictEqual(await page.$eval('#produto', (s) => s.value), 'Válvula Borboleta Bi-excêntrica Classe 150');
    const msg = await page.$eval('#mensagem', (t) => t.value);
    assert.ok(msg.includes('Vapor saturado') && msg.includes('°C') && msg.includes('kgf/cm²'), msg);
  },
  'configurador troca as bitolas conforme o tipo': async (b) => {
    const page = await open(b);
    await page.check('input[name="cfg-tipo"][value="guilhotina"]', { force: true });
    const ops = await page.$$eval('#cfg-bitola option', (o) => o.map((x) => x.textContent));
    assert.strictEqual(ops[ops.length - 1], '30"');
    await page.check('input[name="cfg-tipo"][value="gaveta"]', { force: true });
    assert.ok(await page.isVisible('#cfg-bitola-livre'), 'gaveta deveria pedir a bitola por escrito');
    assert.ok(!(await page.isVisible('#cfg-bitola')));
  },
  'configurador monta o resumo e o pedido': async (b) => {
    const page = await open(b);
    await page.check('input[name="cfg-tipo"][value="bi"]', { force: true });
    await page.selectOption('#cfg-bitola', '8"');
    await page.check('input[name="cfg-material"][value="CF8M"]', { force: true });
    const resumo = await page.textContent('#cfg-resumo');
    assert.ok(resumo.includes('8"') && resumo.includes('CF8M'), resumo);
    await page.click('#cfg-orcar');
    await waitForm(page);
    assert.strictEqual(await page.$eval('#produto', (s) => s.value), 'Válvula Borboleta Bi-excêntrica Classe 150');
    assert.ok((await page.$eval('#mensagem', (t) => t.value)).includes('CF8M'));
  },
  'linha de válvulas desliza na horizontal com a rolagem': async (b) => {
    const page = await open(b);
    assert.ok(await page.locator('#linha .rail-card').count() >= 7);
    const tx = () => page.$eval('#linha .rail-track', (t) => new DOMMatrixReadOnly(getComputedStyle(t).transform).m41);
    await page.evaluate(() => { const s = document.getElementById('linha'); scrollTo({ top: s.offsetTop, behavior: 'instant' }); });
    await page.waitForTimeout(300);
    const a = await tx();
    await page.evaluate(() => { const s = document.getElementById('linha'); scrollTo({ top: s.offsetTop + s.offsetHeight * 0.6, behavior: 'instant' }); });
    await page.waitForTimeout(300);
    const c = await tx();
    assert.ok(c < a - 100, `trilho não deslizou (${a} → ${c})`);
  },
  'cartão da linha abre a ficha no catálogo': async (b) => {
    const page = await open(b);
    await page.locator('#linha .rail-card a[href="#item-guilhotina"]').evaluate((a) => a.click());
    await page.waitForTimeout(400);
    assert.ok(await page.$eval('#item-guilhotina', (d) => d.open));
  },
  'com animações reduzidas a linha vira rolagem lateral comum': async (b) => {
    const page = await open(b, { reducedMotion: 'reduce' });
    const h = await page.$eval('#linha', (s) => s.offsetHeight);
    assert.ok(h < VIEW.height * 1.6, `seção fixada mesmo com animações reduzidas (${h}px)`);
    assert.strictEqual(await page.$eval('#linha .rail-viewport', (v) => getComputedStyle(v).overflowX), 'auto');
    await page.ctx.close();
  },
  'mapa de logística mostra as regiões e detalha ao tocar': async (b) => {
    const page = await open(b);
    assert.ok(await page.locator('#logistica .map-place').count() >= 6);
    await page.locator('#logistica button[data-lugar="rio-preto"]').click();
    assert.ok((await page.textContent('#mapa-info')).includes('São José do Rio Preto'));
  },
  'números contam até o valor real': async (b) => {
    const page = await open(b);
    await page.locator('.stats').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2200);
    const vals = await page.$$eval('.stat-num', (s) => s.map((x) => x.textContent.trim()));
    assert.deepStrictEqual(vals, ['24', '72"', '1.500#']);
  },
  'sem JavaScript os números e as peças aparecem prontos': async (b) => {
    const page = await open(b, { javaScriptEnabled: false });
    const vals = await page.$$eval('.stat-num', (s) => s.map((x) => x.textContent.trim()));
    assert.deepStrictEqual(vals, ['24', '72"', '1.500#']);
    assert.ok(await page.isVisible('#simulador .sim-fallback'));
    assert.strictEqual(await page.$eval('#linha .rail-viewport', (v) => getComputedStyle(v).overflowX), 'auto');
    await page.ctx.close();
  },
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(browser); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(failed ? `${failed} falha(s)` : 'interativo: todos passaram');
  process.exit(failed ? 1 : 0);
})();
