const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TASKARE_BROWSER });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route(/^https?:/, (route) => route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    await page.evaluate(() => { delete db.settings.hidden['nav:anniv']; setScreen('anniv'); });
    await page.getByRole('button', { name: '＋ 記念日を追加', exact: true }).click();
    await page.getByLabel('日付の指定', { exact: true }).selectOption('respect');
    await page.getByLabel('1週間前', { exact: true }).check();
    await page.getByLabel('当日', { exact: true }).check();
    await page.locator('#anniv-save').click();
    assert.equal(await page.locator('.anniv-title').textContent(), '敬老の日');
    assert.deepEqual(await page.evaluate(() => db.anniversaries[0].reminders), [7, 0]);
    await page.getByRole('button', { name: '通知の設定', exact: true }).click();
    assert.match(await page.locator('#reminder-status').textContent(), /未設定/);
    await page.evaluate(() => { ui.cursor = new Date(); ui.view = 'day'; ui.dayLogEditKey = todayKey(); setScreen('cal'); });
    await page.locator('.daylog-input').fill('嬉しかった。<img src=x onerror=alert(1)>\n');
    await page.getByRole('button', { name: 'リンクを挿入', exact: true }).click();
    await page.getByLabel('表示する名前（任意）').fill('参考の動画');
    await page.getByLabel('リンク先URL').fill('javascript:alert(1)');
    await page.getByRole('button', { name: '挿入', exact: true }).click();
    assert.equal(await page.locator('dialog[open]').count(), 1);
    await page.getByLabel('リンク先URL').fill('https://example.org/watch');
    await page.getByRole('button', { name: '挿入', exact: true }).click();
    await page.locator('.daylog-acts').getByRole('button', { name: '保存', exact: true }).click();
    assert.equal(await page.locator('.daylog-preview a').getAttribute('href'), 'https://example.org/watch');
    assert.equal(await page.locator('.daylog-preview img').count(), 0);
    assert.match(await page.locator('.daylog-preview').textContent(), /onerror/);
    await page.evaluate(() => { ui.insightsPeriod = 'month'; ui.insightsOffset = 0; setScreen('insights'); });
    assert.equal(await page.locator('.record-highlight').count(), 1);
    assert.match(await page.locator('.record-highlight').textContent(), /1日/);
    await page.locator('.record-source').click();
    assert.equal(await page.locator('.daylog-preview a').count(), 1);
    assert.equal(await page.evaluate(() => recordHighlights([{ date: 'a', text: '楽しかった' }, { date: 'a', text: '嬉しかった' }])[0].count), 1);
    assert.equal(await page.evaluate(() => recordHighlights([{ date: 'a', text: '楽しくなかった' }]).length), 0);
    fs.mkdirSync('/tmp/taskare-v104', { recursive: true });
    await page.evaluate(() => {
      db.tasks = [3, 10, 16, 22, 23, 25].map((day) => ({ id: `visual-${day}`, title: day === 23 ? '読書とノート' : '散歩・リフレッシュ', date: `2026-09-${String(day).padStart(2, '0')}`, createdAt: 1 }));
    });
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport);
      for (const palette of ['collage', 'letterpress', 'gallery']) for (const theme of ['light', 'dark']) {
        await page.evaluate(({ palette, theme }) => {
          db.settings.palette = palette; db.settings.theme = theme; db.settings.monthStyle = 'schedule';
          ui.view = 'month'; ui.cursor = new Date(2026, 8, 1); ui.screen = 'cal'; applyTheme(); applyPalette(); renderAll();
        }, { palette, theme });
        await page.waitForTimeout(250);
        await page.screenshot({ path: `/tmp/taskare-v104/${palette}-${theme}-${viewport.width}.png`, fullPage: true, animations: 'disabled' });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${palette} overflow`);
      }
    }
    await page.reload();
    assert.deepEqual(await page.evaluate(() => db.anniversaries[0].reminders), [7, 0]);
    assert.deepEqual(errors, []);
    console.log('v104 browser tests passed; screenshots /tmp/taskare-v104');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
