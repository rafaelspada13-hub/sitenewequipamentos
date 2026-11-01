// Achados da auditoria do impeccable: contraste, imagens, vazios, tipografia e tamanho.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');

const lum = (c) => { const v = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };

async function percorrer(page) {
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  for (let y = 0; y < 30000; y += 450) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
  await page.waitForTimeout(1500);
}

const tests = {
  'status das tabelas técnicas passam no contraste AA (4,5:1)': async (b) => {
    const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(URL);
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    const pares = await page.$$eval('.st', (els) => els.map((e) => {
      let n = e, bg; while (n) { bg = getComputedStyle(n).backgroundColor; if (!/, 0\)$/.test(bg) && bg !== 'transparent') break; n = n.parentElement; }
      return [getComputedStyle(e).color, bg, e.textContent.trim()];
    }));
    for (const [c, bg, t] of pares) {
      const L1 = lum(c), L2 = lum(bg); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      assert.ok(cr >= 4.5, `"${t}" com contraste ${cr.toFixed(2)}`);
    }
  },
  'cores escritas direto no CSS só dentro das variáveis': async () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
    const corpo = css.slice(css.indexOf('}') + 1).replace(/\/\*[\s\S]*?\*\//g, '');
    const cores = corpo.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    assert.ok(cores.length <= 2, `${cores.length} cores fixas fora de :root: ${[...new Set(cores)].join(' ')}`);
  },
  'imagens não carregam mais que 2,2 vezes o tamanho em que aparecem': async (b) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844, deviceScaleFactor: 2 }]) {
      const page = await b.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1 });
      await page.goto(URL); await percorrer(page);
      const grandes = await page.$$eval('img', (imgs) => imgs.filter((i) => { const w = i.getBoundingClientRect().width * devicePixelRatio; return w > 20 && i.naturalWidth > w * 2.2; }).map((i) => i.currentSrc.split('/').slice(-1)[0] + ' ' + i.naturalWidth + '/' + Math.round(i.getBoundingClientRect().width * devicePixelRatio)));
      assert.deepStrictEqual(grandes, [], `${vp.width}px: ${grandes.join(', ')}`);
      await page.close();
    }
  },
  'galeria aparece inteira ao rolar (sem vazio)': async (b) => {
    const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(URL);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    const topo = await page.$eval('.gallery-grid', (g) => g.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo(0, y - 300), topo);
    await page.waitForTimeout(1300);
    const ops = await page.$$eval('.gallery-grid > *', (els) => els.filter((e) => e.getBoundingClientRect().top < innerHeight).map((e) => +getComputedStyle(e).opacity));
    assert.ok(ops.length && ops.every((o) => o > 0.95), `itens da galeria ainda apagados: ${ops}`);
  },
  'no máximo 7 tamanhos de letra no computador': async (b) => {
    const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(URL);
    const tamanhos = await page.evaluate(() => { const s = new Set(); document.querySelectorAll('body *').forEach((e) => { if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().width) s.add(Math.round(parseFloat(getComputedStyle(e).fontSize))); }); return [...s].sort((a, c) => a - c); });
    assert.ok(tamanhos.length <= 7, `${tamanhos.length} tamanhos: ${tamanhos.join(' ')}`);
  },
  'site com no máximo 13 telas no computador e 17 no celular': async (b) => {
    for (const [w, h, max] of [[1440, 900, 13], [390, 844, 17]]) {
      const page = await b.newPage({ viewport: { width: w, height: h } });
      await page.goto(URL);
      const telas = await page.evaluate(() => document.body.scrollHeight / innerHeight);
      assert.ok(telas <= max, `${w}px: ${telas.toFixed(1)} telas`);
      await page.close();
    }
  },
  'sem bloco de "número grande + rótulo" nem setas/+ feitos de caractere': async (b) => {
    const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(URL);
    assert.strictEqual(await page.locator('.stats, .stat-num').count(), 0, 'bloco de métricas ainda presente');
    const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
    assert.ok(!/content:\s*"(→|\+|−| ↓)"/.test(css), 'ícone feito com caractere no CSS');
  },
};

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(browser); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(failed ? `${failed} falha(s)` : 'auditoria: todos passaram');
  process.exit(failed ? 1 : 0);
})();
