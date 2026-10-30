// Verifica os assets gerados pela Task 1 (fotos otimizadas, logo, desenho).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SLUGS = [
  'borboleta-vermelha', 'usinagem', 'globo-controle',
  'gaveta-par', 'borboleta-grande-1', 'borboleta-grande-2', 'borboleta-grande-3',
  'borboletas-lote', 'estoque-mix', 'controle-azul', 'redutores',
  'gaveta-galpao', 'globo-volante', 'lote-gavetas', 'fachada',
];

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('FAIL', msg); } };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const dims = async (rel) => page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    return { w: img.naturalWidth, h: img.naturalHeight };
  }, 'data:image;base64,' + fs.readFileSync(path.join(ROOT, rel)).toString('base64'));

  for (const slug of SLUGS) {
    for (const ext of ['webp', 'jpg']) {
      const rel = `img/opt/${slug}.${ext}`;
      if (!fs.existsSync(path.join(ROOT, rel))) { check(false, `${rel} ausente`); continue; }
      const { w } = await dims(rel);
      check(w <= 1600, `${rel} largura ${w} > 1600`);
      if (ext === 'webp') {
        const kb = fs.statSync(path.join(ROOT, rel)).size / 1024;
        check(kb < 400, `${rel} tem ${kb.toFixed(0)} KB (>= 400)`);
      }
    }
  }

  for (const rel of ['img/logo.png', 'img/bi-excentrica-dimensional.png']) {
    check(fs.existsSync(path.join(ROOT, rel)), `${rel} ausente`);
  }
  if (fs.existsSync(path.join(ROOT, 'img/logo.png'))) {
    const corner = await page.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      return ctx.getImageData(1, 1, 1, 1).data[3];
    }, 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'img/logo.png')).toString('base64'));
    check(corner === 0, `logo.png canto não transparente (alfa ${corner})`);
  }

  await browser.close();
  console.log(failures ? `${failures} falha(s)` : 'assets: todos passaram');
  process.exit(failures ? 1 : 0);
})();
