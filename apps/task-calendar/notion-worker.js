/* Task Calendar — 連携中継（Cloudflare Worker）: Notion ＋ Googleカレンダー常時連携
 *
 * なぜ必要か:
 * - Notion API（api.notion.com）はブラウザから直接呼べない（CORS非対応）→ この Worker が中継
 * - Googleカレンダーの「常時連携」には client_secret が必要で、ブラウザに置けない → この Worker が保持
 *
 * ─ デプロイ手順（無料・カード不要）─
 * 1. https://dash.cloudflare.com/ → Workers & Pages → 既存のWorkerを開く（新規でも可）
 * 2. Edit code でこのファイルの中身をまるごと貼り替えて Deploy
 * 3. Worker の Settings → Variables and Secrets（既存の3つに加えて、Google用に2つ追加）:
 *      NOTION_TOKEN        … Notion のトークン（ntn_xxx）〔既存〕
 *      TC_SHARED_SECRET    … アプリと合わせる合言葉〔既存〕
 *      ALLOW_ORIGIN        … https://lovesoccer4798-debug.github.io 〔既存〕
 *      GOOGLE_CLIENT_ID     … Google Cloud Console の OAuthクライアントID〔新規・Secret〕
 *      GOOGLE_CLIENT_SECRET … 同クライアントの「クライアント シークレット」〔新規・Secret〕
 *        （https://console.cloud.google.com/apis/credentials → 該当のOAuthクライアントを開くと表示）
 * 4. アプリ側の設定は不要（Notion連携のWorker URL・合言葉をそのまま使います）。
 *    アプリの 設定 → Googleカレンダー → 「再連携」を1回すると、以後は自動更新（常時連携）になります。
 *
 * ─ Notion側の準備（初回のみ・設定済みならそのまま）─
 * - https://www.notion.so/my-integrations でトークン取得、DBに接続、プロパティ:
 *      名前（Title）／日付（Date）／日記（Text）／メモ（Text）／できたこと（Number）／就寝（Text）／起床（Text）
 */

const NOTION_VERSION = '2022-06-28';

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-TC-Secret',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'method' }, 405, cors);

    // 合言葉チェック（Worker URLが漏れても勝手に書き込まれないように）
    // 貼り付け時に紛れ込みがちな前後の空白・改行は除去して比較・利用する
    const secret = (env.TC_SHARED_SECRET || '').trim();
    const token = (env.NOTION_TOKEN || '').trim();
    if ((request.headers.get('X-TC-Secret') || '').trim() !== secret) {
      return json({ error: 'unauthorized' }, 401, cors);
    }

    // ─ Googleカレンダー常時連携（トークン交換・自動更新）─
    const path = new URL(request.url).pathname;
    if (path.endsWith('/gcal/exchange') || path.endsWith('/gcal/refresh')) {
      const cid = (env.GOOGLE_CLIENT_ID || '').trim();
      const csec = (env.GOOGLE_CLIENT_SECRET || '').trim();
      if (!cid || !csec) return json({ error: 'gcal-not-configured' }, 501, cors);
      let body2;
      try { body2 = await request.json(); } catch (e) { return json({ error: 'bad-json' }, 400, cors); }
      const form = path.endsWith('/gcal/exchange')
        ? { code: body2.code, client_id: cid, client_secret: csec, redirect_uri: body2.redirectUri, grant_type: 'authorization_code' }
        : { refresh_token: body2.refreshToken, client_id: cid, client_secret: csec, grant_type: 'refresh_token' };
      try {
        const g = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(form),
        });
        const data = await g.json();
        if (!g.ok) return json({ error: 'google-token', status: g.status, detail: data.error || '' }, 502, cors);
        // access_token / refresh_token / expires_in をそのままアプリへ（Workerには保存しない）
        return json({ access_token: data.access_token, refresh_token: data.refresh_token || null, expires_in: data.expires_in || 3600 }, 200, cors);
      } catch (e) {
        return json({ error: 'worker', detail: String(e) }, 500, cors);
      }
    }

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'bad-json' }, 400, cors); }
    const { dbId, date, title, diary, memo, doneCount, bed, wake } = body || {};
    if (!dbId || !date) return json({ error: 'missing dbId/date' }, 400, cors);

    const headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    };

    const props = {
      '名前': { title: [{ text: { content: title || date } }] },
      '日付': { date: { start: date } },
    };
    if (diary != null) props['日記'] = { rich_text: [{ text: { content: String(diary).slice(0, 1900) } }] };
    if (memo != null) props['メモ'] = { rich_text: [{ text: { content: String(memo).slice(0, 1900) } }] };
    if (typeof doneCount === 'number') props['できたこと'] = { number: doneCount };
    if (bed != null) props['就寝'] = { rich_text: [{ text: { content: String(bed) } }] };
    if (wake != null) props['起床'] = { rich_text: [{ text: { content: String(wake) } }] };

    try {
      // 同じ日付のページを検索 → あれば更新、なければ作成（upsert）
      const q = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST', headers,
        body: JSON.stringify({ filter: { property: '日付', date: { equals: date } }, page_size: 1 }),
      });
      if (!q.ok) return json({ error: 'notion-query', status: q.status, detail: await q.text() }, 502, cors);
      const found = (await q.json()).results?.[0];

      let res;
      if (found) {
        res = await fetch(`https://api.notion.com/v1/pages/${found.id}`, {
          method: 'PATCH', headers, body: JSON.stringify({ properties: props }),
        });
      } else {
        res = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST', headers, body: JSON.stringify({ parent: { database_id: dbId }, properties: props }),
        });
      }
      if (!res.ok) return json({ error: 'notion-write', status: res.status, detail: await res.text() }, 502, cors);
      return json({ ok: true, updated: Boolean(found) }, 200, cors);
    } catch (e) {
      return json({ error: 'worker', detail: String(e) }, 500, cors);
    }
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}
