import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { BookingStore } from './worker.mjs';
import { validateOffer, validateAnswer, randomToken, eventBody, mailText, rawMail, publicOffer, hash, DAY } from './core.mjs';
import { seal, unseal, authenticate, limitedJson, external } from './security.mjs';

const env = { ENABLED: 'true', FREE_PLAN_CONFIRMED: 'true', OWNER_UID: 'owner', FIREBASE_API_KEY: 'test-key', GOOGLE_CLIENT_ID: 'test-client',
  GOOGLE_CLIENT_SECRET: 'test-secret', TOKEN_KEY: 'a'.repeat(64), APP_URL: 'https://app.example/task/', PUBLIC_URL: 'https://booking.example' };
function data() {
  return { title: '打ち合わせ', owner: 'テスト', venue: '会場A', slots: [{ key: new Date(Date.now() + DAY).toISOString().slice(0, 10), startMin: 600, durMin: 60 }] };
}
function answer() { return { slot: 0, mode: 'online', name: 'テスト相手', email: 'guest@example.com', remarks: 'Zoom: https://example.com/meeting', receipt: randomToken() }; }
class MemoryStorage {
  constructor() { this.values = new Map(); this.next = null; }
  async get(key) { return structuredClone(this.values.get(key)); }
  async put(key, value) { this.values.set(key, structuredClone(value)); }
  async delete(key) { this.values.delete(key); }
  async list({ prefix, limit }) { return new Map([...this.values].filter(([key]) => key.startsWith(prefix)).slice(0, limit).map(([key, v]) => [key, structuredClone(v)])); }
  async setAlarm(time) { this.next = time; }
  async deleteAlarm() { this.next = null; }
}
async function setup() {
  const storage = new MemoryStorage();
  const store = new BookingStore({ storage, blockConcurrencyWhile: fn => fn() }, { ...env });
  await store.ready;
  store.meta.credentials = await seal(env.TOKEN_KEY, { refreshToken: 'private-refresh' }); store.meta.email = 'owner@example.com'; store.meta.sub = 'google-owner'; await store.saveMeta();
  const sent = []; const events = new Map(); const calls = [];
  const mock = async (url, init = {}) => {
    url = String(url); calls.push({ url, method: init.method || 'GET' });
    if (url.startsWith('https://identitytoolkit.googleapis.com/')) return Response.json({ users: [{ localId: 'owner', emailVerified: true, providerUserInfo: [{ providerId: 'google.com', rawId: 'google-owner', email: 'owner@example.com' }] }] });
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'access', refresh_token: 'private-refresh', scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send' });
    if (url === 'https://openidconnect.googleapis.com/v1/userinfo') return Response.json({ sub: 'google-owner', email: 'owner@example.com', email_verified: true });
    if (url === 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send') { sent.push(JSON.parse(init.body)); return Response.json({ id: 'message' }); }
    if (url.startsWith('https://www.googleapis.com/calendar/v3/calendars/primary/events')) {
      const u = new URL(url);
      if (init.method === 'POST') {
        const e = JSON.parse(init.body);
        e.hangoutLink = e.conferenceData ? 'https://meet.google.com/abc-defg-hij' : undefined;
        events.set(e.id, e); return Response.json(e);
      }
      if (u.searchParams.has('timeMin')) return Response.json({ items: [] });
      const e = events.get(u.pathname.split('/').at(-1)); return e ? Response.json(e) : Response.json({}, { status: 404 });
    }
    throw new Error('Unexpected external request');
  };
  const original = globalThis.fetch; globalThis.fetch = mock;
  const api = async (path, body, owner = true) => {
    const headers = { ...(owner ? { Authorization: 'Bearer test.token' } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) };
    return store.fetch(new Request('https://booking.example' + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined }));
  };
  const create = async () => { const res = await api('/owner/offers', data()); assert.equal(res.status, 201); return res.json(); };
  const process = async code => { const o = store.offers.get('offer:' + code); o.nextRun = Date.now() - 1; await store.alarm(); return o; };
  return { store, storage, sent, events, calls, mock, api, create, process, restore: () => { globalThis.fetch = original; } };
}
test('validation rejects malformed dates, past slots, headers and unavailable in-person option', () => {
  assert.throws(() => validateOffer({ ...data(), slots: [{ key: '2027-02-30', startMin: 0, durMin: 60 }] }));
  assert.throws(() => validateOffer({ ...data(), slots: [{ key: '2020-01-01', startMin: 0, durMin: 60 }] }));
  const offer = { ...validateOffer(data()), status: 'open', expiresAt: Date.now() + DAY };
  assert.throws(() => validateAnswer({ ...answer(), email: 'a@example.com\r\nBcc: other@example.com' }, offer));
  assert.throws(() => validateAnswer({ ...answer(), slot: 10 }, offer));
  assert.throws(() => validateAnswer({ ...answer(), mode: 'inperson' }, { ...offer, venue: '' }));
});
test('recipient remarks are kept, Meet is separate, MIME is plain text and no Google invitation', () => {
  const o = { ...validateOffer(data()), code: randomToken(), answer: { ...answer(), picked: data().slots[0] }, meetLink: 'https://meet.google.com/abc-defg-hij' };
  const body = eventBody(o); assert.equal(body.attendees, undefined); assert.match(body.description, /Zoom/); assert.ok(body.conferenceData);
  const text = mailText(o); assert.match(text, /TaskARE発行のGoogle Meet/); assert.match(text, /先方からの備考/); assert.match(text, /calendar.google.com/);
  o.answer.remarks = '$& <script>alert(1)</script>'; assert.match(mailText(o), /\$& <script>/);
  const raw = Buffer.from(rawMail(o, 'owner@example.com'), 'base64url').toString(); assert.match(raw, /Content-Type: text\/plain/);
  const mimeBody = Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString(); assert.match(mimeBody, /<script>/);
  o.answer.mode = 'inperson'; assert.equal(eventBody(o).conferenceData, undefined);
});
test('encryption authenticates ciphertext and never stores plaintext token', async () => {
  const value = await seal(env.TOKEN_KEY, { refresh: 'secret-token' }); assert.ok(!JSON.stringify(value).includes('secret-token'));
  assert.deepEqual(await unseal(env.TOKEN_KEY, value), { refresh: 'secret-token' });
  value.cipher[0] ^= 1; await assert.rejects(unseal(env.TOKEN_KEY, value));
});
test('request body limits and missing authentication fail closed', async () => {
  await assert.rejects(limitedJson(new Request('https://test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(17000) })));
  await assert.rejects(authenticate(new Request('https://test'), env));
  const denied = await worker.fetch(new Request('https://booking.example/owner/status', { headers: { Origin: 'https://evil.example' } }), env); assert.equal(denied.status, 403);
  const disabled = await worker.fetch(new Request('https://booking.example/owner/status'), { ...env, ENABLED: 'false' }); assert.equal(disabled.status, 503);
});
test('single reservation wins, repeats are idempotent, public reads hide private data', async () => {
  const t = await setup(); try {
    const o = await t.create(); const a = answer();
    const responses = await Promise.all([t.api(`/public/offers/${o.code}/answer`, a, false), t.api(`/public/offers/${o.code}/answer`, answer(), false)]);
    assert.deepEqual(responses.map(r => r.status), [202, 409]);
    assert.equal((await t.api(`/public/offers/${o.code}/answer`, a, false)).status, 200);
    const exposed = await (await t.api('/public/offers/' + o.code, undefined, false)).json();
    for (const key of ['answer', 'email', 'remarks', 'receiptHash', 'meetLink']) assert.equal(exposed[key], undefined);
    assert.equal((await t.api(`/public/offers/${o.code}/receipt`, { receipt: randomToken() }, false)).status, 404);
    assert.equal((await t.api(`/public/offers/${o.code}/receipt`, { receipt: a.receipt }, false)).status, 200);
  } finally { t.restore(); }
});
test('alarm finishes after owner closes app, stable event ID, sends exactly once', async () => {
  const t = await setup(); try {
    const o = await t.create(); await t.api(`/public/offers/${o.code}/answer`, answer(), false);
    const result = await t.process(o.code); assert.equal(result.mail, 'sent'); assert.equal(result.status, 'confirmed');
    assert.equal(t.events.size, 1); assert.equal(t.sent.length, 1); assert.ok(t.calls.some(c => c.url.includes('sendUpdates=none')));
    await t.process(o.code); assert.equal(t.sent.length, 1);
    const res = await (await t.api('/public/offers/' + o.code, undefined, false)).json(); assert.equal(res.meetLink, undefined);
  } finally { t.restore(); }
});
test('Gmail timeout is unknown and never automatically resent after restart', async () => {
  const t = await setup(); try {
    const o = await t.create(); await t.api(`/public/offers/${o.code}/answer`, answer(), false); let count = 0;
    globalThis.fetch = (url, init) => { if (String(url).includes('gmail.googleapis.com')) { count++; throw new Error('timeout'); } return t.mock(url, init); };
    const result = await t.process(o.code); assert.equal(result.mail, 'unknown'); assert.equal(result.nextRun, null);
    await t.process(o.code); assert.equal(count, 1);
    result.mail = 'sending'; result.nextRun = Date.now() - 1; await t.store.saveOffer(result);
    const restarted = new BookingStore({ storage: t.storage, blockConcurrencyWhile: fn => fn() }, env); await restarted.alarm();
    assert.equal(restarted.offers.get('offer:' + o.code).mail, 'unknown'); assert.equal(count, 1);
  } finally { t.restore(); }
});
test('daily mail cap stops without sending or paid fallback', async () => {
  const t = await setup(); try {
    t.store.meta.counters.sends = { bucket: Math.floor(Date.now() / DAY), count: 10 };
    const o = await t.create(); await t.api(`/public/offers/${o.code}/answer`, answer(), false);
    const result = await t.process(o.code); assert.equal(result.error, 'limit_reached'); assert.equal(result.nextRun, null); assert.equal(t.sent.length, 0);
  } finally { t.restore(); }
});
test('Meet pending retries are bounded and event is not duplicated', async () => {
  const t = await setup(); try {
    const o = await t.create(); await t.api(`/public/offers/${o.code}/answer`, answer(), false);
    globalThis.fetch = async (url, init) => {
      const res = await t.mock(url, init);
      if (String(url).includes('/calendar/v3/') && !String(url).includes('timeMin=')) { const body = await res.json(); delete body.hangoutLink; return Response.json(body, { status: res.status }); }
      return res;
    };
    for (let i = 0; i < 6; i++) await t.process(o.code);
    const result = t.store.offers.get('offer:' + o.code); assert.equal(result.status, 'stopped'); assert.equal(result.nextRun, null); assert.equal(t.sent.length, 0); assert.equal(t.events.size, 1);
  } finally { t.restore(); }
});
test('OAuth uses PKCE, verifies owner Google identity and consumes state once', async () => {
  const t = await setup(); try {
    const start = await (await t.api('/owner/connect', {})).json(); const url = new URL(start.url);
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256'); assert.equal(url.searchParams.get('access_type'), 'offline');
    const state = url.searchParams.get('state'); assert.equal(t.store.meta.oauth.stateHash, await hash(state));
    globalThis.fetch = (u, init) => String(u).includes('/userinfo') ? Response.json({ sub: 'another-account', email: 'other@example.com', email_verified: true }) : t.mock(u, init);
    const res = await t.api(`/oauth/callback?code=sample&state=${state}`, undefined, false); assert.equal(res.status, 400);
    assert.equal((await t.api(`/oauth/callback?code=sample&state=${state}`, undefined, false)).status, 403);
    assert.equal(t.store.meta.email, 'owner@example.com');
  } finally { t.restore(); }
});
test('cancel and expiration do not delete existing Google events; retention is bounded', async () => {
  const t = await setup(); try {
    const o = await t.create(); await t.api(`/owner/offers/${o.code}/cancel`, {});
    assert.equal((await t.api(`/public/offers/${o.code}/answer`, answer(), false)).status, 409);
    assert.ok(!t.calls.some(c => c.method === 'DELETE'));
    const record = t.store.offers.get('offer:' + o.code); record.retainUntil = Date.now() - 1; await t.store.alarm(); assert.equal(t.store.offers.size, 0);
  } finally { t.restore(); }
});
test('blocked slots retain their indices and stale forms cannot select them', async () => {
  const t = await setup(); try {
    const o = await t.create(); assert.equal((await t.api(`/owner/offers/${o.code}/block`, { indices: [0] })).status, 200);
    const pub = await (await t.api('/public/offers/' + o.code, undefined, false)).json(); assert.equal(pub.slots[0].unavailable, true);
    assert.equal((await t.api(`/public/offers/${o.code}/answer`, answer(), false)).status, 409);
  } finally { t.restore(); }
});
test('different links cannot reserve overlapping times before Google processes them', async () => {
  const t = await setup(); try {
    const a = await t.create(), b = await t.create();
    assert.equal((await t.api(`/public/offers/${a.code}/answer`, answer(), false)).status, 202);
    assert.equal((await t.api(`/public/offers/${b.code}/answer`, answer(), false)).status, 409);
  } finally { t.restore(); }
});
test('unauthorized identities and redirects do not forward credentials', async () => {
  await assert.rejects(authenticate(new Request('https://booking.example', { headers: { Authorization: 'Bearer sample' } }), env,
    async () => Response.json({ users: [{ localId: 'other', emailVerified: true }] })));
  let calls = 0;
  await assert.rejects(external('https://oauth2.googleapis.com/token', {}, async (_u, init) => {
    calls++; assert.equal(init.redirect, 'manual'); return new Response(null, { status: 302, headers: { Location: 'https://evil.example' } });
  })); assert.equal(calls, 1);
});
test('OAuth succeeds only with matching identity and stores refresh encrypted', async () => {
  const t = await setup(); try {
    const start = await (await t.api('/owner/connect', {})).json();
    const state = new URL(start.url).searchParams.get('state');
    const res = await t.api(`/oauth/callback?code=sample&state=${state}`, undefined, false); assert.equal(res.status, 303);
    assert.equal(res.headers.get('Location'), env.APP_URL + '?bookingConnected=1');
    assert.ok(!JSON.stringify([...t.storage.values]).includes('private-refresh'));
    assert.equal((await unseal(env.TOKEN_KEY, t.store.meta.credentials)).refreshToken, 'private-refresh');
    await t.api('/owner/disconnect', {}); assert.equal(t.store.meta.credentials, undefined);
  } finally { t.restore(); }
});
