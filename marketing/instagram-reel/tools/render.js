// Renders reel.html frame by frame. Usage: node render.js [start] [end] [outDir] [step]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [a = 0, b = 960, out = 'frames', step = 1] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => window.ready);
  if (+a === 0) fs.writeFileSync('sfx.json', JSON.stringify(await page.evaluate(() => ({ meta: window.META, sfx: window.SFX })), null, 1));
  const cdp = await page.context().newCDPSession(page);
  const t0 = Date.now();
  for (let f = +a; f < +b; f += +step) {
    await page.evaluate((t) => window.renderFrame(t), f / 30);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94 });
    fs.writeFileSync(path.join(out, String(f).padStart(4, '0') + '.jpg'), Buffer.from(data, 'base64'));
  }
  console.log(`frames ${a}-${b} step ${step}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await browser.close();
})();
