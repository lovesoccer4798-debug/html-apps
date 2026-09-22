import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { deliver, validateSchedule, validateSubscription } from './worker.mjs';
import { buildPushPayload } from '@block65/webcrypto-web-push';
const R = globalThis.TaskareReminders;
const entry = { id: 'a-test', title: '感謝する日', date: '2026-09-21', repeat: 'yearly', holiday: 'respect', reminders: [7, 5, 3, 2, 1, 0] };
const subscription = { endpoint: 'https://web.push.apple.com/test', keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) } };
function environment() {
  const map = new Map();
  return { PUSH_ADMIN_SECRET: 'test-only-secret', VAPID_PUBLIC_KEY: 'test-public', VAPID_PRIVATE_KEY: 'test-private', ALLOW_ORIGIN: 'https://example.org',
    REMINDERS: { async get(k, type) { const v = map.get(k) ?? null; return type === 'json' && v ? JSON.parse(v) : v; },
      async put(k, v) { map.set(k, v); }, async delete(k) { map.delete(k); },
      async list({ prefix }) { return { keys: [...map.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; } } };
}
test('moving holidays, leap day, monthly invalid date and year boundary', () => {
  assert.equal(R.holiday('respect', 2026), '2026-09-21');
  assert.equal(R.holiday('respect', 2027), '2027-09-20');
  assert.equal(R.holiday('__proto__', 2027), null);
  assert.equal(R.next({ date: '2024-02-29', repeat: 'yearly' }, '2026-01-01'), '2028-02-29');
  assert.equal(R.next({ date: '2026-01-31', repeat: 'monthly' }, '2026-02-01'), '2026-03-31');
  assert.equal(R.due([{ ...entry, holiday: '', date: '2027-01-01' }], '2026-12-25')[0].days, 7);
  for (const days of R.offsets) assert.equal(R.due([entry], R.add('2026-09-21', -days))[0].days, days);
  assert.equal(R.due([entry], '2026-09-15').length, 0);
  assert.equal(R.due([{ ...entry, reminders: undefined }], '2026-09-21').length, 0);
});
test('authentication, validation and stale schedule protection', async () => {
  const env = environment();
  const post = (path, data, key = env.PUSH_ADMIN_SECRET) => worker.fetch(new Request('https://worker.example' + path, { method: 'POST', headers: { 'X-Taskare-Key': key, Origin: env.ALLOW_ORIGIN }, body: JSON.stringify(data) }), env);
  assert.equal((await post('/config', {}, 'wrong')).status, 401);
  assert.equal(validateSchedule([null]), false);
  assert.equal(validateSchedule([{ ...entry, reminders: [99] }]), false);
  assert.equal(validateSubscription({ ...subscription, endpoint: 'https://localhost/a' }), false);
  assert.equal(validateSubscription(subscription), true);
  const config = await (await post('/config', {})).json();
  assert.equal((await post('/schedule', { entries: [entry], fingerprint: config.fingerprint })).status, 200);
  assert.equal((await post('/schedule', { entries: [], fingerprint: config.fingerprint })).status, 409);
  assert.equal((await post('/config', null)).status, 400);
  assert.equal((await post('/config', { value: 'x'.repeat(51000) })).status, 413);
  assert.equal((await post('/subscribe', { subscription })).status, 200);
});
test('daily delivery deduplicates, retries failures, drops expired endpoints', async () => {
  const env = environment(); let calls = 0;
  await env.REMINDERS.put('schedule', JSON.stringify([entry]));
  await env.REMINDERS.put('sub:test', JSON.stringify(subscription));
  const send = async () => { calls++; return new Response(null, { status: 201 }); };
  await deliver(env, new Date('2026-09-14T00:00:00Z'), send);
  await deliver(env, new Date('2026-09-14T00:15:00Z'), send);
  assert.equal(calls, 1);
  await deliver(env, new Date('2026-09-16T00:00:00Z'), async () => new Response(null, { status: 500 }));
  await deliver(env, new Date('2026-09-16T00:15:00Z'), send);
  assert.equal(calls, 2);
  await deliver(env, new Date('2026-09-18T00:00:00Z'), async () => new Response(null, { status: 410 }));
  assert.equal(await env.REMINDERS.get('sub:test'), null);
  await deliver(env, new Date('2026-09-21T01:00:00Z'), send);
  assert.equal(calls, 2);
});
test('real Web Crypto payload can be constructed for Apple-compatible aes128gcm', async () => {
  const makeKeys = async () => {
    const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    return { publicKey: Buffer.from(await crypto.subtle.exportKey('raw', pair.publicKey)).toString('base64url'), privateKey: jwk.d };
  };
  const receiver = await makeKeys(), vapid = await makeKeys();
  const payload = await buildPushPayload({ data: 'テスト', options: { ttl: 60 } }, { ...subscription, keys: { p256dh: receiver.publicKey, auth: Buffer.alloc(16, 1).toString('base64url') } }, { ...vapid, subject: 'mailto:test@example.org' });
  assert.equal(payload.method.toUpperCase(), 'POST');
  assert.ok(payload.body);
});
