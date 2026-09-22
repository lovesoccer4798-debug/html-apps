'use strict';

const REMINDER_CONFIG_KEY = 'taskare-push-connection';
let reminderSyncTimer;
let reminderSyncedJSON = null;
let reminderStatus = '';
let reminderSyncBusy = false;
function reminderConfig() {
  try { return JSON.parse(localStorage.getItem(REMINDER_CONFIG_KEY)) || {}; } catch { return {}; }
}
function reminderEntries() {
  return db.anniversaries.filter((a) => a.reminders?.length).map((a) => ({
    id: a.id, title: a.title, date: a.date, repeat: annivRepeat(a), holiday: a.holiday || '', reminders: a.reminders,
  }));
}
async function reminderAPI(config, path, body = {}) {
  const response = await fetch(config.url + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Taskare-Key': config.key },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (response.status === 409) throw new Error('別の端末で通知予定が更新されています。カレンダーを同期してから「通知予定を更新」で確認してください。');
  if (!response.ok) throw new Error(`通知サーバーに接続できませんでした（${response.status}）。URL・接続キーを確認してください。`);
  return response.json();
}
function reminderStatusText(text) {
  reminderStatus = text;
  const status = document.getElementById('reminder-status');
  if (status) status.textContent = text;
}
async function syncReminderSchedule(config = reminderConfig()) {
  const entries = reminderEntries();
  const result = await reminderAPI(config, '/schedule', { entries, fingerprint: config.fingerprint });
  const current = reminderConfig();
  if (current.url === config.url && current.key === config.key) config.enabled = current.enabled;
  config.fingerprint = result.fingerprint;
  config.pending = false;
  localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(config));
  reminderSyncedJSON = JSON.stringify(entries);
  reminderStatusText(`通知予定を更新しました（${entries.length}件・日本時間9時）`);
}
function scheduleReminderSync() {
  const config = reminderConfig();
  if (!config.enabled || JSON.stringify(reminderEntries()) === reminderSyncedJSON) return;
  config.pending = true;
  localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(config));
  reminderStatusText('通知予定を送信しています…');
  clearTimeout(reminderSyncTimer);
  reminderSyncTimer = setTimeout(async () => {
    if (reminderSyncBusy) { scheduleReminderSync(); return; }
    reminderSyncBusy = true;
    try { await syncReminderSchedule(config); }
    catch { reminderStatusText('通知予定が未送信です。オンラインで「通知予定を更新」を押してください。'); flashToast('通知予定は未送信です。設定の「大切な日の通知」を確認してください。'); }
    finally { reminderSyncBusy = false; }
  }, 2500);
}
async function reminderRegistration() {
  if (!isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('この画面では通知を登録できません。HTTPSのアプリを開いてください。iPhoneはホーム画面に追加したアプリから設定してください。');
  }
  return Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('通知の準備ができませんでした。オンラインでアプリを開き直してください。')), 12000))]);
}
function renderReminderSettings() {
  const root = document.getElementById('reminder-settings');
  if (!root) return;
  root.replaceChildren();
  const config = reminderConfig();
  root.append(el('h3', '', 'スマホへのリマインド'));
  root.append(el('p', 'hint', '日本時間9時に配信。iPhoneはホーム画面に追加して通知を許可してください。通知サーバーの初期設定が必要です。'));
  const status = el('p', 'hint', reminderStatus || (config.registrationPending ? '通知先の登録結果が未確認です。再登録または解除してください。' : config.pending ? '通知予定が未送信です。「通知予定を更新」で送信してください。' : config.enabled ? 'この端末は登録済み。端末の通知許可とテスト受信を確認してください。' : '未設定：アプリを閉じている間の通知はまだ届きません。'));
  status.id = 'reminder-status'; status.setAttribute('role', 'status'); root.append(status);
  const details = el('details', 'reminder-connection');
  details.append(el('summary', '', '通知サーバーの接続設定'));
  const fields = {};
  for (const [name, title, type] of [['url', '通知サーバーURL', 'url'], ['key', '接続キー', 'password']]) {
    const label = el('label', 'f-label', title);
    const input = document.createElement('input'); input.type = type; input.value = config[name] || '';
    input.autocomplete = 'off'; input.id = `reminder-${name}`; label.htmlFor = input.id;
    details.append(label, input); fields[name] = input;
  }
  details.append(el('p', 'hint', '接続キーはこの端末にのみ保存します。通知名・日付・通知先を専用サーバーに送ります。日記は送りません。'));
  root.append(details);
  const actions = el('div', 'reminder-actions');
  function action(title, callback) {
    const button = el('button', 'cta ghost', title); button.type = 'button';
    button.onclick = async () => {
      const buttons = [...actions.querySelectorAll('button')]; buttons.forEach((b) => { b.disabled = true; });
      try { await callback(); } catch (error) { reminderStatusText(error.message); }
      finally { buttons.forEach((b) => { b.disabled = false; }); }
    };
    actions.append(button);
  }
  action(config.enabled ? '端末の登録を確認' : 'この端末の通知を登録', async () => {
    if (location.protocol !== 'https:') throw new Error('通知登録には公開済みのHTTPS版が必要です。このファイル画面からは登録できません。');
    let url;
    try { url = new URL(fields.url.value); } catch { throw new Error('通知サーバーURLを入力してください。'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('通知サーバーのHTTPS URL（パスなし）を入力してください。');
    if (!fields.key.value.trim()) throw new Error('接続キーを入力してください。');
    if (config.enabled && (url.origin !== config.url || fields.key.value.trim() !== config.key)) throw new Error('接続先を変更する前に、現在の端末の通知を解除してください。');
    if (!('Notification' in window)) throw new Error('iPhoneはホーム画面に追加したアプリから通知を登録してください。');
    // Request permission directly from the click, before waiting for network work.
    if (await Notification.requestPermission() !== 'granted') throw new Error('通知が許可されていません。端末の設定を確認してください。');
    const connection = { url: url.origin, key: fields.key.value.trim(), enabled: false };
    const reg = await reminderRegistration();
    const { publicKey, hasSchedule, fingerprint } = await reminderAPI(connection, '/config');
    connection.fingerprint = fingerprint;
    const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const subscription = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
    const subscribedKey = subscription.options?.applicationServerKey;
    if (subscribedKey && [...new Uint8Array(subscribedKey)].some((value, i) => value !== bytes[i])) throw new Error('通知用の鍵が変更されています。この端末の通知を解除してから再登録してください。');
    if (!hasSchedule) await syncReminderSchedule(connection);
    connection.registrationPending = true;
    localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(connection));
    await reminderAPI(connection, '/subscribe', { subscription });
    connection.registrationPending = false;
    connection.enabled = true;
    localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(connection));
    reminderStatusText('端末を登録しました。「通知予定を更新」で予定を送信し、「テスト通知」で受信を確認してください。');
    renderReminderSettings();
  });
  if (config.enabled) {
    action('通知予定を更新', async () => {
      if (!confirm('この端末の大切な日で、全端末の通知予定を更新します。別端末の変更がある場合は先にカレンダーを同期してください。更新しますか？')) return;
      const latest = await reminderAPI(config, '/config');
      await syncReminderSchedule({ ...config, fingerprint: latest.fingerprint });
    });
    action('テスト通知', async () => {
      const subscription = await (await reminderRegistration()).pushManager.getSubscription();
      if (!subscription) throw new Error('端末の通知登録が失効しています。もう一度登録してください。');
      await reminderAPI(config, '/test', { subscription });
      reminderStatusText('配信サービスに送信しました。スマホに届いたことを確認してください。');
    });
  }
  if (config.url && config.key) {
    action('この端末の通知を解除', async () => {
      const sub = await (await reminderRegistration()).pushManager.getSubscription();
      if (sub) { await reminderAPI(config, '/unsubscribe', { subscription: sub }); await sub.unsubscribe(); }
      localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify({ ...config, enabled: false, registrationPending: false }));
      clearTimeout(reminderSyncTimer); reminderSyncedJSON = null;
      reminderStatusText('この端末の通知登録を解除しました。'); renderReminderSettings();
    });
  }
  root.append(actions);
  const manage = el('button', 'cta ghost', '大切な日を設定'); manage.type = 'button';
  manage.onclick = () => { delete db.settings.hidden['nav:anniv']; save(); setScreen('anniv'); };
  root.append(manage);
}
