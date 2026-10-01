const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Miniflare, convertV4MiniflareOptions } = require('../reminder-worker/node_modules/miniflare');

test('SQLite Durable Object runs in workerd, authentication and OAuth remain private', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: ['worker.mjs', 'core.mjs', 'security.mjs'].map(file => ({ type: 'ESModule', path: path.join(__dirname, file) })),
    modulesRoot: __dirname, compatibilityDate: '2026-09-01',
    durableObjects: { BOOKINGS: { className: 'BookingStore', useSQLite: true } },
    bindings: { ENABLED: 'true', FREE_PLAN_CONFIRMED: 'true', OWNER_UID: 'owner', FIREBASE_API_KEY: 'test-key', GOOGLE_CLIENT_ID: 'test-client',
      GOOGLE_CLIENT_SECRET: 'test-secret', TOKEN_KEY: 'a'.repeat(64), APP_URL: 'https://app.example/task/', PUBLIC_URL: 'https://booking.example' },
    outboundService: async request => {
      if (new URL(request.url).hostname === 'identitytoolkit.googleapis.com') return Response.json({ users: [{ localId: 'owner', emailVerified: true,
        providerUserInfo: [{ providerId: 'google.com', rawId: 'google-owner', email: 'owner@example.com' }] }] });
      throw new Error('External network forbidden in runtime test');
    },
  }));
  try {
    const status = await mf.dispatchFetch('https://booking.example/owner/status', { headers: { Authorization: 'Bearer test.token' } });
    const statusData = await status.json(); assert.equal(status.status, 200, JSON.stringify(statusData)); assert.equal(statusData.connected, false);
    assert.equal((await mf.dispatchFetch('https://booking.example/owner/status')).status, 401);
    const response = await mf.dispatchFetch('https://booking.example/owner/connect', { method: 'POST', headers: { Authorization: 'Bearer test.token', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 200); const body = await response.json(); assert.match(body.url, /^https:\/\/accounts.google.com\//);
    assert.ok(!JSON.stringify(body).includes('test-secret'));
  } finally { await mf.dispose(); }
});
