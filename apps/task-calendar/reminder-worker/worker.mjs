import { buildPushPayload } from '@block65/webcrypto-web-push';
import '../reminder-core.js';

const R = globalThis.TaskareReminders;
export function validateSubscription(s) {
  let url;
  try { url = new URL(s?.endpoint); } catch { return false; }
  const host = url.hostname;
  return url.protocol === 'https:' && !url.username && !url.password && !url.port && s.endpoint.length < 2048
    && (host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host.endsWith('.push.apple.com'))
    && /^[\w-]{87}$/.test(s.keys?.p256dh || '') && /^[\w-]{22}$/.test(s.keys?.auth || '');
}
export function validateSchedule(entries) {
  return Array.isArray(entries) && entries.length <= 100 && entries.every((a) =>
    a && typeof a.id === 'string' && /^[\w-]{1,100}$/.test(a.id) && typeof a.title === 'string' && a.title.length > 0 && a.title.length <= 80
    && (a.holiday ? Object.hasOwn(R.holidays, a.holiday) : R.parse(a.date))
    && ['once', 'monthly', 'yearly'].includes(a.repeat) && Array.isArray(a.reminders) && a.reminders.length <= 6
    && a.reminders.every((n) => R.offsets.includes(n)));
}
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function send(env, subscription, data) {
  const payload = await buildPushPayload({ data: JSON.stringify(data), options: { ttl: 43200 } }, {
    endpoint: subscription.endpoint, keys: subscription.keys, expirationTime: null,
  }, { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY });
  return fetch(subscription.endpoint, { ...payload, redirect: 'error' });
}
export async function deliver(env, now = new Date(), sender = send) {
  const japan = new Date(+now + 9 * 3600000);
  if (japan.getUTCHours() !== 9) return;
  const today = japan.toISOString().slice(0, 10);
  const schedule = await env.REMINDERS.get('schedule', 'json') || [];
  const due = R.due(schedule, today);
  if (!due.length) return;
  const body = due.slice(0, 4).map((a) => `${a.title}：${a.days ? `あと${a.days}日` : '今日'}`).join('\n') + (due.length > 4 ? `\nほか${due.length - 4}件` : '');
  let cursor;
  do {
    const page = await env.REMINDERS.list({ prefix: 'sub:', limit: 20, ...(cursor ? { cursor } : {}) });
    for (const { name } of page.keys) {
      const marker = `sent:${today}:${name}`;
      if (await env.REMINDERS.get(marker)) continue;
      const sub = await env.REMINDERS.get(name, 'json');
      if (!validateSubscription(sub)) continue;
      try {
        const res = await sender(env, sub, { title: '大切な日のリマインド', body, tag: `taskare-${today}` });
        if (res.ok) await env.REMINDERS.put(marker, '1', { expirationTtl: 172800 });
        else if ([404, 410].includes(res.status)) await env.REMINDERS.delete(name);
        else console.warn('Push delivery failed', res.status);
      } catch { console.warn('Push delivery unavailable'); }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}
export default {
  async fetch(request, env) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    const origin = request.headers.get('Origin');
    if (origin && origin !== env.ALLOW_ORIGIN) return new Response('{}', { status: 403, headers });
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, X-Taskare-Key' } });
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    if (!env.PUSH_ADMIN_SECRET || !env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) return reply({ error: 'Server setup required' }, 503);
    if (request.method !== 'POST' || !request.headers.get('X-Taskare-Key') || await hash(request.headers.get('X-Taskare-Key')) !== await hash(env.PUSH_ADMIN_SECRET)) return reply({ error: 'Unauthorized' }, 401);
    const reader = request.body?.getReader();
    let raw = '', size = 0;
    const decoder = new TextDecoder();
    if (reader) while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 50000) { await reader.cancel(); return reply({ error: 'Too large' }, 413); }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    let data;
    try { data = JSON.parse(raw); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    if (!data || typeof data !== 'object') return reply({ error: 'Invalid body' }, 400);
    const path = new URL(request.url).pathname;
    if (path === '/config') {
      const schedule = await env.REMINDERS.get('schedule');
      return reply({ publicKey: env.VAPID_PUBLIC_KEY, hasSchedule: schedule !== null, fingerprint: await hash(schedule || '[]') });
    }
    if (path === '/schedule') {
      if (!validateSchedule(data.entries)) return reply({ error: 'Invalid schedule' }, 400);
      const previous = await env.REMINDERS.get('schedule') || '[]';
      if (data.fingerprint !== await hash(previous)) return reply({ error: 'Schedule changed on another device' }, 409);
      const next = JSON.stringify(data.entries);
      await env.REMINDERS.put('schedule', next);
      return reply({ ok: true, fingerprint: await hash(next) });
    }
    if (!validateSubscription(data.subscription)) return reply({ error: 'Invalid subscription' }, 400);
    const id = 'sub:' + await hash(data.subscription.endpoint);
    if (path === '/subscribe') {
      const existing = await env.REMINDERS.list({ prefix: 'sub:', limit: 20 });
      if (existing.keys.length >= 10 && !existing.keys.some((k) => k.name === id)) return reply({ error: 'Device limit reached' }, 409);
      await env.REMINDERS.put(id, JSON.stringify(data.subscription));
    } else if (path === '/unsubscribe') await env.REMINDERS.delete(id);
    else if (path === '/test') {
      const res = await send(env, data.subscription, { title: 'TaskAREの通知テスト', body: '大切な日を、忘れないために。', tag: 'taskare-test' });
      if (!res.ok) return reply({ error: 'Push service rejected delivery' }, 502);
    } else return reply({ error: 'Not found' }, 404);
    return reply({ ok: true });
  },
  scheduled(event, env, ctx) { ctx.waitUntil(deliver(env, new Date(event.scheduledTime))); },
};
