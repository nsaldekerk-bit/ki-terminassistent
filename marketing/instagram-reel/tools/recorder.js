const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3100';
const VIEW = { width: 390, height: 844 };
const DPR = 1080 / 390;
const FPS = 30;
const vtimeSrc = fs.readFileSync(path.join(__dirname, 'vtime.js'), 'utf8');

const DEVICES = {
  mobile: { viewport: VIEW, deviceScaleFactor: DPR, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, isMobile: false, hasTouch: false },
};

async function newPage(browser, device = 'mobile') {
  const ctx = await browser.newContext({
    ...DEVICES[device],
    locale: 'de-DE', timezoneId: 'Europe/Berlin', reducedMotion: 'no-preference',
  });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('wd-consent-v1', JSON.stringify({ statistics: false, ts: Date.now(), v: 1 })); } catch (e) {}
  });
  await ctx.addInitScript({ content: vtimeSrc });
  // Lenis smooth-scroll would fight the scripted camera scroll; the site
  // switches it off for reduced-motion users, so tell only its JS check that.
  await ctx.addInitScript(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = (q) => (/prefers-reduced-motion:\s*reduce/.test(q) ? { matches: true, media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } } : mm(q));
  });
  await ctx.route('**/api/contact', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await ctx.route(/_vercel|vitals|analytics/, (r) => r.abort());
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const d = DEVICES[device];
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: d.viewport.width, height: d.viewport.height, deviceScaleFactor: d.deviceScaleFactor, mobile: d.isMobile });
  return { ctx, page, cdp };
}

/**
 * clip = { name, path, frames, prepare(page), actions: {frameIndex: async (page, api)=>{}}, perFrame(page, i) }
 */
async function recordClip(browser, clip, outRoot) {
  const { ctx, page, cdp } = await newPage(browser, clip.device || 'mobile');
  const dir = path.join(outRoot, clip.name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await page.goto(BASE + clip.path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  if (clip.prepare) await clip.prepare(page);
  await page.evaluate(() => window.__stopLive());
  if (clip.restartAnims) await page.evaluate(() => window.__restartAnims());
  const log = { taps: [], fps: FPS, frames: clip.frames, view: DEVICES[clip.device || 'mobile'].viewport };
  const api = {
    tap: async (x, y, i) => { log.taps.push({ f: i, x, y }); await page.touchscreen.tap(x, y); await page.waitForTimeout(40); },
    mouseClick: async (sel, i) => {
      const box = await page.locator(sel).first().boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      log.taps.push({ f: i, x, y }); await page.mouse.click(x, y); await page.waitForTimeout(40);
    },
    tapSel: async (sel, i) => {
      const box = await page.locator(sel).first().boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      log.taps.push({ f: i, x, y }); await page.touchscreen.tap(x, y); await page.waitForTimeout(40);
    },
  };
  const t0 = Date.now();
  for (let i = 0; i < clip.frames; i++) {
    if (clip.actions && clip.actions[i]) await clip.actions[i](page, api, i);
    if (clip.perFrame) await clip.perFrame(page, i);
    const [sx, sy] = await page.evaluate((ms) => { window.__advance(ms); return [scrollX, scrollY]; }, 1000 / FPS);
    await page.waitForTimeout(clip.settle ?? 5);
    const dev = DEVICES[clip.device || 'mobile'];
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93 });
    fs.writeFileSync(path.join(dir, String(i).padStart(4, '0') + '.jpg'), Buffer.from(data, 'base64'));
  }
  fs.writeFileSync(path.join(dir, 'log.json'), JSON.stringify(log, null, 1));
  console.log(`${clip.name}: ${clip.frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await ctx.close();
}

module.exports = { recordClip, newPage, BASE, VIEW, DPR, FPS };
