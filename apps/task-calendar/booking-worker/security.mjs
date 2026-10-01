import { BookingError, check } from './core.mjs';
const encoder = new TextEncoder();
export async function limitedJson(request, max = 16384) {
  check(request.headers.get('Content-Type')?.split(';')[0] === 'application/json', 'content_type', 415);
  check(request.body, 'invalid_body');
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw new BookingError('too_large', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const data = JSON.parse(new TextDecoder().decode(bytes)); check(data && typeof data === 'object' && !Array.isArray(data)); return data; }
  catch { throw new BookingError('invalid_json'); }
}
export async function seal(secret, value) {
  const key = await aesKey(secret); const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode('taskare-booking-v1') }, key, encoder.encode(JSON.stringify(value)));
  return { iv: [...iv], cipher: [...new Uint8Array(cipher)] };
}
export async function unseal(secret, value) {
  const key = await aesKey(secret);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(value.iv), additionalData: encoder.encode('taskare-booking-v1') }, key, new Uint8Array(value.cipher));
  return JSON.parse(new TextDecoder().decode(plain));
}
async function aesKey(secret) {
  check(typeof secret === 'string' && /^[a-f0-9]{64}$/.test(secret), 'setup_required', 503);
  return crypto.subtle.importKey('raw', new Uint8Array(secret.match(/../g).map(b => parseInt(b, 16))), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function external(url, init = {}, fetcher = fetch) {
  const response = await fetcher(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(8000) });
  check(response.status < 300 || response.status >= 400, 'unexpected_redirect', 503);
  return response;
}
export async function authenticate(request, env, fetcher = fetch) {
  const match = /^Bearer ([\w.-]{1,8192})$/.exec(request.headers.get('Authorization') || '');
  check(match, 'unauthorized', 401);
  const res = await external(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: match[1] }),
  }, fetcher);
  check(res.ok, 'unauthorized', 401); const body = await res.json(); const user = body.users?.[0];
  check(user && !user.disabled && user.localId === env.OWNER_UID, 'unauthorized', 401);
  const google = user.providerUserInfo?.find(p => p.providerId === 'google.com');
  check(google?.rawId && user.emailVerified, 'google_login_required', 403);
  return { uid: user.localId, sub: google.rawId, email: google.email };
}
