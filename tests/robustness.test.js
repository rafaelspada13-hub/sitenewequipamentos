// Achados da revisão final: falhas de script, foco, pausa de movimento, dados e fotos.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');

async function openPage(browser, { block, viewport } = {}) {
  const page = await browser.newPage({ viewport: viewport || { width: 1440, height: 900 } });
  await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  if (block) await page.route((u) => u.pathname.endsWith('/' + block), (route) => route.abort());
  await page.goto(URL);
  return page;
}

const tests = {
  'se main.js falhar o conteúdo volta a ficar visível': async (browser) => {
    const page = await openPage(browser, { block: 'js/main.js' });
    await page.waitForTimeout(3500);
    const faded = await page.$$eval('.reveal', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    assert.strictEqual(faded, 0, `${faded} elementos apagados`);
  },
  'se whatsapp.js falhar o formulário ainda abre o WhatsApp': async (browser) => {
    const page = await openPage(browser, { block: 'js/whatsapp.js' });
    await page.fill('#nome', 'Ana');
    await page.fill('#email', 'ana@usina.com.br');
    await page.fill('#mensagem', 'Orçamento');
    await page.locator('#orcamentoForm button[type=submit]').click();
    const opened = await page.evaluate(() => window.__opened);
    assert.strictEqual(opened.length, 1);
    assert.ok(opened[0].startsWith('https://wa.me/5516997223976'));
  },
  'foco no menu traz o cabeçalho escondido de volta': async (browser) => {
    const page = await openPage(browser);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 3400));
    await page.waitForTimeout(600);
    await page.focus('#nav a[href="#servicos"]');
    await page.waitForTimeout(500);
    const top = await page.$eval('#nav a[href="#servicos"]', (a) => a.getBoundingClientRect().top);
    assert.ok(top >= 0, `link focado fora da tela (top ${top})`);
  },
  'contorno de foco usa o verde escuro nas seções claras': async (browser) => {
    const page = await openPage(browser);
    await page.focus('#bitola');
    await page.keyboard.press('ArrowRight');
    const color = await page.$eval('#bitola', (e) => getComputedStyle(e).outlineColor);
    assert.strictEqual(color, 'rgb(0, 74, 44)');
  },
  'movimento pode ser pausado e o vídeo tem controles': async (browser) => {
    const page = await openPage(browser);
    await page.click('#motionToggle');
    const states = await page.$$eval('.hero-track, .segments-track', (t) => t.map((x) => getComputedStyle(x).animationPlayState));
    assert.ok(states.every((s) => s === 'paused'), states.join());
    assert.strictEqual(await page.getAttribute('#motionToggle', 'aria-pressed'), 'true');
    assert.ok(await page.$eval('.frame--video video', (v) => v.controls));
  },
  'sede descrita como RPTFE (PTFE reforçado com fibra de vidro)': async (browser) => {
    const page = await openPage(browser);
    const text = await page.$eval('#bi-excentrica', (e) => e.textContent);
    assert.ok(text.includes('RPTFE (PTFE reforçado com fibra de vidro)'));
    assert.ok(!text.includes('RPTFE, PTFE reforçado'));
  },
  'nenhuma foto aparece duas vezes na página': async (browser) => {
    const page = await openPage(browser);
    const srcs = await page.$$eval('main img', (imgs) => imgs.map((i) => i.getAttribute('src')));
    const hashes = srcs.map((s) => crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, s))).digest('hex'));
    const dup = srcs.filter((s, i) => hashes.indexOf(hashes[i]) !== i);
    assert.deepStrictEqual(dup, []);
  },
  'e-mail inválido recebe mensagem que cita o e-mail': async (browser) => {
    const page = await openPage(browser);
    await page.fill('#nome', 'Ana');
    await page.fill('#email', 'x@');
    await page.fill('#mensagem', 'Orçamento');
    await page.locator('#orcamentoForm button[type=submit]').click();
    await page.waitForFunction(() => document.getElementById('formError').textContent.includes('e-mail válido'), null, { timeout: 2000 });
    assert.strictEqual(await page.getAttribute('#email', 'aria-describedby'), 'formError');
  },
  'linha da galeria é uma região nomeada': async (browser) => {
    const page = await openPage(browser);
    assert.strictEqual(await page.getAttribute('.gallery-row', 'role'), 'region');
  },
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(browser); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(failed ? `${failed} falha(s)` : 'robustness: todos passaram');
  process.exit(failed ? 1 : 0);
})();
