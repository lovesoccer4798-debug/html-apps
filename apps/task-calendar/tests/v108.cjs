const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TASKARE_BROWSER });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(() => { Object.defineProperty(window, 'TC_BOOKING_API_URL', { get: () => 'https://booking.example', set: () => {} }); });
    const code = 'a'.repeat(48); const slot = { key: '2026-10-15', startMin: 600, durMin: 60 };
    let answered = false, requestBody;
    await context.route(/^https?:/, async route => {
      const u = new URL(route.request().url()); if (u.hostname !== 'booking.example') return route.abort();
      let body = {};
      if (u.pathname.endsWith('/answer')) { answered = true; requestBody = route.request().postDataJSON(); body = { status: 'processing' }; }
      else if (u.pathname.endsWith('/receipt')) body = { status: 'confirmed', mail: 'sent', picked: slot, meetLink: 'https://meet.google.com/abc-defg-hij', calendarLink: 'https://calendar.google.com/calendar/render?action=TEMPLATE' };
      else if (u.pathname === '/owner/status') body = { connected: true, email: 'owner@example.com' };
      else if (u.pathname === '/owner/offers') body = route.request().method() === 'POST' ? { code, title: '打ち合わせ', slots: [slot] } : { offers: [] };
      else body = { code, title: '打ち合わせ', owner: 'テスト主催者', venue: '会場A', slots: [slot], status: answered ? 'closed' : 'open' };
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
    });
    const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    await page.goto(url + '?booking=' + code); await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    fs.mkdirSync('/tmp/taskare-v108', { recursive: true });
    for (const width of [320, 390, 1440]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 }); await page.evaluate(theme => { db.settings.theme = theme; applyTheme(); }, theme);
      assert.ok(await page.locator('.booking-card').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `/tmp/taskare-v108/guest-${width}-${theme}.png`, fullPage: true });
    }
    await page.getByRole('radio', { name: /2026-10-15/ }).check();
    await page.getByLabel('お名前', { exact: true }).fill('テスト相手');
    await page.getByLabel('案内を受け取るメールアドレス').fill('guest@example.com');
    await page.getByRole('radio', { name: 'オンライン（Google Meet）', exact: true }).check();
    await page.getByLabel('備考・ご希望の会議URL（任意）').fill('https://example.com/zoom <img src=x>');
    await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'この内容で回答する' }).click();
    await page.getByText('メール送信済み', { exact: true }).waitFor();
    assert.equal(requestBody.mode, 'online'); assert.match(requestBody.remarks, /example.com/); assert.equal(requestBody.receipt.length, 48);
    assert.equal(await page.getByRole('link', { name: 'Google Meetを開く' }).getAttribute('href'), 'https://meet.google.com/abc-defg-hij');
    await page.reload(); await page.getByText('メール送信済み', { exact: true }).waitFor();
    await page.goto(url); await page.locator('#tc-splash').waitFor({ state: 'hidden' });
    await page.evaluate(() => {
      fbUser = { uid: 'test', getIdToken: async () => 'test.token' };
      setScreen('settings');
    });
    await page.getByRole('button', { name: '日程確定の自動案内', exact: true }).click();
    await page.getByLabel('日程候補を送る案内文（リンク付き）').fill('こんにちは！ {{予定名}}\n{{候補}}\n{{リンク}}');
    assert.match(await page.evaluate(() => db.settings.bookingInvitationTemplate), /こんにちは/);
    const fallback = await page.evaluate(() => TaskareBooking.invitationText('よろしくお願いします', { title: '打ち合わせ', slots: [] }, 'https://example.com/booking'));
    assert.equal(fallback, 'よろしくお願いします\n\nhttps://example.com/booking');
    await page.getByLabel('日程確定メールの本文').fill('ご調整ありがとうございます！');
    assert.equal(await page.evaluate(() => db.settings.bookingTemplate), 'ご調整ありがとうございます！');
    await page.getByRole('button', { name: '連携状態を確認', exact: true }).click();
    await page.getByText('送信元：owner@example.com', { exact: true }).waitFor();
    await page.evaluate(async slot => {
      await TaskareBooking.createDialog({ user: fbUser, owner: 'テスト', invitationTemplate: db.settings.bookingInvitationTemplate,
        slots: Array.from({ length: 5 }, (_, i) => ({ ...slot, startMin: slot.startMin + i * 60 })), created: o => { window.createdOffer = o; } });
    }, slot);
    await page.getByRole('button', { name: 'リンクを作成', exact: true }).click();
    await page.getByRole('heading', { name: 'リンクを作成しました' }).waitFor();
    assert.equal(new URL(await page.getByLabel('共有URL').inputValue()).searchParams.get('booking'), code);
    const invitation = await page.getByLabel('共有する案内文').inputValue();
    assert.match(invitation, /こんにちは！ 打ち合わせ/); assert.match(invitation, /14:00/); assert.match(invitation, /booking=/);
    await page.evaluate(() => { Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async text => { window.copiedText = text; } }); });
    await page.getByRole('button', { name: '案内文とリンクをコピー', exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedText), invitation);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.locator('.booking-dialog').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
      await page.screenshot({ path: `/tmp/taskare-v108/invitation-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: '閉じる', exact: true }).click();
    const candidates = await page.evaluate(() => {
      ui.schedSlots = []; ui.schedDur = 60;
      for (let i = 0; i < 6; i++) schedAddSlot('2026-10-20', (8 + i) * TG_HOUR_H);
      return ui.schedSlots;
    });
    assert.equal(candidates.length, 5); assert.ok(candidates.every(s => s.durMin === 60));
    const imported = await page.evaluate(({ code, slot }) => {
      const o = { code, title: '予約テスト', eventId: 't' + code, createdAt: Date.now(), answer: { picked: slot, mode: 'online', remarks: '先方のURL' } };
      importBookingOffers([o]); const ev = db.events.find(e => e.bookingCode === code); const memo = ev.memo;
      ev.memo += '\n自分の追記'; importBookingOffers([{ ...o, meetLink: 'https://meet.google.com/abc-defg-hij' }]);
      const count = db.events.filter(e => e.bookingCode === code).length; const preserved = ev.memo.endsWith('自分の追記');
      db.events = db.events.filter(e => e.bookingCode !== code); importBookingOffers([o]);
      return { count, memo, preserved, restored: db.events.some(e => e.bookingCode === code) };
    }, { code, slot });
    assert.equal(imported.count, 1); assert.equal(imported.preserved, true); assert.equal(imported.restored, false); assert.match(imported.memo, /先方のURL/);
    assert.deepEqual(errors, []);
    console.log('PASS v108: responsive light/dark guest form, receipt reload, template, creation, private notes and idempotent import');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
