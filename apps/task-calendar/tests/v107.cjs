const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TASKARE_BROWSER });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route(/^https?:/, (r) => r.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    fs.mkdirSync('/tmp/taskare-v107', { recursive: true });
    await page.evaluate(() => {
      db.tasks = [{ id: 'fixture', title: '読書', date: todayKey(), time: '09:00', timeEnd: '09:30', minutes: 30 }];
      db.events = [{ id: 'fixture2', title: '打ち合わせ', date: todayKey(), time: '10:00', timeEnd: '11:00' }];
      db.calendars.push({ id: 'work', name: '仕事', color: 'blue' });
    });
    for (const palette of ['collage', 'gallery', 'aquarium', 'woodland', 'cosmos']) {
      for (const theme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: theme });
        await page.evaluate(({ palette }) => { db.settings.palette = palette; db.settings.theme = 'auto'; applyPalette(); applyTheme(); }, { palette });
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => getComputedStyle(document.body, '::before').opacity), theme === 'dark' ? '0.8' : '0.95');
        const imageURL = await page.evaluate(() => getComputedStyle(document.body, '::before').backgroundImage.slice(5, -2));
        assert.ok(await page.evaluate((url) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image.naturalWidth > 0); image.onerror = () => resolve(false); image.src = url; }), imageURL));
        for (const width of [390, 1440]) for (const view of ['day', 'month']) {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          await page.evaluate((view) => { ui.cursor = new Date(); ui.view = view; setScreen('cal'); }, view);
          await page.waitForTimeout(250);
          await page.evaluate(() => { updateCalStickH(); window.scrollTo(0, 0); });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          assert.ok(await page.locator('.app').evaluate((e) => getComputedStyle(e).backgroundColor.includes('0.16')));
          if (view === 'day') assert.notEqual(await page.locator('.tl-start').first().evaluate((e) => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
          await page.screenshot({ path: `/tmp/taskare-v107/${palette}-${theme}-${view}-${width}.png`, animations: 'disabled' });
        }
      }
    }
    await page.evaluate(() => { db.tasks = []; db.events = []; ui.view = 'day'; renderCal(); });
    await page.screenshot({ path: '/tmp/taskare-v107/empty.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: five material themes, OS light/dark, day/month mobile/desktop, readable time labels, image loading');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
