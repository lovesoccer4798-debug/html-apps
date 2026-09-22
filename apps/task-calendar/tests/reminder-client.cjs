const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
function setup() {
  const storage = new Map(), calls = [], root = element('div'); root.id = 'reminder-settings';
  function element(tag, cls, text = '') {
    return { tag, textContent: text, children: [], value: '', type: '', disabled: false,
      append(...children) { this.children.push(...children); }, replaceChildren() { this.children = []; },
      setAttribute() {}, querySelectorAll(selector) { return walk(this).filter((e) => e.tag === selector); } };
  }
  function walk(e) { return [e, ...e.children.flatMap(walk)]; }
  const subscription = { endpoint: 'https://web.push.apple.com/test', keys: {}, options: {}, async unsubscribe() { return true; } };
  const server = { fail: '', hasSchedule: false, fingerprint: 'initial' };
  const ctx = vm.createContext({
    console, URL, Uint8Array, atob, AbortSignal, isSecureContext: true, location: { protocol: 'https:' },
    document: { getElementById: (id) => walk(root).find((e) => e.id === id), createElement: element },
    el: element, flashToast() {}, confirm: () => true,
    window: { PushManager() {}, Notification: {} }, Notification: { requestPermission: async () => 'granted' },
    navigator: { serviceWorker: { ready: Promise.resolve({ pushManager: { getSubscription: async () => subscription } }) } },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    db: { anniversaries: [], settings: { hidden: {} } }, annivRepeat: (a) => a.repeat,
    setTimeout: () => 1, clearTimeout() {},
    fetch: async (url, options) => {
      const path = new URL(url).pathname; calls.push({ path, body: JSON.parse(options.body) });
      return { status: server.fail === path ? 502 : 200, ok: server.fail !== path,
        json: async () => path === '/config' ? { publicKey: 'A'.repeat(88), hasSchedule: server.hasSchedule, fingerprint: server.fingerprint } : { ok: true, fingerprint: 'next' } };
    },
  });
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../reminder-client.js'), 'utf8'), ctx);
  const run = (s) => vm.runInContext(s, ctx);
  function render() { run('renderReminderSettings()'); }
  function field(id, value) { walk(root).find((e) => e.id === id).value = value; }
  const click = (title) => walk(root).find((e) => e.tag === 'button' && e.textContent === title).onclick();
  return { run, render, field, click, server, calls };
}
test('registration failure stays uncertain and can be explicitly removed', async () => {
  const s = setup(); s.render();
  s.field('reminder-url', 'https://worker.example'); s.field('reminder-key', 'test-only-key');
  s.server.fail = '/subscribe';
  await s.click('この端末の通知を登録');
  assert.equal(s.run('reminderConfig().enabled'), false);
  assert.equal(s.run('reminderConfig().registrationPending'), true);
  s.server.fail = ''; s.render(); await s.click('この端末の通知を解除');
  assert.equal(s.run('reminderConfig().registrationPending'), false);
  assert.ok(s.calls.some((c) => c.path === '/unsubscribe'));
});
test('new device does not replace existing schedule during registration', async () => {
  const s = setup(); s.server.hasSchedule = true; s.render();
  s.field('reminder-url', 'https://worker.example'); s.field('reminder-key', 'test-only-key');
  await s.click('この端末の通知を登録');
  assert.equal(s.run('reminderConfig().enabled'), true);
  assert.equal(s.calls.filter((c) => c.path === '/schedule').length, 0);
  await s.click('通知予定を更新');
  assert.equal(s.calls.filter((c) => c.path === '/schedule').length, 1);
  assert.equal(s.run('reminderConfig().fingerprint'), 'next');
});
test('push clicks open reminders without redirecting timer notifications', async () => {
  const handlers = {}, opened = [];
  const self = { registration: { scope: 'https://example.org/taskare/' },
    addEventListener(name, handler) { handlers[name] = handler; },
    clients: { async matchAll() { return []; }, async openWindow(url) { opened.push(url); } } };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../sw.js'), 'utf8'), { self, URL });
  for (const data of [{ destination: 'reminders' }, undefined]) {
    let pending;
    handlers.notificationclick({ notification: { data, close() {} }, waitUntil(promise) { pending = promise; } });
    await pending;
  }
  assert.deepEqual(opened, ['https://example.org/taskare/?reminders=1', 'https://example.org/taskare/']);
});
