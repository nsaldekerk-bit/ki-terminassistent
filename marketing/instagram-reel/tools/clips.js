const { chromium } = require('playwright');
const { recordClip } = require('./recorder');

const smooth = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Scroll from a→b between frames f0..f1 with easing. */
const scrollPath = (a, b, f0, f1, ease = easeInOut) => async (page, i) => {
  const k = Math.max(0, Math.min(1, (i - f0) / (f1 - f0)));
  await page.evaluate((y) => window.scrollTo(0, y), a + (b - a) * ease(k));
};
const at = (y) => async (page) => { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(900); };
const findY = async (page, text) => page.evaluate((t) => {
  const e = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.trim().startsWith(t));
  return e ? e.getBoundingClientRect().top + scrollY : 0;
}, text);

const typeText = (sel, text, start) => {
  const acts = {};
  acts[start] = async (page, api, i) => { await api.tapSel(sel, i); };
  [...text].forEach((ch, k) => { acts[start + 2 + k] = async (page) => { await page.keyboard.type(ch); }; });
  return acts;
};

const booking = {
  name: 'm_booking', path: '/', frames: 330, settle: 25,
  prepare: at(0),
  actions: {
    12: async (page, api, i) => api.tapSel('button.booking-launcher', i),
    52: async (page, api, i) => api.tapSel('button:has-text("Allgemeines Erstgespräch")', i),
    92: async (page, api, i) => {
      // second offered day
      const chips = page.locator('div.flex.flex-wrap.gap-2 > button');
      const box = await chips.nth(1).boundingBox();
      await api.tap(box.x + box.width / 2, box.y + box.height / 2, i);
    },
    128: async (page, api, i) => api.tapSel('button:has-text("10:00")', i),
    ...typeText('input[name=name]', 'Max Mustermann', 160),
    ...typeText('input[name=email]', 'max@beispiel.de', 182),
    ...typeText('input[name=phone]', '0170 1234567', 205),
    226: async (page, api, i) => api.tapSel('form button[type=submit]', i),
    262: async (page, api, i) => api.tapSel('button:has-text("Termin verbindlich anfragen")', i),
  },
};

const clips = [
  { name: 'm_hero', path: '/', frames: 50, restartAnims: true, prepare: at(0) },
  { name: 'm_system', path: '/', frames: 60, prepare: at(470), perFrame: scrollPath(470, 1060, 0, 59) },
  { name: 'm_24h', path: '/', frames: 55, prepare: at(4330), perFrame: scrollPath(4330, 4830, 0, 54) },
  { name: 'm_team', path: '/', frames: 55, prepare: at(8120), perFrame: scrollPath(8120, 8760, 0, 54) },
  { name: 'm_leist', path: '/leistungen', frames: 60, prepare: at(450), perFrame: scrollPath(450, 1380, 0, 59) },
  { name: 'm_auto', path: '/leistungen', frames: 60, prepare: at(2250), perFrame: scrollPath(2250, 2980, 0, 59) },
  { name: 'm_check', path: '/website-check', frames: 60, restartAnims: true, prepare: at(0), perFrame: scrollPath(0, 620, 18, 59) },
  { name: 'd_hero', device: 'desktop', path: '/', frames: 50, restartAnims: true, prepare: at(0) },
  { name: 'd_leist', device: 'desktop', path: '/leistungen', frames: 50, restartAnims: true, prepare: at(0), perFrame: scrollPath(0, 520, 12, 49) },
  { name: 'd_24h', device: 'desktop', path: '/', frames: 50,
    prepare: async (page) => { const y = await findY(page, 'Bringt Ihre Website'); page.__y = y; await at(y - 330)(page); },
    perFrame: async (page, i) => { const y = page.__y; await scrollPath(y - 330, y - 170, 0, 49)(page, i); } },
  booking,
  // calmer takes for the second cut: ~2.6 s each, gentle scroll
  { name: 'c_hero', path: '/', frames: 80, restartAnims: true, prepare: at(0) },
  { name: 'c_dhero', device: 'desktop', path: '/', frames: 80, restartAnims: true, prepare: at(0), perFrame: scrollPath(0, 90, 30, 79) },
  { name: 'c_leist', path: '/leistungen', frames: 80, prepare: at(430), perFrame: scrollPath(430, 900, 0, 79) },
  { name: 'c_auto', path: '/leistungen', frames: 80, prepare: at(2230), perFrame: scrollPath(2230, 2700, 0, 79) },
  { name: 'c_check', path: '/website-check', frames: 80, restartAnims: true, prepare: at(0), perFrame: scrollPath(0, 440, 12, 79) },
  { name: 'c_team', path: '/', frames: 80, prepare: at(8120), perFrame: scrollPath(8120, 8470, 0, 79) },
];

(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch();
  for (const c of clips) if (!only.length || only.includes(c.name)) await recordClip(b, c, 'clips');
  await b.close();
})();
