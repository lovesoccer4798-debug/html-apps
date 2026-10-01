import { DAY, LIMITS, BookingError, check, randomToken, tokenValid, hash, validateOffer, validateAnswer,
  slotTime, dateTimes, eventBody, rawMail, publicOffer, receiptOffer } from './core.mjs';
import { limitedJson, seal, unseal, external, authenticate } from './security.mjs';

const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/gmail.send'];
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export function enabled(env) {
  return env.ENABLED === 'true' && env.FREE_PLAN_CONFIRMED === 'true' && env.OWNER_UID && env.FIREBASE_API_KEY
    && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && /^[a-f0-9]{64}$/.test(env.TOKEN_KEY || '')
    && /^https:\/\//.test(env.APP_URL || '') && /^https:\/\//.test(env.PUBLIC_URL || '');
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    let allowed; try { allowed = new URL(env.APP_URL).origin; } catch { return json({ error: 'setup_required' }, 503); }
    if (origin && origin !== allowed) return json({ error: 'origin_denied' }, 403);
    const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' };
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' } });
    let response;
    try {
      check(enabled(env), 'setup_required', 503);
      const url = new URL(request.url);
      check(['GET', 'POST'].includes(request.method), 'method_not_allowed', 405);
      check(url.pathname === '/oauth/callback' || url.search === '', 'invalid_url');
      response = await env.BOOKINGS.get(env.BOOKINGS.idFromName('owner-v1')).fetch(request);
    } catch (e) { response = json({ error: e instanceof BookingError ? e.code : 'unavailable' }, e.status || 503); }
    return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...headers } });
  },
};

export class BookingStore {
  constructor(ctx, env) {
    this.storage = ctx.storage; this.env = env; this.tail = Promise.resolve();
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.meta = await this.storage.get('meta') || { counters: {} };
      this.offers = new Map(await this.storage.list({ prefix: 'offer:', limit: LIMITS.records }));
    });
  }
  serialize(fn) {
    const work = this.tail.then(() => this.ready).then(fn);
    this.tail = work.catch(() => {}); return work;
  }
  async saveMeta() { await this.storage.put('meta', this.meta); }
  async saveOffer(o) { this.offers.set('offer:' + o.code, o); await this.storage.put('offer:' + o.code, o); }
  async consume(kind, limit, period = DAY) {
    const bucket = Math.floor(Date.now() / period);
    const old = this.meta.counters[kind]; const count = old?.bucket === bucket ? old.count : 0;
    check(count < limit, 'limit_reached', 429);
    this.meta.counters[kind] = { bucket, count: count + 1 }; await this.saveMeta();
  }
  async cleanup() {
    for (const [key, o] of this.offers) if (o.retainUntil <= Date.now()) { await this.storage.delete(key); this.offers.delete(key); }
    if (this.meta.oauth?.expires < Date.now()) { delete this.meta.oauth; await this.saveMeta(); }
  }
  async schedule() {
    const times = [...this.offers.values()].flatMap(o => [o.retainUntil, ...(o.nextRun ? [o.nextRun] : [])]);
    if (this.meta.oauth) times.push(this.meta.oauth.expires);
    if (times.length) await this.storage.setAlarm(Math.max(Date.now() + 1000, Math.min(...times)));
    else await this.storage.deleteAlarm();
  }
  fetch(request) {
    return this.serialize(async () => {
      try { return await this.handle(request); }
      catch (e) { return json({ error: e instanceof BookingError ? e.code : 'unavailable' }, e.status || 503); }
    });
  }
  async handle(request) {
    check(enabled(this.env), 'setup_required', 503);
    await this.consume('requests', 600, 3600000);
    await this.cleanup();
    const path = new URL(request.url).pathname;
    if (path === '/oauth/callback' && request.method === 'GET') return this.callback(new URL(request.url));
    if (path.startsWith('/owner/')) {
      const owner = await authenticate(request, this.env);
      if (path === '/owner/status' && request.method === 'GET') return json({ connected: !!this.meta.credentials, email: this.meta.email || '', limits: LIMITS });
      if (path === '/owner/offers' && request.method === 'GET') return json({ offers: [...this.offers.values()].map(o => ({ ...receiptOffer(o),
        slots: o.slots, blockedSlots: o.blockedSlots || [], createdAt: o.createdAt, expiresAt: o.expiresAt, answer: o.answer || null, eventId: o.eventId || '', mailAttempts: o.mailAttempts || 0 })) });
      check(request.method === 'POST', 'method_not_allowed', 405);
      const data = await limitedJson(request);
      if (path === '/owner/connect') return this.connect(owner);
      if (path === '/owner/disconnect') {
        delete this.meta.credentials; delete this.meta.email; delete this.meta.oauth; delete this.meta.sub;
        await this.saveMeta(); return json({ ok: true });
      }
      if (path === '/owner/offers') {
        check(this.meta.credentials, 'connect_required', 409);
        const content = validateOffer(data);
        check(this.offers.size < LIMITS.records, 'storage_limit', 429);
        await this.consume('creates', LIMITS.creates);
        const now = Date.now(); const code = randomToken();
        const o = { ...content, code, createdAt: now, expiresAt: Math.min(now + 7 * DAY, Math.max(...content.slots.map(slotTime))),
          retainUntil: Math.max(...content.slots.map(slotTime)) + 7 * DAY, status: 'open' };
        await this.saveOffer(o); await this.schedule(); return json(publicOffer(o), 201);
      }
      const match = /^\/owner\/offers\/([a-f0-9]{48})\/(cancel|retry|block)$/.exec(path);
      if (match) {
        const o = this.offers.get('offer:' + match[1]); check(o, 'not_found', 404);
        if (match[2] === 'block') {
          check(o.status === 'open', 'already_answered', 409);
          check(Array.isArray(data.indices) && data.indices.length <= 3 && data.indices.every(i => Number.isInteger(i) && o.slots[i]));
          o.blockedSlots = [...new Set([...(o.blockedSlots || []), ...data.indices])];
        } else if (match[2] === 'cancel') {
          check(o.status === 'open', 'already_answered', 409); o.status = 'cancelled';
        } else {
          check(this.meta.credentials, 'connect_required', 409);
          check(['stopped', 'confirmed'].includes(o.status) && o.mail !== 'sent', 'not_retryable', 409);
          check(data.confirm === true, 'confirmation_required');
          check((o.mailAttempts || 0) < LIMITS.resends, 'retry_limit', 429);
          // A deliberate retry is a new bounded processing cycle, never an automatic resend.
          check((o.manualRetries || 0) < 2, 'retry_limit', 429); o.manualRetries = (o.manualRetries || 0) + 1;
          o.attempts = 0; o.mail = 'not_sent'; o.status = 'processing'; o.error = ''; o.nextRun = Date.now() + 1000;
        }
        await this.saveOffer(o); await this.schedule(); return json({ ok: true });
      }
      throw new BookingError('not_found', 404);
    }
    const match = /^\/public\/offers\/([a-f0-9]{48})(?:\/(answer|receipt))?$/.exec(path);
    check(match, 'not_found', 404);
    const o = this.offers.get('offer:' + match[1]); check(o, 'not_found', 404);
    if (!match[2] && request.method === 'GET') return json(publicOffer(o));
    check(request.method === 'POST', 'method_not_allowed', 405);
    const data = await limitedJson(request);
    check(tokenValid(data.receipt), 'invalid_receipt'); const receiptHash = await hash(data.receipt);
    if (match[2] === 'receipt') {
      check(o.receiptHash === receiptHash, 'not_found', 404); return json(receiptOffer(o));
    }
    check(match[2] === 'answer', 'not_found', 404);
    if (o.receiptHash === receiptHash) { await this.schedule(); return json(receiptOffer(o)); }
    check(this.meta.credentials, 'connect_required', 409);
    const answer = validateAnswer(data, o);
    const start = slotTime(answer.picked); const end = start + answer.picked.durMin * 60000;
    check(![...this.offers.values()].some(other => {
      if (other.code === o.code || !other.answer || !(other.status === 'processing' || other.eventId)) return false;
      const a = slotTime(other.answer.picked); const b = a + other.answer.picked.durMin * 60000;
      return start < b && a < end;
    }), 'slot_conflict', 409);
    await this.consume('answers', 30);
    o.answer = answer; o.receiptHash = receiptHash; o.status = 'processing'; o.attempts = 0; o.nextRun = Date.now() + 1000;
    await this.saveOffer(o); await this.schedule(); return json(receiptOffer(o), 202);
  }
  async connect(owner) {
    await this.consume('connects', 5);
    const state = randomToken(); const verifier = randomToken();
    this.meta.oauth = { stateHash: await hash(state), verifier, sub: owner.sub, expires: Date.now() + 10 * 60000 };
    await this.saveMeta(); await this.schedule();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const params = new URLSearchParams({ client_id: this.env.GOOGLE_CLIENT_ID, redirect_uri: this.env.PUBLIC_URL + '/oauth/callback',
      response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent', state,
      code_challenge: challenge, code_challenge_method: 'S256', login_hint: owner.email || '' });
    return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  }
  async callback(url) {
    const pending = this.meta.oauth;
    check(pending && pending.expires > Date.now() && tokenValid(url.searchParams.get('state'))
      && pending.stateHash === await hash(url.searchParams.get('state')), 'invalid_state', 403);
    delete this.meta.oauth; await this.saveMeta();
    try {
      check(!url.searchParams.has('error') && url.searchParams.get('code'), 'authorization_denied');
      const token = await this.tokenRequest({ code: url.searchParams.get('code'), code_verifier: pending.verifier,
        redirect_uri: this.env.PUBLIC_URL + '/oauth/callback', grant_type: 'authorization_code' });
      check(token.refresh_token && SCOPES.filter(s => s.startsWith('https:')).every(s => (token.scope || '').split(' ').includes(s)), 'missing_scope', 403);
      const res = await external('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } });
      check(res.ok, 'identity_failed', 403); const user = await res.json();
      check(user.sub === pending.sub && user.email_verified === true && user.email, 'wrong_google_account', 403);
      this.meta.credentials = await seal(this.env.TOKEN_KEY, { refreshToken: token.refresh_token });
      this.meta.email = user.email; this.meta.sub = user.sub; await this.saveMeta();
      return Response.redirect(this.env.APP_URL + (this.env.APP_URL.includes('?') ? '&' : '?') + 'bookingConnected=1', 303);
    } catch {
      return json({ error: 'google_connection_failed', message: '連携できませんでした。元のTaskAREから再接続してください。' }, 400);
    }
  }
  async tokenRequest(values) {
    const res = await external('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...values, client_id: this.env.GOOGLE_CLIENT_ID, client_secret: this.env.GOOGLE_CLIENT_SECRET }) });
    check(res.ok, 'reconnect_required', 409); const token = await res.json(); check(token.access_token, 'reconnect_required', 409); return token;
  }
  async accessToken() {
    check(this.meta.credentials, 'reconnect_required', 409);
    const credential = await unseal(this.env.TOKEN_KEY, this.meta.credentials);
    return (await this.tokenRequest({ refresh_token: credential.refreshToken, grant_type: 'refresh_token' })).access_token;
  }
  async google(path, token, init = {}) {
    return external('https://www.googleapis.com/calendar/v3/calendars/primary/events' + path, { ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  }
  alarm() {
    return this.serialize(async () => {
      if (!enabled(this.env)) { await this.storage.deleteAlarm(); return; }
      await this.cleanup();
      const o = [...this.offers.values()].find(item => item.nextRun && item.nextRun <= Date.now());
      if (o) await this.process(o);
      await this.schedule();
    });
  }
  async process(o) {
    o.nextRun = null;
    // The persisted pre-send marker is deliberately never retried after eviction/crash.
    if (o.mail === 'sending') { o.mail = 'unknown'; o.status = 'confirmed'; o.error = 'delivery_unknown'; await this.saveOffer(o); return; }
    if (o.mail === 'sent' || o.mail === 'unknown') { await this.saveOffer(o); return; }
    o.attempts = (o.attempts || 0) + 1;
    o.nextRun = Date.now() + 60000; await this.saveOffer(o); await this.schedule();
    try {
      check(o.attempts <= LIMITS.attempts, 'processing_limit', 409);
      check(slotTime(o.answer.picked) > Date.now(), 'past_slot', 409);
      const token = await this.accessToken();
      const id = 't' + o.code;
      let res = await this.google('/' + id, token);
      let event;
      if (res.status === 404) {
        check(!o.eventId, 'event_removed', 409);
        const times = dateTimes(o.answer.picked);
        const p = new URLSearchParams({ timeMin: times.start, timeMax: times.end, singleEvents: 'true', maxResults: '100', showDeleted: 'false' });
        const busyResponse = await this.google('?' + p, token); check(busyResponse.ok, 'calendar_unavailable', 503);
        const busy = await busyResponse.json();
        check(!busy.nextPageToken && !(busy.items || []).some(e => e.status !== 'cancelled' && e.transparency !== 'transparent'), 'slot_conflict', 409);
        res = await this.google('?conferenceDataVersion=1&sendUpdates=none', token, { method: 'POST', body: JSON.stringify(eventBody(o)) });
        if (res.status === 409) res = await this.google('/' + id, token);
      }
      check(res.ok, res.status === 401 || res.status === 403 ? 'reconnect_required' : 'calendar_unavailable', res.status === 401 || res.status === 403 ? 409 : 503);
      event = await res.json();
      check(event.id === id && event.extendedProperties?.private?.taskareBooking === o.code && event.status !== 'cancelled', 'event_mismatch', 409);
      const expected = dateTimes(o.answer.picked);
      check(Date.parse(event.start?.dateTime) === Date.parse(expected.start) && Date.parse(event.end?.dateTime) === Date.parse(expected.end), 'event_changed', 409);
      o.eventId = event.id;
      if (o.answer.mode === 'online') {
        const meet = event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || event.hangoutLink;
        check(event.conferenceData?.createRequest?.status?.statusCode !== 'failure', 'meet_failed', 409);
        if (!meet) throw new BookingError('meet_pending', 503);
        check(/^https:\/\/meet\.google\.com\/[a-z-]+$/.test(meet), 'invalid_meet', 409); o.meetLink = meet;
      }
      o.status = 'confirmed'; o.error = ''; await this.saveOffer(o);
      await this.consume('sends', LIMITS.sends);
      check((o.mailAttempts || 0) < LIMITS.resends, 'retry_limit', 429);
      o.mailAttempts = (o.mailAttempts || 0) + 1; o.mail = 'sending';
      // Schedule recovery before the side effect; alarm redelivery cannot duplicate mail.
      o.nextRun = Date.now() + 60000; await this.saveOffer(o); await this.schedule();
      let mailResponse;
      try {
        mailResponse = await external('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw: rawMail(o, this.meta.email) }) });
        o.mail = mailResponse.ok ? 'sent' : mailResponse.status >= 500 || mailResponse.status === 408 ? 'unknown' : 'failed';
      } catch { o.mail = 'unknown'; }
      o.error = o.mail === 'unknown' ? 'delivery_unknown' : o.mail === 'failed' ? 'delivery_failed' : '';
      o.nextRun = null; await this.saveOffer(o);
    } catch (e) {
      if (o.mail === 'sending') { o.mail = 'unknown'; o.status = 'confirmed'; o.error = 'delivery_unknown'; }
      else {
        o.error = e instanceof BookingError ? e.code : 'temporarily_unavailable';
        const retry = ![400, 409, 429].includes(e.status) && o.attempts < LIMITS.attempts;
        o.status = retry ? 'processing' : 'stopped'; o.nextRun = retry ? Date.now() + 60000 : null;
      }
      await this.saveOffer(o);
    }
  }
}
