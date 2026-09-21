const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.TASKARE_BROWSER ? { executablePath: process.env.TASKARE_BROWSER } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route(/^https?:/, (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.getByRole('button', { name: 'メニュー', exact: true }).click();
    await page.getByRole('button', { name: '原点ノート', exact: true }).click();
    await page.getByRole('button', { name: '最初のノートを書く' }).click();
    await page.getByLabel('言葉・行動', { exact: true }).fill('相手の話を、最後まで聴く。');
    await page.getByLabel('理由', { exact: true }).fill('すぐに答えを出さず、その人の気持ちを知りたい。\n近くにいる人ほど、丁寧に。');
    await page.getByRole('button', { name: '参考資料を追加' }).click();
    await page.getByLabel('書名・ページ名').fill('聴くことについての動画');
    await page.getByLabel('URL（任意）').fill('https://www.youtube.com/watch?v=test');
    await page.getByRole('button', { name: '参考資料を追加' }).click();
    await page.getByLabel('書名・ページ名').nth(1).fill('大切に読み返したい本 / 第3章');
    await page.getByLabel('今の自分からひとこと（任意）').fill('今日は、話の途中で口を挟まずに聴けた。');
    await page.getByLabel('上に固定', { exact: true }).check();
    await page.getByRole('button', { name: '保存', exact: true }).click();
    assert.equal(await page.locator('.origin-entry').count(), 1);
    assert.equal(await page.getByRole('link', { name: '聴くことについての動画' }).getAttribute('target'), '_blank');
    assert.equal(await page.locator('.origin-source').count(), 2);
    await page.getByRole('button', { name: 'ノートを編集', exact: true }).click();
    await page.getByLabel('URL（任意）').first().fill('javascript:alert(1)');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    assert.equal(await page.locator('dialog[open]').count(), 1);
    assert.equal(await page.evaluate(() => originNotes()[0].sources[0].url.startsWith('https:')), true);
    await page.getByLabel('URL（任意）').first().fill('https://youtu.be/test');
    await page.getByRole('button', { name: '保存', exact: true }).click();

    await page.getByRole('tab', { name: /やめたい行動/ }).click();
    await page.getByRole('button', { name: 'ノートを追加', exact: true }).click();
    await page.getByLabel('言葉・行動', { exact: true }).fill('寝る前に、目的もなく画面を見続ける。');
    await page.getByLabel('理由', { exact: true }).fill('明日の自分に、気持ちよく朝を迎えてほしい。');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    assert.equal(await page.evaluate(() => originNotes()[1].kind), 'stop');
    await page.getByRole('button', { name: 'ノートを編集', exact: true }).click();
    await page.getByLabel('言葉・行動', { exact: true }).fill('保存しない変更');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '閉じる', exact: true }).click();
    assert.equal(await page.locator('.origin-words').textContent(), '寝る前に、目的もなく画面を見続ける。');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'ノートを削除', exact: true }).click();
    assert.equal(await page.locator('.origin-entry').count(), 0);
    await page.locator('#toast-undo').click();
    assert.equal(await page.locator('.origin-entry').count(), 1);
    await page.reload();
    await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => originNotes().length), 2);

    const sync = await page.evaluate(async () => {
      let payload;
      fbReady = true; fbUser = { uid: 'test-user' };
      window.firebase = { firestore: () => ({ collection: () => ({ doc: () => ({ set: async (data) => { payload = data; } }) }) }) };
      await cloudPush(); fbReady = false; fbUser = null;
      return { notes: payload.originNotes, backup: JSON.parse(localStorage.getItem(STORAGE_V2)).originNotes };
    });
    assert.equal(sync.notes.length, 2);
    assert.deepEqual(sync.notes, sync.backup);
    assert.equal(await page.evaluate(() => originUrl('data:text/html,test')), null);
    await page.evaluate(() => {
      originNotes().push({ id: 'extra', kind: 'value', title: '<img src=x onerror=alert(1)>', reason: '長い理由。'.repeat(80), sources: [], createdAt: Date.now(), updatedAt: Date.now() });
      openOrigin();
    });
    assert.equal(await page.locator('.origin-entry img').count(), 0);
    assert.equal(await page.locator('.origin-entry').first().getAttribute('data-id'), sync.notes[0].id);
    const output = '/tmp/taskare-origin'; fs.mkdirSync(output, { recursive: true });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      for (const theme of ['light', 'dark']) {
        for (const kind of ['value', 'stop']) {
          await page.evaluate(({ theme, kind }) => { db.settings.theme = theme; applyTheme(); ui.originKind = kind; renderOrigin(); }, { theme, kind });
          await page.waitForTimeout(250);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          await page.screenshot({ path: `${output}/${width}-${theme}-${kind}.png`, fullPage: true });
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: origin create/edit/links/unsafe URLs/discard/delete-undo/reload/pin/escaping/private sync/backup and 8 responsive light-dark views');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
