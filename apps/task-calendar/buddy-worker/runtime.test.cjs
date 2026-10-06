const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Miniflare, convertV4MiniflareOptions } = require('../reminder-worker/node_modules/miniflare');

test('Buddy SQLite runtime enforces auth and reserves quota even when AI is unavailable', async () => {
  const root = path.resolve(__dirname, '..');
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: ['buddy-worker/worker.mjs', 'buddy-worker/core.mjs', 'booking-worker/core.mjs', 'booking-worker/security.mjs'].map(file => ({ type: 'ESModule', path: path.join(root, file) })),
    modulesRoot: root, compatibilityDate: '2026-09-01',
    durableObjects: { BUDDY: { className: 'BuddyQuota', useSQLite: true } },
    bindings: { ENABLED: 'true', FREE_PLAN_CONFIRMED: 'true', APP_ORIGIN: 'https://taskare.pages.dev' },
    outboundService: async request => {
      assert.equal(request.url, 'https://taskare-booking.love-soccer4798.workers.dev/owner/status');
      assert.equal(request.headers.get('Authorization'), 'Bearer test.token');
      return Response.json({ connected: true });
    },
  }));
  try {
    const init = { method: 'POST', headers: { Authorization: 'Bearer test.token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: true, name: 'Buddy', nickname: '', tone: 'gentle', messages: [{ role: 'user', content: 'こんにちは' }] }) };
    assert.equal((await mf.dispatchFetch('https://buddy.example/chat', { method: 'POST' })).status, 401);
    assert.equal((await mf.dispatchFetch('https://buddy.example/chat', init)).status, 503);
    assert.equal((await mf.dispatchFetch('https://buddy.example/chat', init)).status, 429);
  } finally { await mf.dispose(); }
});
