const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TASKARE_BROWSER });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await context.route(/^https?:/, (r) => r.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    fs.mkdirSync('/tmp/taskare-v106', { recursive: true });
    await page.evaluate(() => { setScreen('anniv'); openAnnivSheet(); });
    await page.locator('#a-title').fill('感謝を伝える日');
    const memo = '電話でありがとうを伝える\n<img src=x onerror=alert(1)>';
    await page.locator('#a-memo').fill(memo);
    await page.locator('#anniv-save').click();
    assert.equal(await page.locator('.anniv-memo').textContent(), memo);
    assert.equal(await page.locator('.anniv-memo img').count(), 0);
    await page.reload();
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    await page.evaluate(() => { setScreen('anniv'); openAnnivSheet(db.anniversaries[0]); });
    assert.equal(await page.locator('#a-memo').inputValue(), memo);
    await page.locator('#a-memo').fill('手紙を渡したい');
    await page.locator('#anniv-save').click();
    assert.equal(await page.evaluate(() => db.anniversaries[0].memo), '手紙を渡したい');
    await page.evaluate(() => openAnnivSheet({ title: '旧記念日', date: todayKey(), repeat: 'yearly' }));
    assert.equal(await page.locator('#a-memo').inputValue(), '');
    await page.locator('#anniv-close').click();
    await page.evaluate(() => { ui.view = 'day'; setScreen('cal'); document.activeElement.blur(); });
    const swipe = async (kind) => page.evaluate((kind) => {
      const body = document.querySelector('#cal-body');
      const before = toKey(ui.cursor);
      const field = document.createElement('textarea');
      field.value = '文字を選択して編集'; body.append(field);
      const text = document.createElement('p'); text.textContent = '選択している文章'; body.append(text);
      if (kind === 'focus') field.focus();
      if (kind === 'selection') { const range = document.createRange(); range.selectNodeContents(text); getSelection().removeAllRanges(); getSelection().addRange(range); }
      const target = kind === 'input' ? field : body;
      const emit = (type, x, count = 1) => {
        const touches = Array.from({ length: count }, (_, identifier) => new Touch({ identifier, target, clientX: x, clientY: 400 }));
        target.dispatchEvent(new TouchEvent(type, { bubbles: true, touches: type === 'touchend' ? [] : touches, changedTouches: touches }));
      };
      emit('touchstart', 250, kind === 'multi' ? 2 : 1); emit('touchmove', 80); emit('touchend', 80);
      const after = toKey(ui.cursor);
      getSelection().removeAllRanges(); field.blur(); field.remove(); text.remove();
      return { before, after };
    }, kind);
    for (const kind of ['input', 'focus', 'selection', 'multi']) {
      const result = await swipe(kind); assert.equal(result.after, result.before, kind);
    }
    const normal = await swipe('normal'); assert.notEqual(normal.after, normal.before);
    for (const style of ['cosmos', 'woodland']) {
      await page.evaluate((style) => {
        db.settings.timerStyle = style;
        db.tasks = [{ id: 'scene-test', title: '静かな時間', date: todayKey(), minutes: 10 }];
        startTimer(itemsFor(todayKey()).find((it) => it.ref.id === 'scene-test'));
      }, style);
      assert.equal(await page.locator('#focus').getAttribute('data-timer'), style);
      const src = await page.locator('#focus').evaluate((e) => getComputedStyle(e, '::before').backgroundImage);
      assert.ok(src.includes(style + '.png'));
      await page.evaluate(() => { db.running.endAt -= 300000; pauseTimer(); updateTimerUI(); });
      assert.ok(await page.locator('.aq-fill').evaluate((e) => parseFloat(e.style.width)) >= 50);
      for (const [width, height] of [[390, 844], [844, 390], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        await page.screenshot({ path: `/tmp/taskare-v106/timer-${style}-${width}.png` });
      }
      await page.evaluate(() => { resumeTimer(); finishTimer(); completeRunning(); });
      assert.ok(await page.evaluate(() => db.tasks[0].done && db.tasks[0].time && db.tasks[0].timeEnd));
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const palette of ['collage', 'letterpress', 'gallery', 'cosmos', 'woodland', 'aquarium']) for (const theme of ['light', 'dark']) {
        await page.evaluate(({ palette, theme }) => {
          db.calendars = [{ id: 'c-default', name: 'マイカレンダー', color: 'green' }, { id: 'work', name: '仕事', color: 'blue' }];
          db.settings.palette = palette; db.settings.theme = theme; applyPalette(); applyTheme(); ui.view = 'month'; setScreen('cal');
        }, { palette, theme });
        await page.waitForTimeout(250);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), JSON.stringify({ width, palette, theme, overflow: await page.evaluate(() => [...document.querySelectorAll('#scr-cal *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map((e) => [e.className, e.getBoundingClientRect().right])) }));
        assert.equal(await page.locator('.cal-chips').evaluate((e) => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
        if (theme === 'light') assert.equal(await page.locator('.eclipse-orb').evaluate((e) => getComputedStyle(e).backgroundColor), 'rgb(255, 255, 255)');
        if (width !== 320) await page.screenshot({ path: `/tmp/taskare-v106/${palette}-${theme}-${width}.png`, animations: 'disabled' });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const view of ['day', 'month']) {
      await page.evaluate((view) => {
        db.settings.palette = 'gallery'; db.settings.theme = 'light'; db.settings.monthStyle = 'timetree';
        applyPalette(); applyTheme(); ui.view = view; setScreen('cal');
      }, view);
      await page.screenshot({ path: `/tmp/taskare-v106/gallery-${view}.png`, animations: 'disabled' });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: anniversary memo persistence/edit/legacy/XSS, swipe guards, two scene timers, 36 responsive design modes');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
