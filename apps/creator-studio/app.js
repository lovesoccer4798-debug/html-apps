/* Creator Studio — アプリのロジック
 *
 * 設計方針（10年育てるための責務分離）:
 *   DATA      … MEDIA[] / SETTINGS[]。ここに1行足すだけで機能が増える
 *   ICONS     … インラインSVG（CDN非依存）
 *   Store     … 設定の保存/復元「だけ」。他の何も知らない
 *   buildPrompt … 純粋関数（入力→文字列。DOMもStorageも触らない・毎回同じ入力→同じ出力）
 *   UI        … 描画とイベント配線「だけ」。ロジックを持たない
 *
 * この4層は互いに一方向にしか依存しない: UI → (buildPrompt / Store) → DATA
 */

/* ============================================================
 * DATA — ここを増やすだけで機能が増える（UI・保存・生成が自動追従）
 * ========================================================== */

// 媒体: 追加は1エントリ足すだけ。buildPrompt と描画がMEDIAを総なめする
const MEDIA = [
  { id: 'note',    label: 'Note',            icon: 'file-text',    guide: '長文・見出しでじっくり読ませる',
    spec: '長文でよい。見出しと段落で構成し、導入→本文→まとめの流れでじっくり読ませる。' },
  { id: 'x',       label: 'X',               icon: 'hash',         guide: '280字以内・フックを最初に',
    spec: '280字以内。必要なら2〜3個の連投に分ける。最初の1行で強く惹きつける。' },
  { id: 'threads', label: 'Threads',         icon: 'at-sign',      guide: '会話的・短め・親しみやすく',
    spec: '会話するように短めに。親しみやすく、1〜3投稿程度で。' },
  { id: 'reel',    label: 'Instagramリール', icon: 'clapperboard', guide: '台本・フック・キャプション案',
    spec: '動画の台本として。冒頭2秒のフック、話す流れ、最後にキャプション案とハッシュタグ案を添える。' },
];

// 設定: 追加は1エントリ足すだけ。各設定は「プロンプトへの表し方(toPrompt)」を自分で持つ
//        → 設定を足してもロジック側に分岐を増やさなくてよい（拡張点）
const SETTINGS = [
  { id: 'tone',   label: '口調',   type: 'select', options: ['丁寧', 'カジュアル', '専門的', 'フレンドリー'], default: '丁寧',
    toPrompt: v => `口調は${v}。` },
  { id: 'ending', label: '語尾',   type: 'select', options: ['です・ます', 'だ・である', '話し言葉'], default: 'です・ます',
    toPrompt: v => `語尾は「${v}」で統一。` },
  { id: 'target', label: 'ターゲット読者', type: 'text', placeholder: '例：これから副業を始めたい会社員', default: '', full: true,
    toPrompt: v => v ? `想定読者は「${v}」。その人に語りかける。` : '' },
  { id: 'length', label: '文章量', type: 'select', options: ['短め', '中くらい', '長め'], default: '中くらい',
    toPrompt: v => `文章量は${v}。` },
  { id: 'stance', label: '表現の傾向', type: 'select', options: ['論理寄り', 'バランス', '感情寄り'], default: 'バランス',
    toPrompt: v => `表現は${v}で。` },
  { id: 'noEmoji', label: '絵文字を使わない', type: 'toggle', default: true,
    toPrompt: v => v ? '絵文字は一切使わない。' : '' },
  { id: 'humanize', label: 'AI感を減らす（自然な人間の文章にする）', type: 'toggle', default: true,
    toPrompt: v => v ? 'AIっぽい定型表現や過度な言い換えを避け、自然な人間が書いた文章にする。' : '' },
  // ↑ Phase 2の「Output Profile」等もこの配列に1行足すだけで増やせる
];

/* ============================================================
 * ICONS — インラインSVG（currentColorでダーク自動追従・CDN非依存）
 * ========================================================== */
const svg = inner => `<svg class="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  'file-text':    svg('<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
  'hash':         svg('<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>'),
  'at-sign':      svg('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>'),
  'clapperboard': svg('<path d="m12.296 3.464 3.02 3.956"/><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m6.18 5.276 3.1 3.899"/>'),
  'check':        svg('<path d="M20 6 9 17l-5-5"/>'),
};

/* ============================================================
 * Store — 設定の保存/復元だけ。title・bodyは保存しない（信頼境界）
 * ========================================================== */
const Store = {
  KEY: 'creatorStudio.settings.v1',
  defaults() {
    const d = {};
    SETTINGS.forEach(s => { d[s.id] = s.default; });
    return d;
  },
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY) || '{}');
      return { ...this.defaults(), ...saved }; // 未知/欠損キーは既定値で補完（前方互換）
    } catch { return this.defaults(); }
  },
  save(settings) {
    try { localStorage.setItem(this.KEY, JSON.stringify(settings)); } catch { /* 保存不可でも動作は継続 */ }
  },
};

/* ============================================================
 * buildPrompt — 純粋関数（DOM/Storage非依存・ベンダー中立な日本語プロンプト）
 *   入力: { title, body, media(id), settings(オブジェクト) }
 *   出力: どの主要AIにも貼れるプロンプト文字列
 *   ※ 将来の複数媒体同時生成 = 選択media配列を map してこの関数を回すだけ
 * ========================================================== */
function buildPrompt({ title, body, media, settings }) {
  const m = MEDIA.find(x => x.id === media) || MEDIA[0];
  const conditions = SETTINGS
    .map(s => s.toPrompt(settings[s.id]))
    .filter(Boolean); // 空文字（OFF/未入力）は落とす

  return [
    `あなたはプロの${m.label}ライターです。以下の素材をもとに、${m.label}向けの投稿を作成してください。`,
    ``,
    `# タイトル / テーマ`,
    title || '（未入力）',
    ``,
    `# 素材`,
    body || '（未入力）',
    ``,
    `# 媒体の指針（${m.label}）`,
    m.spec,
    ``,
    `# 仕上げの条件`,
    ...conditions.map(c => `- ${c}`),
    ``,
    `上記をふまえ、まず投稿本文だけを出力してください。前置きや解説は不要です。`,
  ].join('\n');
}

/* ============================================================
 * UI — 描画とイベント配線だけ（ロジックは上の層に委譲）
 * ========================================================== */
const $ = sel => document.querySelector(sel);

function renderMedia(container) {
  container.innerHTML = MEDIA.map((m, i) => `
    <label class="media-card">
      <input type="radio" name="media" value="${m.id}" ${i === 0 ? 'checked' : ''}>
      <span class="m-check">${ICONS.check}</span>
      <span class="m-name">${ICONS[m.icon] || ''} ${m.label}</span>
      <span class="m-guide">${m.guide}</span>
    </label>`).join('');
}

function renderSettings(fieldsEl, togglesEl, values) {
  fieldsEl.innerHTML = '';
  togglesEl.innerHTML = '';
  SETTINGS.forEach(s => {
    const v = values[s.id];
    if (s.type === 'toggle') {
      const label = document.createElement('label');
      label.className = 'toggle';
      label.innerHTML = `<input type="checkbox" data-id="${s.id}" ${v ? 'checked' : ''}><span class="track"></span>${s.label}`;
      togglesEl.appendChild(label);
    } else {
      const field = document.createElement('div');
      field.className = 'field' + (s.full ? ' full' : '');
      if (s.type === 'select') {
        const opts = s.options.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('');
        field.innerHTML = `<label>${s.label}</label><select data-id="${s.id}">${opts}</select>`;
      } else {
        field.innerHTML = `<label>${s.label}</label><input type="text" data-id="${s.id}" value="${v ?? ''}" placeholder="${s.placeholder || ''}">`;
      }
      fieldsEl.appendChild(field);
    }
  });
}

// DOMから設定値だけを集める（UIの責務）
function collectSettings() {
  const out = {};
  document.querySelectorAll('[data-id]').forEach(el => {
    out[el.dataset.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return out;
}

function init() {
  const mediaEl = $('#media');
  const fieldsEl = $('#settings-fields');
  const togglesEl = $('#settings-toggles');
  const outEl = $('#out');
  const settings = Store.load();

  renderMedia(mediaEl);
  renderSettings(fieldsEl, togglesEl, settings);

  // 設定変更 → 保存だけ（責務分離: 保存はStoreに委譲）
  document.addEventListener('change', e => {
    if (e.target.matches('[data-id]')) Store.save(collectSettings());
  });

  // 生成 → 純粋関数に渡して結果を表示するだけ
  $('#generate').addEventListener('click', () => {
    const title = $('#title').value.trim();
    const body = $('#body').value.trim();
    if (!title && !body) { outEl.value = '素材（タイトルまたは本文）を入力してください。'; return; }
    outEl.value = buildPrompt({
      title, body,
      media: (document.querySelector('input[name="media"]:checked') || {}).value,
      settings: collectSettings(),
    });
  });

  // コピー（失敗時は手動選択にフォールバック）
  $('#copy').addEventListener('click', async () => {
    if (!outEl.value.trim()) return;
    try {
      await navigator.clipboard.writeText(outEl.value);
      flash($('#copy'), 'コピーしました');
    } catch {
      outEl.select();
      flash($('#copy'), '選択しました（手動でコピー）');
    }
  });
}

function flash(btn, msg) {
  const label = btn.querySelector('.copy-label');
  label.textContent = msg;
  setTimeout(() => { label.textContent = 'コピー'; }, 1400);
}

document.addEventListener('DOMContentLoaded', init);
