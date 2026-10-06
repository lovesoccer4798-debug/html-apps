import { limitedJson } from '../booking-worker/security.mjs';

import { MODEL, json, fail, validate } from './core.mjs';
const AUTH = 'https://taskare-booking.love-soccer4798.workers.dev/owner/status';
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
    let response;
    try {
      fail(env.APP_ORIGIN === 'https://taskare.pages.dev', 'setup_required', 503);
      fail(!origin || origin === env.APP_ORIGIN, 'origin_denied', 403);
      if (origin) headers['Access-Control-Allow-Origin'] = origin;
      if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' } });
      fail(env.ENABLED === 'true' && env.FREE_PLAN_CONFIRMED === 'true', 'setup_required', 503);
      fail(new URL(request.url).pathname === '/chat' && !new URL(request.url).search, 'not_found', 404);
      fail(request.method === 'POST', 'method_not_allowed', 405);
      const auth = request.headers.get('Authorization'); fail(/^Bearer [\w.-]{1,8192}$/.test(auth || ''), 'unauthorized', 401);
      const data = await limitedJson(request, 20000); validate(data);
      // Delegate identity verification only; no email or booking data is read or forwarded.
      const verified = await fetch(AUTH, { headers: { Authorization: auth, Origin: env.APP_ORIGIN }, redirect: 'manual', signal: AbortSignal.timeout(8000) });
      const authorized = verified.status === 200; await verified.body?.cancel();
      fail(authorized, 'unauthorized', 401);
      response = await env.BUDDY.get(env.BUDDY.idFromName('owner-v1')).fetch(new Request('https://internal/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
    } catch (e) { response = json({ error: e.code || 'unavailable' }, e.status || 503); }
    return new Response(response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...headers } });
  },
};
export class BuddyQuota {
  constructor(ctx, env) { this.storage = ctx.storage; this.env = env; this.tail = Promise.resolve(); }
  fetch(request) {
    const task = this.tail.then(() => this.answer(request)); this.tail = task.catch(() => {}); return task;
  }
  async answer(request) {
    let timer;
    try {
      const messages = validate(await limitedJson(request, 20000));
      const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
      const saved = await this.storage.get('quota');
      const quota = saved?.day === day ? saved : { day, count: 0, last: saved?.last || 0 };
      fail(quota.count < 30 && now - quota.last >= 5000, 'limit_reached', 429);
      // Reserve before inference, including failed calls. Only counters are persisted.
      await this.storage.put('quota', { day, count: quota.count + 1, last: now });
      const result = await Promise.race([
        this.env.AI.run(MODEL, { messages, max_tokens: 512 }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 20000); }),
      ]);
      fail(typeof result?.response === 'string' && result.response.trim(), 'unavailable', 503);
      return json({ reply: result.response.slice(0, 2000) });
    } catch (e) { return json({ error: e.code || 'unavailable' }, e.status || 503); }
    finally { clearTimeout(timer); }
  }
}
