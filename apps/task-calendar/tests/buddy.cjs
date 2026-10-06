const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TASKARE_BROWSER });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    let requests = [], status = 200;
    await context.route(/^https?:/, async route => {
      if (!route.request().url().startsWith('https://buddy.example/chat')) return route.abort();
      requests.push(route.request().postDataJSON());
      return route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(status === 200 ? { reply: '<img src=x onerror=alert(1)> ひと息つこう。' } : { error: 'limit_reached' }) });
    });
    const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    await page.goto(url); await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    await page.evaluate(() => { window.TC_BUDDY_API_URL = 'https://buddy.example'; fbUser = { uid: 'test', getIdToken: async () => 'test.token' }; setScreen('settings'); });
    await page.getByRole('button', { name: 'Buddy', exact: true }).click();
    assert.equal(await page.locator('.buddy-launcher').isVisible(), false);
    await page.getByLabel('Buddyを表示', { exact: true }).check();
    await page.getByLabel('Buddyの名前', { exact: true }).fill('もこちゃん');
    await page.getByLabel('あなたの呼ばれ方').fill('テストさん');
    for (const avatar of ['moco', 'stella', 'poco']) {
      await page.locator(`input[name="buddy-avatar"][value="${avatar}"]`).check();
      assert.match(await page.locator('.buddy-launcher img').getAttribute('src'), new RegExp(avatar));
      assert.ok(await page.locator('.buddy-launcher img').evaluate(img => img.complete && img.naturalWidth > 0));
    }
    fs.mkdirSync('/tmp/taskare-buddy', { recursive: true });
    for (const width of [320, 390, 1440]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 }); await page.evaluate(theme => { db.settings.theme = theme; applyTheme(); }, theme);
      await page.screenshot({ path: `/tmp/taskare-buddy/settings-${width}-${theme}.png`, fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await page.locator('#buddy-settings button').filter({ hasText: 'Buddyを開く' }).click();
    await page.getByLabel('TaskAREの使い方を検索').fill('日程'); assert.equal(await page.locator('.buddy-answers details').count(), 1);
    await page.getByRole('button', { name: '会話', exact: true }).click();
    await page.getByLabel('Buddyへのメッセージ').fill('元気をください'); await page.getByRole('button', { name: '送信', exact: true }).click();
    assert.equal(requests.length, 0);
    await page.getByLabel('内容を確認して、この会話の外部送信に同意する').check();
    await page.getByRole('button', { name: '送信', exact: true }).click(); await page.locator('.buddy-message.assistant').waitFor();
    assert.deepEqual(Object.keys(requests[0]).sort(), ['consent', 'messages', 'name', 'nickname', 'tone']);
    assert.equal(await page.locator('.buddy-log img').count(), 0);
    assert.equal(requests[0].messages.length, 1); assert.equal(requests[0].nickname, 'テストさん');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: `/tmp/taskare-buddy/chat-${width}.png` });
      assert.ok(await page.locator('.buddy-dialog').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
      await page.screenshot({ path: `/tmp/taskare-buddy/chat-${width}.png` });
    }
    status = 429; await page.getByLabel('Buddyへのメッセージ').fill('続き'); await page.getByRole('button', { name: '送信', exact: true }).click();
    await page.getByText(/無料の利用上限または/).waitFor(); assert.equal(requests.length, 2);
    await page.getByRole('button', { name: '会話を消去', exact: true }).click(); assert.equal(await page.locator('.buddy-message').count(), 0);
    await page.evaluate(() => { fbUser = null; renderAll(); });
    assert.equal(await page.getByLabel('内容を確認して、この会話の外部送信に同意する').isChecked(), false);
    await page.getByLabel('内容を確認して、この会話の外部送信に同意する').check();
    await page.getByLabel('Buddyへのメッセージ').fill('こんにちは'); await page.getByRole('button', { name: '送信', exact: true }).click();
    await page.getByText('TaskAREにGoogleログインしてください。', { exact: true }).waitFor(); assert.equal(requests.length, 2);
    await page.getByRole('button', { name: '閉じる', exact: true }).click();
    const rect = await page.locator('.buddy-launcher').boundingBox();
    await page.mouse.move(rect.x + 30, rect.y + 30); await page.mouse.down(); await page.mouse.move(rect.x + 150, rect.y - 50, { steps: 10 }); await page.mouse.up();
    assert.equal(await page.locator('.buddy-dialog').isVisible(), false);
    const pos = await page.evaluate(() => JSON.parse(localStorage.getItem('taskare-buddy-v1'))); assert.ok(pos.x > 0);
    await page.locator('.buddy-launcher').focus(); await page.keyboard.press('ArrowRight');
    assert.ok(await page.evaluate(x => JSON.parse(localStorage.getItem('taskare-buddy-v1')).x > x, pos.x));
    await page.reload(); await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.buddy-launcher').getAttribute('aria-label'), 'もこちゃんを開く');
    await page.evaluate(() => setScreen('settings')); await page.getByRole('button', { name: 'Buddy', exact: true }).click();
    await page.getByLabel('オリジナル画像', { exact: false }).setInputFiles(path.resolve(__dirname, '../assets/buddy-moco.png'));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('taskare-buddy-v1')).avatar === 'custom');
    const image = await page.evaluate(() => JSON.parse(localStorage.getItem('taskare-buddy-v1')).image); assert.ok(image.startsWith('data:image/png;')); assert.ok(image.length < 400000);
    await page.getByRole('button', { name: 'オリジナル画像を削除' }).click();
    await page.getByRole('button', { name: 'Buddyを開く', exact: true }).click();
    await page.getByRole('button', { name: '検索・よくある質問', exact: true }).click();
    const search = page.getByLabel('TaskAREの使い方を検索');
    await search.dispatchEvent('compositionstart'); await search.fill('プロフィール'); await search.dispatchEvent('compositionend');
    assert.ok(await page.locator('.buddy-answers details').count() > 0);
    assert.ok((await page.locator('.buddy-answers details').allTextContents()).every(answer => answer.includes('プロフィール')));
    await page.getByRole('button', { name: '閉じる', exact: true }).click();
    await page.getByLabel('Buddyを表示', { exact: true }).uncheck(); assert.equal(await page.locator('.buddy-launcher').isVisible(), false);
    assert.deepEqual(errors, []); console.log('PASS Buddy: presets, settings, mobile/desktop, FAQ, consent, payload privacy, XSS, quota, drag, upload and persistence');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
