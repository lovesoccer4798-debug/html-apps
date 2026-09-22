import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwk = privateKey.export({ format: 'jwk' });
const publicKey = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url');
writeFileSync(new URL('./.push-secrets.json', import.meta.url), JSON.stringify({
  PUSH_ADMIN_SECRET: randomBytes(32).toString('hex'), VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: jwk.d,
}, null, 2), { flag: 'wx', mode: 0o600 });
console.log('通知用の鍵を .push-secrets.json に保存しました。内容は共有・コミットしないでください。');
