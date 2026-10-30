// Sem rolagem horizontal da página em larguras de celular a desktop.
const path = require('path');
const { chromium } = require('playwright');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(URL);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > width) { failures++; console.log(`FAIL ${width}px: scrollWidth ${sw}`); }
    await page.close();
  }
  await browser.close();
  console.log(failures ? `${failures} falha(s)` : 'layout: sem rolagem horizontal');
  process.exit(failures ? 1 : 0);
})();
