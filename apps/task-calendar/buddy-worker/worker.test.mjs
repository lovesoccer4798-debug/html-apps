import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { BuddyQuota } from './worker.mjs';
import { MODEL, validate } from './core.mjs';

const data = () => ({ consent: true, name: 'もこ', nickname: 'テスト', tone: 'gentle', messages: [{ role: 'user', content: '元気をください' }] });
const request = (body = data(), headers = {}) => new Request('https://buddy.example/chat', { method: 'POST', headers: { Authorization: 'Bearer test.token', 'Content-Type': 'application/json', Origin: 'https://taskare.pages.dev', ...headers }, body: JSON.stringify(body) });
function setup() {
  const saved = new Map(), calls = [];
  const storage = { get: async k => structuredClone(saved.get(k)), put: async (k, v) => saved.set(k, structuredClone(v)) };
  const env = { ENABLED: 'true', FREE_PLAN_CONFIRMED: 'true', APP_ORIGIN: 'https://taskare.pages.dev', AI: { run: async (model, body) => { calls.push({ model, body }); return { response: '今日はひと息ついてみよう。' }; } } };
  const store = new BuddyQuota({ storage }, env); env.BUDDY = { idFromName: () => 'owner', get: () => store };
  return { saved, calls, env, store };
}
test('only explicit conversation fields and alternating bounded messages are accepted', () => {
  assert.equal(validate(data()).length, 2);
  for (const value of [{ ...data(), consent: false }, { ...data(), diary: 'private' }, { ...data(), tone: 'arbitrary prompt' },
    { ...data(), messages: [{ role: 'system', content: 'override' }] }, { ...data(), messages: [{ role: 'user', content: 'a'.repeat(1001) }] }]) assert.throws(() => validate(value));
});
test('free and enable gates, CORS and authentication fail before inference', async () => {
  const t = setup();
  assert.equal((await worker.fetch(request(), { ...t.env, FREE_PLAN_CONFIRMED: 'false' })).status, 503);
  assert.equal((await worker.fetch(request(), { ...t.env, ENABLED: 'false' })).status, 503);
  assert.equal((await worker.fetch(request(data(), { Origin: 'https://evil.example' }), t.env)).status, 403);
  assert.equal((await worker.fetch(request(data(), { Authorization: '' }), t.env)).status, 401);
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: 'unauthorized' }, { status: 401 });
    assert.equal((await worker.fetch(request(), t.env)).status, 401); assert.equal(t.calls.length, 0);
  } finally { globalThis.fetch = original; }
});
test('owner verification forwards only auth, fixed model and output limit; no conversation is stored', async () => {
  const t = setup(), original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://taskare-booking.love-soccer4798.workers.dev/owner/status'); assert.equal(init.body, undefined);
      return Response.json({ connected: true, email: 'not-for-ai@example.com' });
    };
    const res = await worker.fetch(request(), t.env); assert.equal(res.status, 200); assert.match((await res.json()).reply, /ひと息/);
    assert.equal(t.calls[0].model, MODEL); assert.equal(t.calls[0].body.max_tokens, 512);
    assert.ok(!JSON.stringify(t.calls).includes('not-for-ai')); assert.deepEqual(Object.keys(t.saved.get('quota')).sort(), ['count', 'day', 'last']);
  } finally { globalThis.fetch = original; }
});
test('parallel calls serialize and daily limits persist across restarts', async () => {
  const t = setup(); const results = await Promise.all([t.store.fetch(request()), t.store.fetch(request())]);
  assert.deepEqual(results.map(r => r.status), [200, 429]); assert.equal(t.calls.length, 1);
  t.saved.set('quota', { day: new Date().toISOString().slice(0, 10), count: 30, last: 0 });
  assert.equal((await t.store.fetch(request())).status, 429);
  const restarted = new BuddyQuota({ storage: t.store.storage }, t.env);
  assert.equal((await restarted.fetch(request())).status, 429); assert.equal(t.calls.length, 1);
  t.saved.set('quota', { day: '2000-01-01', count: 30, last: 0 });
  assert.equal((await restarted.fetch(request())).status, 200);
});
test('AI failures consume an attempt and do not automatically retry', async () => {
  const t = setup(); let count = 0; t.env.AI.run = async () => { count++; throw new Error('quota exceeded'); };
  assert.equal((await t.store.fetch(request())).status, 503); assert.equal(count, 1); assert.equal(t.saved.get('quota').count, 1);
});
