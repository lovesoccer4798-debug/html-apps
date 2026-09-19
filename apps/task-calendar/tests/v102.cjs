const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.TASKARE_BROWSER ? { executablePath: process.env.TASKARE_BROWSER } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.route(/^https?:/, (route) => route.abort());
  const page = await context.newPage();
  const fs = require('node:fs');
  const output = process.env.TASKARE_SCREENSHOTS || '/tmp/taskare-v102';
  fs.mkdirSync(output, { recursive: true });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  await page.evaluate(() => {
    db = defaultDb();
    db.people = ['あおい', 'かえで', 'さくら'];
    db.settings.peopleGroups = ['東京'];
    db.peopleProfiles = { 'あおい': { nick: 'あおい', _meta: { groups: ['東京'] } } };
    setScreen('peoplebook');
  });
  assert.equal(await page.locator('.peoplebook-group-chip').count(), 1);
  await page.screenshot({ path: `${output}/profiles.png` });
  await page.getByRole('button', { name: '東京', exact: true }).click();
  await page.getByRole('button', { name: '人を追加', exact: true }).click();
  await page.screenshot({ path: `${output}/group-add.png` });
  await page.getByRole('checkbox', { name: 'かえで', exact: true }).check();
  await page.getByRole('button', { name: '1人を追加' }).click();
  assert.equal(await page.locator('.peoplebook-row').count(), 2);
  await page.evaluate(() => { openPerson('かえで'); });
  await page.getByRole('checkbox', { name: '東京', exact: true }).uncheck();
  assert.deepEqual(await page.evaluate(() => personMeta('かえで').groups), []);
  await page.evaluate(() => { setScreen('peoplebook'); ui.peopleGroup = 'all'; renderPeopleBook(); });
  await page.locator('#peoplebook-search').fill('さくら');
  assert.equal(await page.locator('.peoplebook-row').count(), 1);
  assert.equal(await page.locator('#peoplebook-search').evaluate((e) => e === document.activeElement), true);

  await page.evaluate(() => {
    db.tasks = [{ id: 'test-timer', title: '読書テスト', date: todayKey(), minutes: null, createdAt: 1 }];
    ui.view = 'day'; ui.cursor = fromKey(todayKey()); setScreen('cal');
  });
  await page.getByRole('button', { name: '「読書テスト」のタイマーを開始' }).click();
  assert.equal(await page.locator('.timer-choice').count(), 6);
  await page.screenshot({ path: `${output}/timer-choices.png` });
  await page.getByRole('button', { name: '20分', exact: true }).click();
  assert.equal(await page.evaluate(() => db.running.totalMs), 1200000);
  await page.evaluate(() => { pauseTimer(); });
  const paused = await page.evaluate(() => remainingMs());
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => remainingMs()), paused);
  await page.evaluate(() => { resumeTimer(); });
  await page.reload();
  assert.equal(await page.evaluate(() => db.running.totalMs), 1200000);
  await page.evaluate(() => { stopTimer(); });
  await page.getByRole('button', { name: '「読書テスト」のタイマーを開始' }).click();
  await page.getByRole('button', { name: 'カウントアップ · 0秒から' }).click();
  await page.evaluate(() => { db.running.segmentAt -= 65000; db.running.startedAt -= 65000; pauseTimer(); });
  const elapsed = await page.evaluate(() => remainingMs());
  assert.ok(elapsed >= 65000 && elapsed < 67000);
  await page.reload();
  assert.equal(await page.evaluate(() => remainingMs()), elapsed);
  await page.evaluate(() => { resumeTimer(); openFocus(); });
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => remainingMs()) > elapsed);
  assert.equal(await page.locator('#timer-plus1').isVisible(), false);
  await page.screenshot({ path: `${output}/countup.png` });
  await page.reload();
  assert.equal(await page.evaluate(() => db.running.mode), 'countup');
  assert.equal(await page.evaluate(() => db.running.finished), false);
  await page.evaluate(() => { completeRunning(); });
  assert.equal(await page.evaluate(() => db.tasks[0].done), true);
  assert.ok(await page.evaluate(() => db.tasks[0].time && db.tasks[0].timeEnd));

  const notion = await page.evaluate(async () => {
    db = defaultDb();
    const key = todayKey();
    const ago = (n) => { const d = fromKey(key); d.setDate(d.getDate() - n); return toKey(d); };
    db.dayLogs[key] = '今日のあのねノート';
    db.dayLogs[ago(9)] = '9日前のノート';
    db.dayLogs[ago(10)] = '対象外';
    db.events = [{ id: 'e-notion', title: 'メモのない予定', date: key, time: '15:00' }];
    db.settings.notion = { url: 'https://example.invalid', secret: 'test', dbId: 'test', on: false };
    const before = notionUnsyncedKeys();
    const sent = [];
    window.fetch = async (_url, init) => {
      const payload = JSON.parse(init.body); sent.push(payload);
      return { ok: payload.date !== key, status: payload.date === key ? 502 : 200,
        json: async () => payload.date === key ? { error: 'notion-write', status: 400 } : { ok: true } };
    };
    await notionPushBacklog();
    const remaining = notionUnsyncedKeys();
    window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
    await notionPushBacklog();
    const after = notionUnsyncedKeys();
    db.dayLogs[key] += '追記';
    return { before, sent, remaining, after, changed: notionUnsyncedKeys(), key, oldest: ago(9), errors: db.settings.notion.syncErrors };
  });
  assert.deepEqual(notion.before, [notion.key, notion.oldest]);
  assert.equal(notion.sent.length, 2);
  assert.ok(notion.sent[0].diary.includes('今日のあのねノート'));
  assert.ok(notion.sent[0].memo.includes('15:00 メモのない予定'));
  assert.deepEqual(notion.remaining, [notion.key]);
  assert.deepEqual(notion.after, []);
  assert.deepEqual(notion.changed, [notion.key]);
  assert.deepEqual(notion.errors, {});
  assert.deepEqual(await page.evaluate(() => notionCandidateKeysThrough('2026-03-01').slice(-2)), ['2026-02-21', '2026-02-20']);

  await page.evaluate(() => {
    db = defaultDb();
    db.tasks = [{ id: 't1', title: '朝の読書', date: todayKey(), time: '08:00', minutes: 20 }];
    db.events = [{ id: 'e1', title: '友人とランチ', date: todayKey(), time: '12:00', who: ['あおい'] }];
    db.dayLogs[todayKey()] = '少し立ち止まる時間を、大切に。';
    db.settings.monthStyle = 'schedule';
    ui.view = 'month'; setScreen('cal');
  });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    for (const palette of ['skyglass', 'nightsea', 'editorial', 'harbor', 'atelier']) {
      const colors = [];
      for (const theme of ['light', 'dark']) {
        await page.evaluate(({ palette, theme }) => {
          db.settings.palette = palette; db.settings.theme = theme; applyTheme(); applyPalette(); renderAll();
        }, { palette, theme });
        await page.waitForTimeout(650);
        colors.push(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--tc-bg').trim()));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${palette}/${theme}/${width} overflow`);
        await page.screenshot({ path: `${output}/${palette}-${theme}-${width}.png` });
      }
      assert.notEqual(colors[0], colors[1], `${palette} mode switch`);
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.evaluate(() => { db.settings.theme = 'auto'; applyTheme(); });
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--tc-bg').trim()), colors[1]);
    }
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: membership, search focus, countdown/countup pause/reload/complete, Notion window/failure/retry/diary, 20 responsive theme screenshots and OS mode');
})().catch((err) => { console.error(err); process.exit(1); });
