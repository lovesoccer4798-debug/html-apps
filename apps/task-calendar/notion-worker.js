/* Task Calendar — Notion連携の中継（Cloudflare Worker）
 *
 * なぜ必要か: Notion API（api.notion.com）はブラウザから直接呼べない（CORS非対応）。
 * この Worker がアプリと Notion の間に立ち、Notionトークンを安全に保持して中継する。
 *
 * ─ デプロイ手順（無料・カード不要）─
 * 1. https://dash.cloudflare.com/ でアカウント作成 → Workers & Pages → Create → Worker
 * 2. このファイルの中身をまるごと貼り付けて Deploy
 * 3. Worker の Settings → Variables and Secrets に3つ登録:
 *      NOTION_TOKEN   … Notion の内部インテグレーションのトークン（secret_xxx）
 *      TC_SHARED_SECRET … アプリと合わせる合言葉（好きな長い文字列。アプリ設定にも同じ値を入れる）
 *      ALLOW_ORIGIN   … https://lovesoccer4798-debug.github.io （アプリの配信元）
 * 4. デプロイURL（https://xxx.workers.dev）をアプリの 設定 → Notion連携 に貼る
 *
 * ─ Notion側の準備 ─
 * - https://www.notion.so/my-integrations で内部インテグレーションを作成 → トークン取得
 * - 記録用のデータベースを作り、右上「…」→「接続」からそのインテグレーションを接続
 * - データベースに次のプロパティを用意（名前は完全一致で）:
 *      名前（Title）／日付（Date）／日記（Text）／メモ（Text）／できたこと（Number）／就寝（Text）／起床（Text）
 * - データベースIDをアプリ設定に貼る（DBを開いたURLの32桁の英数字）
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
