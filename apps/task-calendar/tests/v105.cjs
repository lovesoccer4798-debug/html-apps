const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TASKARE_BROWSER });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await context.route(/^https?:/, (route) => route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    fs.mkdirSync('/tmp/taskare-v105', { recursive: true });
    await page.evaluate(() => { delete db.settings.hidden['nav:anniv']; setScreen('anniv'); openAnnivSheet(); });
    await page.locator('#a-title').fill('大切な日');
    for (let i = 0; i < 6; i++) {
      await page.locator('.reminder-choice').nth(i).tap();
      assert.equal(await page.locator('.reminder-choice input').nth(i).isChecked(), true);
    }
    assert.notEqual(await page.locator('.reminder-choice input').first().evaluate((e) => getComputedStyle(e).appearance), 'none');
    await page.screenshot({ path: '/tmp/taskare-v105/reminders.png' });
    await page.locator('#anniv-save').tap();
    assert.deepEqual(await page.evaluate(() => db.anniversaries[0].reminders), [7, 5, 3, 2, 1, 0]);
    await page.reload();
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    await page.evaluate(() => openAnnivSheet(db.anniversaries[0]));
    assert.equal(await page.locator('.reminder-choice input:checked').count(), 6);
    await page.locator('.reminder-choice').first().tap();
    await page.locator('#anniv-save').tap();
    assert.deepEqual(await page.evaluate(() => db.anniversaries[0].reminders), [5, 3, 2, 1, 0]);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const palette of ['collage', 'letterpress', 'gallery', 'aquarium', 'woodland', 'cosmos']) for (const theme of ['light', 'dark']) {
        await page.evaluate(({ palette, theme }) => {
          db.settings.palette = palette; db.settings.theme = theme; applyTheme(); applyPalette(); setScreen('settings');
          [...document.querySelectorAll('.acc')].find((e) => e.querySelector('.acc-title')?.textContent === 'デザイン').classList.add('is-open');
        }, { palette, theme });
        await page.waitForTimeout(220);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (width < 768) {
          const box = await page.locator('#scr-settings > .appbar').boundingBox();
          assert.equal(box.x, 0); assert.equal(box.width, width);
        }
        if (width !== 320) await page.screenshot({ path: `/tmp/taskare-v105/${palette}-${theme}-${width}.png`, animations: 'disabled' });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      db.settings.timerStyle = 'aquarium';
      db.tasks = [{ id: 'aquarium-test', title: '水中で読書', date: todayKey(), minutes: 10 }];
      startTimer(itemsFor(todayKey()).find((it) => it.ref.id === 'aquarium-test'));
    });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#focus').getAttribute('data-timer'), 'aquarium');
    await page.evaluate(() => { db.running.endAt -= 300000; pauseTimer(); updateTimerUI(); });
    assert.ok(await page.locator('.aq-fill').evaluate((e) => parseFloat(e.style.width)) >= 50);
    assert.equal(await page.locator('#focus').evaluate((e) => getComputedStyle(e, '::before').animationPlayState), 'paused');
    await page.screenshot({ path: '/tmp/taskare-v105/timer-390.png' });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.screenshot({ path: '/tmp/taskare-v105/timer-landscape.png' });
    await page.evaluate(() => { resumeTimer(); finishTimer(); });
    assert.equal(await page.evaluate(() => db.running.finished), true);
    await page.evaluate(() => completeRunning());
    assert.equal(await page.evaluate(() => db.tasks[0].done), true);
    assert.ok(await page.evaluate(() => !!db.tasks[0].time && !!db.tasks[0].timeEnd));
    for (const palette of ['aquarium', 'woodland', 'cosmos']) {
      for (const scheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.evaluate((palette) => { db.settings.palette = palette; db.settings.theme = 'auto'; applyPalette(); applyTheme(); ui.view = 'month'; setScreen('cal'); }, palette);
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--tc-bg').trim()), await page.evaluate((scheme) => getComputedStyle(document.documentElement).getPropertyValue('--palette-bg-' + scheme).trim(), scheme));
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          await page.waitForTimeout(250);
          await page.screenshot({ path: `/tmp/taskare-v105/calendar-${palette}-${scheme}-${width}.png`, animations: 'disabled' });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: reminder taps/persistence, full-width headers, 36 mode/viewports, aquarium timer');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
