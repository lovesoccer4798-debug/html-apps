'use strict';

/* ========== constants ========== */

const STORAGE_V2 = 'nest.task-calendar.v2';
const STORAGE_V1 = 'nest.task-calendar.v1';
const BASE_TITLE = document.title;
const WD_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WD_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const REPEAT_LABEL = { daily: '毎日', weekday: '平日', weekend: '土日祝', weekly: '毎週', monthly: '毎月', yearly: '毎年' };
function repeatLabelOf(t) {
  if (t && t.repeat === 'weekdays') {
    const days = (t.weekdays || []).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // 月始まり
    return days.length ? days.map((d) => WD_JA[d]).join('') : '毎日';
  }
  return (t && REPEAT_LABEL[t.repeat]) || '毎日';
}
const MAX_MONTH_DOTS = 2;      // handoff: ドットは最大2個+
const UNDO_TOAST_MS = 6000;
const SWIPE_OPEN_PX = 144;     // 編集72px+削除72px
const FOCUS_CIRC = 2 * Math.PI * 120; // index.htmlの r="120" と一致
const RUN_CIRC = 2 * Math.PI * 40;    // 実行中カードの r="40" と一致

/* 設定で選べるアクセント（枠・チェック・ボタンの色）。light/darkはテーマごとの主色 */
const ACCENTS = {
  green:  { name: 'グリーン', light: '#2f9e6e', dark: '#3fb07e', bright: '#4ed99a', ink: '#0e2a1e' },
  teal:   { name: 'ティール', light: '#2b9ea8', dark: '#45b3bd', bright: '#6ed2db', ink: '#082f33' },
  blue:   { name: 'ブルー',   light: '#3d7fd9', dark: '#5b93e0', bright: '#7fb3f0', ink: '#0d2440' },
  purple: { name: 'パープル', light: '#7c6bd9', dark: '#9184e0', bright: '#afa3f0', ink: '#201a45' },
  orange: { name: 'オレンジ', light: '#d9822b', dark: '#e09a4a', bright: '#f0b36e', ink: '#3a2408' },
  pink:   { name: 'ピンク',   light: '#d95b8a', dark: '#e07aa3', bright: '#f09ec0', ink: '#40122a' },
  red:    { name: 'レッド',   light: '#d6453f', dark: '#e0665f', bright: '#f08a86', ink: '#3f0d0b' },
  yellow: { name: 'イエロー', light: '#b8901a', dark: '#d0aa38', bright: '#e8c96a', ink: '#3a2c05' },
  indigo: { name: 'インディゴ', light: '#4a56c0', dark: '#6b76d8', bright: '#8f98e8', ink: '#12163f' },
};

const ICON_ATTRS = 'class="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
/* Lucide icons, inlined per docs/design-guide.md (no CDN) */
const ICONS = {
  check: `<svg ${ICON_ATTRS}><path d="M20 6 9 17l-5-5"/></svg>`,
  plus: `<svg ${ICON_ATTRS}><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  play: `<svg ${ICON_ATTRS}><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`,
  pause: `<svg ${ICON_ATTRS}><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>`,
  clock: `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  trash: `<svg ${ICON_ATTRS}><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  pencil: `<svg ${ICON_ATTRS}><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`,
  repeat: `<svg ${ICON_ATTRS}><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
  calendar: `<svg ${ICON_ATTRS}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,
  sprout: `<svg ${ICON_ATTRS}><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>`,
  maximize: `<svg ${ICON_ATTRS}><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>`,
  copy: `<svg ${ICON_ATTRS}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  search: `<svg ${ICON_ATTRS}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  sun: `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  heart: `<svg ${ICON_ATTRS}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  cake: `<svg ${ICON_ATTRS}><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>`,
  party: `<svg ${ICON_ATTRS}><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98-.7.11-1.22.72-1.22 1.43V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>`,
  moon: `<svg ${ICON_ATTRS}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  sunMoon: `<svg ${ICON_ATTRS}><path d="M12 8a2.828 2.828 0 1 0 4 4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  mapPin: `<svg ${ICON_ATTRS}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  users: `<svg ${ICON_ATTRS}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  sparkles: `<svg ${ICON_ATTRS}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
  video: `<svg ${ICON_ATTRS}><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`,
};

/* ========== persistent data ========== */

function defaultDb() {
  return { tasks: [], events: [], notes: {}, routines: [], goals: {}, sleep: {}, dayLogs: {}, calendars: [{ id: 'c-default', name: 'マイカレンダー', color: 'green', order: 0 }], boards: [], boardItems: [], sharedJoined: [], sharedCache: {}, people: [], anniversaries: [], colorRules: [], packages: [], periodNotes: {}, settings: { theme: 'auto', accent: 'green', font: 'gothic', monthStyle: 'dots', fontSize: 'large', calendarFilter: 'all', sleepMode: 'evening', zoomLock: true, timerNotify: false, styleVariant: 'round', monthEdge: false, stickyHeader: true, monthHideRoutines: false, invertEvents: false, userName: '', senderName: '', notion: { url: '', secret: '', dbId: '', on: false } }, running: null };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_V2);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...defaultDb(), ...data, settings: { ...defaultDb().settings, ...(data.settings || {}) } };
    }
    const v1raw = localStorage.getItem(STORAGE_V1);
    if (v1raw) { // v1からの移行（v1キーは残す）
      const v1 = JSON.parse(v1raw);
      const db = defaultDb();
      if (Array.isArray(v1.tasks)) db.tasks = v1.tasks.map((t) => ({ time: null, ...t }));
      return db;
    }
  } catch (err) {
    console.warn('Task Calendar: failed to load, starting empty', err);
  }
  return defaultDb();
}

let db = loadDb(); // バックアップ復元でまるごと入れ替えることがあるため let
if (!Array.isArray(db.calendars) || db.calendars.length === 0) {
  db.calendars = [{ id: 'c-default', name: 'マイカレンダー', color: 'green', order: 0 }];
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_V2, JSON.stringify(db));
  } catch (err) {
    console.warn('Task Calendar: failed to save', err); // keep working in-memory
  }
}
function save() {
  db.updatedAt = Date.now();
  persistLocal();
  scheduleCloudPush(); // ログイン中ならクラウドへも（デバウンス）
  scheduleSharedPush(); // 共有カレンダーの変更も（デバウンス・差分があるときだけ書く）
  scheduleNotionPush(); // Notion連携ONなら今日の分を（デバウンス）
  scheduleMeetSync(); // 予約リンクの候補から、埋まった枠を外す（デバウンス）
}

/* ========== ui state (not persisted) ========== */

const ui = {
  screen: 'cal',            // 'cal' | 'insights' | 'settings'
  prevScreen: 'cal',
  view: 'day',              // 'day' | 'week' | 'grid' | 'month' | 'year'
  gridDays: 3,              // 時間割ビューの日数（1 | 3 | 7）
  cursor: new Date(),
  selectedKey: null,        // month view: selected date key
  selectedItemId: null,     // accent-framed item
  justToggledId: null,
  justAddedId: null,
  sheetType: 'task',
  schedMode: false,         // スケジュール調整モード（時間割で空き枠を選ぶ）
  schedSlots: [],           // [{key, startMin, durMin}] 最大3つ
  schedDur: 60,             // 候補1枠の長さ（分）
  schedMeet: false,         // 確定時にMeet発行するか
  schedEditCode: null,      // 変更中の予約リンクのコード（発行済みの再編集）
  editing: null,            // {ref, kind, key} while edit sheet is open
  confirmTarget: null,      // recurring occurrence pending delete
  insightsPeriod: 'week',   // 振り返りの期間: 'week' | 'month' | 'year'
  routineTab: 'routines',   // ルーティンタブ内: 'routines' | 'vision'
  vbFileTarget: null,       // 写真ピッカーの投入先
  vbSlotTarget: null,       // 差し替え/削除の対象アイテム
};

/* ========== date helpers (local timezone) ========== */

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function startOfWeekMon(d) { return addDays(d, -((d.getDay() + 6) % 7)); } // handoffは月曜はじまり
/* 日本の祝日（主要な固定・ハッピーマンデー・春分秋分の近似式＋振替休日） */
function jpHolidayBase(d) {
  const y = d.getFullYear(); const m = d.getMonth() + 1; const day = d.getDate(); const w = d.getDay();
  const nthMon = (n) => w === 1 && Math.ceil(day / 7) === n;
  const shunbun = Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  const shubun = Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  return (m === 1 && day === 1) || (m === 2 && (day === 11 || day === 23)) || (m === 4 && day === 29)
    || (m === 5 && day >= 3 && day <= 5) || (m === 8 && day === 11) || (m === 11 && (day === 3 || day === 23))
    || (m === 1 && nthMon(2)) || (m === 7 && nthMon(3)) || (m === 9 && nthMon(3)) || (m === 10 && nthMon(2))
    || (m === 3 && day === shunbun) || (m === 9 && day === shubun);
}
function isJpHoliday(d) {
  if (jpHolidayBase(d)) return true;
  return d.getDay() === 1 && jpHolidayBase(addDays(d, -1)); // 振替休日
}
function dayColorClass(d) {
  if (d.getDay() === 0 || isJpHoliday(d)) return ' sun';
  if (d.getDay() === 6) return ' sat';
  return '';
}
function todayKey() { return toKey(new Date()); }

/* ========== occurrences（繰り返しの展開） ========== */

function occursOn(t, key) {
  if (t.routineId) { // 一時停止中のルーティンのタスクは pausedFrom 以降出さない
    const r = db.routines.find((x) => x.id === t.routineId);
    if (r && r.pausedFrom && key >= r.pausedFrom) return false;
    if (r && r.periodStart && key < r.periodStart) return false; // プロジェクト期間の外は出さない
    if (r && r.periodEnd && key > r.periodEnd) return false;
  }
  if (!t.repeat) return t.date === key;
  if (key < t.startDate || (t.exDates || []).includes(key)) return false;
  if (t.repeatEnd && key > t.repeatEnd) return false; // 「今日以降を止める」ときの終了カットオフ（過去は残す）
  const d = fromKey(key);
  const s = fromKey(t.startDate);
  if (t.repeat === 'daily') return true;
  if (t.repeat === 'weekday') return d.getDay() >= 1 && d.getDay() <= 5 && !isJpHoliday(d); // 平日（土日祝を除く・祝日は自動）
  if (t.repeat === 'weekend') return d.getDay() === 0 || d.getDay() === 6 || isJpHoliday(d); // 土日祝（祝日は自動反映）
  if (t.repeat === 'weekdays') return (t.weekdays || []).includes(d.getDay()); // 選んだ曜日だけ（出勤/休みなど）
  if (t.repeat === 'weekly') return d.getDay() === s.getDay();
  if (t.repeat === 'monthly') return d.getDate() === s.getDate(); // 31日など存在しない月は自然にスキップ
  if (t.repeat === 'yearly') return d.getDate() === s.getDate() && d.getMonth() === s.getMonth();
  return false;
}
function taskDoneOn(t, key) { return t.repeat ? Boolean((t.doneDates || {})[key]) : Boolean(t.done); }
function taskDoneAt(t, key) { return t.repeat ? (t.doneDates || {})[key] || null : t.doneAt; }
// 時刻は「日ごと（timeDates）＞マスタ（time）」。繰り返しは日別に独立、単発はそのまま
function timeOn(r, key) { return (r.repeat ? (r.timeDates || {})[key] : null) ?? r.time ?? ''; }
function timeEndOn(r, key) { return (r.repeat ? (r.timeEndDates || {})[key] : null) ?? r.timeEnd ?? null; }
function minutesOn(r, key) { return (r.repeat ? (r.minutesDates || {})[key] : null) ?? r.minutes ?? null; } // タイマー時間も日別に独立可
const MAX_CALENDARS = 8; // 仕様§7: 色の見分けとチップ視認性の上限

function allFilterIds() {
  const ids = db.calendars.map((c) => c.id);
  for (const code of db.sharedJoined) ids.push(SH_PREFIX + code);
  if (db.routines.length) ids.push('routine');
  if (gcalConnected()) ids.push('gcal');
  return ids;
}
function passFilter(it) {
  const f = db.settings.calendarFilter;
  if (!f || f === 'all') return true;
  if (it.kind === 'gcal') return f.includes('gcal');
  if (it.ref.routineId) return f.includes('routine'); // タスク・予定どちらのルーティンも「ルーティン」フィルタ
  return f.includes(it.ref.calendarId || 'c-default');
}
function toggleFilter(id) {
  const all = allFilterIds();
  let f = db.settings.calendarFilter;
  if (id === 'all') f = 'all';
  else if (f === 'all') f = all.filter((x) => x !== id);
  else if (f.includes(id)) f = f.filter((x) => x !== id);
  else f = [...f, id];
  if (Array.isArray(f) && (f.length === 0 || all.every((x) => f.includes(x)))) f = 'all'; // 全解除は「すべて」へ復帰（真っ白防止）
  db.settings.calendarFilter = f;
  save();
  renderAll();
}

/* 予定表モード等で使う色: 自分の色 > ルーティンの色 > なし */
function itemColor(it) {
  const pick = (id) => (ACCENTS[id] || ACCENTS.green)[effectiveDark() ? 'dark' : 'light'];
  if (it.kind === 'gcal') return pick('blue');
  if (it.ref.color) return pick(it.ref.color);
  if (it.ref.routineId) {
    const r = db.routines.find((x) => x.id === it.ref.routineId);
    if (r) return pick(r.color);
  }
  const calId = it.ref.calendarId;
  if (isSharedCal(calId)) {
    const c = db.sharedCache[calId.slice(SH_PREFIX.length)];
    return pick((c && c.color) || 'blue');
  }
  if (calId && calId !== 'c-default') {
    const cal = db.calendars.find((x) => x.id === calId);
    if (cal) return pick(cal.color);
  }
  return null;
}
// 月ビューの「縁（枠線）」の色。人・意味ルール（colorRules）に一致すればその色、
// なければ「フチをはっきり」ONのとき黒っぽい縁。ローカル設定なので共有相手の画面には出ない。
function itemEdgeColor(it) {
  const rules = db.colorRules || [];
  if (rules.length) {
    const hay = `${it.title || ''} ${((it.ref && it.ref.who) || []).join(' ')}`;
    const rule = rules.find((r) => r.label && hay.includes(r.label));
    if (rule) return (ACCENTS[rule.color] || ACCENTS.green)[effectiveDark() ? 'dark' : 'light'];
  }
  if (db.settings.monthEdge) return effectiveDark() ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.42)';
  return null;
}
// 「月」カレンダーに表示するか（個別の予定・タスク、またはそのルーティンの設定で隠せる。一覧・他ビューには残る）
function showInMonth(it) {
  if (it.ref && it.ref.hideMonth) return false;
  if (it.ref && it.ref.routineId) {
    const r = db.routines.find((x) => x.id === it.ref.routineId);
    if (r && r.hideMonth) return false;
    if (db.settings.monthHideRoutines) return false; // 「月」でルーティンをまとめて隠す（クイック切替）
  }
  return true;
}
function memoFor(it) {
  const r = it.ref;
  if (r.repeat) return (r.memoDates || {})[it.key] ?? r.memo ?? null;
  return r.memo || null;
}
function diaryFor(it) {
  const r = it.ref;
  if (r.repeat) return (r.diaryDates || {})[it.key] ?? r.diary ?? null;
  return r.diary || null;
}

// 複数日にまたがる予定（旅行・帰省など。endDate指定・繰り返しなし）が key を含むか
function eventCoversDay(e, key) {
  if (e.repeat || !e.endDate || e.endDate <= e.date) return false;
  return key >= e.date && key <= e.endDate;
}
// 複数日予定の位置情報（開始/終了か・何日目/全何日）
function eventSpan(e, key) {
  const start = fromKey(e.date);
  const end = fromKey(e.endDate);
  const dayCount = Math.round((end - start) / 86400000) + 1;
  const dayIndex = Math.round((fromKey(key) - start) / 86400000) + 1;
  return { isStart: key === e.date, isEnd: key === e.endDate, dayIndex, dayCount };
}

function itemsFor(key) {
  const items = [];
  for (const t of db.tasks) {
    if (!occursOn(t, key)) continue;
    items.push({ kind: 'task', id: `${t.id}@${key}`, ref: t, key, title: t.title, time: timeOn(t, key), timeEnd: timeEndOn(t, key), minutes: minutesOn(t, key), repeat: t.repeat || null, done: taskDoneOn(t, key) });
  }
  for (const e of db.events) {
    const multi = eventCoversDay(e, key);
    if (!multi && !occursOn(e, key)) continue; // 予定も繰り返し対応（単発は date、繰り返しは repeat+startDate、複数日は date〜endDate）
    const span = multi ? eventSpan(e, key) : null;
    const showTime = !span || span.isStart; // 複数日は開始日だけ時刻を表示（TimeTree風）
    items.push({ kind: 'event', id: `${e.id}@${key}`, ref: e, key, title: e.title, time: showTime ? timeOn(e, key) : '', timeEnd: showTime ? timeEndOn(e, key) : null, minutes: null, repeat: e.repeat || null, done: false, span });
  }
  items.push(...gcalItemsFor(key)); // Googleカレンダーの予定（連携ON時のみ・読み取り専用）
  return items.sort((a, b) => {
    const as = a.span ? 0 : 1;
    const bs = b.span ? 0 : 1;
    if (as !== bs) return as - bs; // 複数日（旅行など）は終日予定のように上に
    return (a.time || '99:99').localeCompare(b.time || '99:99') || (a.ref.createdAt || 0) - (b.ref.createdAt || 0);
  });
}
function tasksStatsFor(key) {
  const tasks = itemsFor(key).filter((i) => i.kind === 'task');
  return { total: tasks.length, done: tasks.filter((i) => i.done).length };
}

/* ========== dom ========== */

const $ = (sel) => document.querySelector(sel);
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ========== theme & accent ========== */

function effectiveDark() {
  const t = db.settings.theme;
  return t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}
function applyTheme() {
  const t = db.settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  applyAccent();
  updateThemeToggle();
}
// ヘッダーのテーマ切替（どの画面からでも 自動→ライト→ダーク を巡回）
const THEME_CYCLE = ['auto', 'light', 'dark'];
const THEME_ICON = { auto: 'sunMoon', light: 'sun', dark: 'moon' };
const THEME_LABEL = { auto: '自動', light: 'ライト', dark: 'ダーク' };
function updateThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const t = db.settings.theme || 'auto';
  btn.innerHTML = ICONS[THEME_ICON[t] || 'sunMoon'];
  btn.setAttribute('aria-label', `テーマ切替（今: ${THEME_LABEL[t]}）`);
}
function applyAccent() {
  const a = ACCENTS[db.settings.accent] || ACCENTS.green;
  const rs = document.documentElement.style;
  if (db.settings.accent === 'green') { // 既定色はtokens.cssのテーマ切替に任せる
    rs.removeProperty('--tc-accent');
    rs.removeProperty('--tc-accent-bright');
    rs.removeProperty('--tc-accent-ink');
    return;
  }
  rs.setProperty('--tc-accent', effectiveDark() ? a.dark : a.light);
  rs.setProperty('--tc-accent-bright', a.bright);
  rs.setProperty('--tc-accent-ink', a.ink);
}
/* 端末にその書体（日本語）が入っているかの目安。document.fonts.check が使えない環境では判定しない */
const FONT_PROBES = {
  rounded: ['Hiragino Maru Gothic ProN', 'HGMaruGothicMPRO', 'BIZ UDGothic'],
  mincho: ['Hiragino Mincho ProN', 'Yu Mincho', 'BIZ UDMincho', 'Noto Serif CJK JP', 'Noto Serif JP', 'MS PMincho'],
  mono: ['Osaka-Mono', 'Noto Sans Mono CJK JP', 'MS Gothic'],
};
function fontMissing(opt) {
  const probes = FONT_PROBES[opt];
  if (!probes || !document.fonts || !document.fonts.check) return false;
  try {
    return probes.every((f) => !document.fonts.check(`12px "${f}"`));
  } catch (err) {
    return false;
  }
}

function applySize() {
  const v = db.settings.fontSize;
  if (!v || v === 'large') delete document.documentElement.dataset.fontsize;
  else document.documentElement.dataset.fontsize = v;
}
function applyFont() {
  if (!db.settings.font || db.settings.font === 'gothic') delete document.documentElement.dataset.font;
  else document.documentElement.dataset.font = db.settings.font;
}
function applyStyle() { // スタイル変更（まる/カクカク/くっきり）
  const s = db.settings.styleVariant;
  if (!s || s === 'round') delete document.documentElement.dataset.style;
  else document.documentElement.dataset.style = s;
}
function applyZoomLock() { // 固定=ピンチ/入力フォーカス時の勝手なズームを止める
  const vp = document.getElementById('tc-viewport');
  if (!vp) return;
  const locked = db.settings.zoomLock !== false;
  vp.setAttribute('content', locked
    ? 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    : 'width=device-width, initial-scale=1, viewport-fit=cover');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyAccent(); });

/* ========== undo toast ========== */

let toastTimer = null;
let undoAction = null;
function flashToast(text) { // 取り消し不要のお知らせ
  $('#toast-text').textContent = text;
  $('#toast-undo').hidden = true;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4000);
}
function showUndoToast(text, onUndo) {
  $('#toast-undo').hidden = false;
  $('#toast-text').textContent = text;
  undoAction = onUndo;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, UNDO_TOAST_MS);
}
function hideToast() {
  $('#toast').hidden = true;
  undoAction = null;
  clearTimeout(toastTimer);
}
$('#toast-undo').addEventListener('click', () => {
  if (undoAction) undoAction();
  hideToast();
});

/* ========== swipe（左スライドで編集／削除） ========== */

let openSwipeEl = null;
function closeOpenSwipe() {
  if (!openSwipeEl) return;
  openSwipeEl.querySelector('.swipe-content').style.transform = '';
  openSwipeEl = null;
}
function makeSwipe(item, { onEdit, onDelete }) {
  const wrap = el('div', 'swipe');
  const actions = el('div', 'swipe-actions');
  const editBtn = el('button', 'swipe-act edit');
  editBtn.type = 'button';
  editBtn.innerHTML = `${ICONS.pencil}<span>編集</span>`;
  editBtn.addEventListener('click', () => { closeOpenSwipe(); onEdit(); });
  const delBtn = el('button', 'swipe-act del');
  delBtn.type = 'button';
  delBtn.innerHTML = `${ICONS.trash}<span>削除</span>`;
  delBtn.addEventListener('click', () => { closeOpenSwipe(); onDelete(); });
  actions.append(editBtn, delBtn);

  const content = el('div', 'swipe-content');
  content.append(item);
  wrap.append(actions, content);

  let startX = 0;
  let startY = 0;
  let base = 0;
  let dragging = false;
  let horizontal = false;

  content.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    startX = e.clientX;
    startY = e.clientY;
    base = openSwipeEl === wrap ? -SWIPE_OPEN_PX : 0;
    dragging = true;
    horizontal = false;
    if (openSwipeEl && openSwipeEl !== wrap) closeOpenSwipe();
  });
  content.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!horizontal) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return; // 縦スクロールを優先
      horizontal = true;
      content.setPointerCapture(e.pointerId);
      content.style.transition = 'none';
    }
    const x = Math.min(0, Math.max(-SWIPE_OPEN_PX - 24, base + dx));
    content.style.transform = `translateX(${x}px)`;
  });
  const finish = (e) => {
    if (!dragging) return;
    dragging = false;
    if (!horizontal) return;
    content.style.transition = '';
    const dx = e.clientX - startX;
    const open = base + dx < -SWIPE_OPEN_PX / 2;
    content.style.transform = open ? `translateX(${-SWIPE_OPEN_PX}px)` : '';
    openSwipeEl = open ? wrap : (openSwipeEl === wrap ? null : openSwipeEl);
    content.dataset.suppressClick = '1'; // スワイプ直後の誤タップを防ぐ
    setTimeout(() => { delete content.dataset.suppressClick; }, 80);
  };
  content.addEventListener('pointerup', finish);
  content.addEventListener('pointercancel', finish);
  content.addEventListener('click', (e) => {
    if (content.dataset.suppressClick) { e.stopPropagation(); return; }
    if (openSwipeEl === wrap) { closeOpenSwipe(); e.stopPropagation(); }
  }, true);

  return wrap;
}

/* ========== item operations ========== */

// タイマーで実行したタスクを完了した時、実際に動かした時間に忠実に時刻を記録
// 終了＝完了した実時刻、開始＝タイマーを始めた実時刻（どちらも最寄りの5分に丸め）、
// タイマー時間＝その差（超過ぶんも自然に反映）。既に時刻が入っていても上書きする（繰り返しは日別に独立）
function autoFillTimerTime(t, key, r) {
  if (!r) return;
  const now = Date.now();
  const startedAt = r.startedAt || (r.endAt ? r.endAt - r.totalMs : now - (r.totalMs || 0));
  const round5 = (ms) => {
    const d = new Date(ms);
    const m = d.getHours() * 60 + Math.round(d.getMinutes() / 5) * 5;
    return Math.max(0, Math.min(1439, m));
  };
  const endMin = round5(now);
  let startMin = round5(startedAt);
  if (startMin >= endMin) startMin = Math.max(0, endMin - 5); // 最低5分は確保
  const dur = endMin - startMin;
  const perDay = Boolean(t.repeat);
  setPerDayField(t, 'time', 'timeDates', key, tgMinToStr(startMin), perDay);
  setPerDayField(t, 'timeEnd', 'timeEndDates', key, tgMinToStr(endMin), perDay);
  setPerDayField(t, 'minutes', 'minutesDates', key, dur, perDay); // タイマー時間も実績に
}

function toggleItem(it) {
  if (sharedBlocked(it.ref.calendarId)) return;
  const t = it.ref;
  if (t.repeat) {
    t.doneDates = t.doneDates || {};
    if (t.doneDates[it.key]) delete t.doneDates[it.key];
    else t.doneDates[it.key] = Date.now();
  } else {
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : null;
  }
  // タイマー実行中／実行済みのタスクを完了にしたら時刻を自動記録
  if (taskDoneOn(t, it.key) && db.running && db.running.taskId === t.id && db.running.dateKey === it.key) {
    autoFillTimerTime(t, it.key, db.running);
  }
  ui.justToggledId = taskDoneOn(t, it.key) ? it.id : null;
  save();
  renderAll();
  ui.justToggledId = null;
}

function deleteItem(it) {
  if (sharedBlocked(it.ref.calendarId)) return;
  if (it.ref.repeat) { // 繰り返し（タスク・予定とも）は「この回のみ／すべて」を選ぶ
    ui.confirmTarget = it;
    $('#confirm-name').textContent = `「${it.title}」（${REPEAT_LABEL[it.ref.repeat]}）`;
    $('#confirm-scrim').hidden = false;
    return;
  }
  const arr = it.kind === 'event' ? db.events : db.tasks;
  const index = arr.indexOf(it.ref);
  const gcalId = it.kind === 'event' ? it.ref.gcalId : null;
  arr.splice(index, 1);
  save(); renderAll();
  if (gcalId) gcalDeleteEvent(gcalId); // Google側からも削除（元に戻すと再作成される）
  showUndoToast(`「${it.title}」を削除しました`, () => {
    arr.splice(Math.min(index, arr.length), 0, it.ref);
    if (gcalId && it.ref.pushGoogle && gcalCanWrite()) { delete it.ref.gcalId; gcalSyncEvent(it.ref, it.ref.date, false); }
    save(); renderAll();
  });
}

$('#del-one').addEventListener('click', () => {
  const it = ui.confirmTarget;
  closeConfirm();
  if (!it) return;
  it.ref.exDates = it.ref.exDates || [];
  it.ref.exDates.push(it.key);
  save(); renderAll();
  showUndoToast('この回のみ削除しました', () => {
    it.ref.exDates = it.ref.exDates.filter((k) => k !== it.key);
    save(); renderAll();
  });
});
$('#del-all').addEventListener('click', () => {
  const it = ui.confirmTarget;
  closeConfirm();
  if (!it) return;
  const arr = it.kind === 'event' ? db.events : db.tasks;
  const index = arr.indexOf(it.ref);
  arr.splice(index, 1);
  save(); renderAll();
  showUndoToast(`「${it.title}」の繰り返しを削除しました`, () => {
    arr.splice(Math.min(index, arr.length), 0, it.ref);
    save(); renderAll();
  });
});
$('#del-cancel').addEventListener('click', closeConfirm);
function closeConfirm() {
  $('#confirm-scrim').hidden = true;
  ui.confirmTarget = null;
}
$('#confirm-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeConfirm(); });

/* ========== item card ========== */

function checkButton(it) {
  const btn = el('button', 'check');
  btn.type = 'button';
  btn.setAttribute('role', 'checkbox');
  btn.setAttribute('aria-checked', String(it.done));
  btn.setAttribute('aria-label', it.done ? `「${it.title}」を未完了に戻す` : `「${it.title}」を完了にする`);
  btn.innerHTML = ICONS.check;
  if (it.id === ui.justToggledId) btn.classList.add('pop');
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggleItem(it); });
  return btn;
}

function buildItemCard(it, { compact = false, showTime = false } = {}) {
  const card = el('div', `item is-${it.kind}${it.done ? ' is-done' : ''}${ui.selectedItemId === it.id ? ' is-selected' : ''}`);
  if (it.id === ui.justAddedId) card.classList.add('rise');

  if (it.kind === 'task') {
    card.append(checkButton(it));
  } else {
    const mark = el('span', 'event-mark');
    mark.innerHTML = ICONS.calendar;
    card.append(mark);
  }

  const main = el('div', 'item-main');
  main.append(el('span', 'item-title', it.title));
  if (it.kind === 'event' && it.ref.endDate && it.ref.endDate > it.ref.date) { // 複数日予定は期間を表示
    const s = fromKey(it.ref.date);
    const e2 = fromKey(it.ref.endDate);
    const range = el('span', 'item-span');
    range.innerHTML = ICONS.calendar;
    range.append(` ${s.getMonth() + 1}/${s.getDate()}〜${e2.getMonth() + 1}/${e2.getDate()}`);
    main.append(range);
  }
  const memo = memoFor(it);
  if (memo && !compact) main.append(el('span', 'item-memo', memo));
  if (it.kind === 'event' && !compact && (it.ref.place || (it.ref.who || []).length || (it.time && it.timeEnd))) {
    const meta = el('span', 'item-meta'); // 時間・誰と・どこで（日記的な記録）
    if (it.time && it.timeEnd) {
      const tm = el('span', 'meta-bit mono');
      tm.innerHTML = ICONS.clock;
      tm.append(` ${it.time}〜${it.timeEnd}`);
      meta.append(tm);
    }
    if ((it.ref.who || []).length) {
      const w = el('span', 'meta-bit');
      w.innerHTML = ICONS.users;
      w.append(` ${it.ref.who.join('、')}`);
      meta.append(w);
    }
    if (it.ref.place) {
      const pl = el('span', 'meta-bit');
      pl.innerHTML = ICONS.mapPin;
      pl.append(` ${it.ref.place}`);
      meta.append(pl);
    }
    main.append(meta);
  }
  card.append(main);

  const ownColor = itemColor(it);
  if (ownColor) { // 自分の色 or ルーティン色のタグ
    const dot = el('span', 'routine-dot');
    dot.style.background = ownColor;
    card.append(dot);
  }
  if (it.kind === 'event') card.append(el('span', 'chip', '予定'));
  if (it.kind === 'gcal') card.append(el('span', 'chip', 'Google'));
  if (showTime && it.time) {
    const c = el('span', 'chip mono');
    c.innerHTML = ICONS.clock;
    c.append(` ${it.time}${it.timeEnd ? `〜${it.timeEnd}` : ''}`);
    card.append(c);
  }
  if (it.repeat) {
    const c = el('span', 'chip');
    c.innerHTML = ICONS.repeat;
    c.append(` ${REPEAT_LABEL[it.repeat]}`);
    card.append(c);
  }
  if (it.minutes && !compact) {
    const c = el('span', 'chip mono');
    c.innerHTML = ICONS.clock;
    c.append(` ${it.minutes}分`);
    card.append(c);
  }
  if (it.kind === 'task' && it.minutes && !it.done) {
    const play = el('button', 'play-btn');
    play.type = 'button';
    play.setAttribute('aria-label', `「${it.title}」のタイマーを開始`);
    play.innerHTML = ICONS.play;
    play.addEventListener('click', (e) => { e.stopPropagation(); startTimer(it); });
    card.append(play);
  }

  // タップで詳細（読み取り）を開く。編集は詳細のペンボタンから
  card.addEventListener('click', () => openDetail(it));

  if (it.kind === 'gcal') return card; // Googleの予定は読み取り専用（スワイプ編集なし）

  return makeSwipe(card, {
    onEdit: () => openSheet('edit', { item: it }),
    onDelete: () => deleteItem(it),
  });
}

/* ========== screens & navigation ========== */

function setScreen(screen) {
  if (screen === 'settings' && ui.screen !== 'settings') ui.prevScreen = ui.screen;
  ui.screen = screen;
  renderAll();
}

document.querySelectorAll('[data-goto="settings"]').forEach((b) => b.addEventListener('click', () => setScreen('settings')));
$('#settings-back').addEventListener('click', () => setScreen(ui.prevScreen));
$('#bottomnav').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-nav]');
  if (!btn) return;
  const nav = btn.dataset.nav;
  if (nav === 'today') { ui.view = 'day'; ui.cursor = new Date(); setScreen('cal'); }
  if (nav === 'calendar') { ui.view = 'month'; ui.selectedKey = ui.selectedKey || todayKey(); setScreen('cal'); }
  if (nav === 'insights') setScreen('insights');
  if (nav === 'anniv') setScreen('anniv');
  if (nav === 'tasks') setScreen('tasklist');
  if (nav === 'routines') setScreen('routines');
});

document.querySelectorAll('.seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => { ui.view = btn.dataset.view; renderAll(); });
});
$('#nav-prev').addEventListener('click', () => navigate(-1));
$('#nav-next').addEventListener('click', () => navigate(1));
$('#nav-today').addEventListener('click', () => {
  ui.cursor = new Date();
  ui.selectedKey = todayKey();
  renderAll();
});
// カレンダー本体の横スワイプで前後へ。はみ出さないよう本体だけを指に追従させ、離したら新しい内容をスッと差し替える
(() => {
  const body = $('#cal-body');
  let sx = 0;
  let sy = 0;
  let active = false;
  let horiz = null;    // 横ジェスチャーと確定したか（縦スクロールとの取り合い防止）

  const reset = () => { body.style.transition = 'transform .16s ease, opacity .16s ease'; body.style.transform = ''; body.style.opacity = ''; };
  body.addEventListener('touchstart', (e) => {
    if (e.target.closest('.swipe, .tg-draft, .tg-handle')) { active = false; return; }
    active = true;
    horiz = null;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive: true });
  body.addEventListener('touchmove', (e) => {
    if (!active) return;
    const dx = e.touches[0].clientX - sx;
    const dy = e.touches[0].clientY - sy;
    if (horiz === null && (Math.abs(dx) > 14 || Math.abs(dy) > 14)) horiz = Math.abs(dx) > Math.abs(dy) * 1.4;
    if (horiz) {
      body.style.transition = 'none';
      body.style.transform = `translateX(${dx * 0.5}px)`; // 追従（減衰つき・はみ出さない）
      body.style.opacity = String(Math.max(0.5, 1 - Math.abs(dx) / 900));
    }
  }, { passive: true });
  body.addEventListener('touchend', (e) => {
    if (!active) return;
    active = false;
    if (!horiz) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 55) { reset(); return; } // 戻す
    const dir = dx < 0 ? 1 : -1;
    navigate(dir); // 新しい日付で再描画
    body.style.transition = 'none'; // 反対側から短くスライドイン
    body.style.transform = `translateX(${dir * 34}px)`;
    body.style.opacity = '0.4';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      body.style.transition = 'transform .2s ease-out, opacity .2s ease-out';
      body.style.transform = '';
      body.style.opacity = '';
    }));
  }, { passive: true });
  body.addEventListener('touchcancel', () => { if (active) { active = false; reset(); } });
})();

// ビューに応じて cursor を dir ぶんずらした Date を返す（副作用なし）
function shiftedCursor(dir) {
  const c = ui.cursor;
  if (ui.view === 'day') return addDays(c, dir);
  if (ui.view === 'grid') return addDays(c, dir * ui.gridDays);
  if (ui.view === 'week') return addDays(c, dir * 7);
  if (ui.view === 'year') return new Date(c.getFullYear() + dir, 0, 1);
  return new Date(c.getFullYear(), c.getMonth() + dir, 1);
}

function navigate(dir) {
  ui.cursor = shiftedCursor(dir);
  if (ui.view === 'month') ui.selectedKey = toKey(ui.cursor);
  renderAll();
}

/* ========== rendering ========== */

function renderAll() {
  applyVisibility();
  $('#scr-cal').hidden = ui.screen !== 'cal';
  $('#scr-insights').hidden = ui.screen !== 'insights';
  $('#scr-settings').hidden = ui.screen !== 'settings';
  $('#scr-routines').hidden = ui.screen !== 'routines';
  $('#scr-anniv').hidden = ui.screen !== 'anniv';
  $('#scr-tasklist').hidden = ui.screen !== 'tasklist';
  $('#fab').hidden = ui.screen === 'settings' || ui.screen === 'routines' || ui.screen === 'anniv';

  const streak = String(streakDays());
  $('#chip-streak').textContent = streak;
  $('#chip-streak2').textContent = streak;

  document.querySelectorAll('#bottomnav button').forEach((b) => {
    const nav = b.dataset.nav;
    const active = (nav === 'today' && ui.screen === 'cal' && ui.view === 'day')
      || (nav === 'calendar' && ui.screen === 'cal' && ui.view !== 'day')
      || (nav === 'insights' && ui.screen === 'insights')
      || (nav === 'anniv' && ui.screen === 'anniv')
      || (nav === 'tasks' && ui.screen === 'tasklist')
      || (nav === 'routines' && ui.screen === 'routines');
    b.classList.toggle('is-active', active);
  });

  if (ui.screen === 'anniv') renderAnniv();
  if (ui.screen === 'cal') renderCal();
  if (ui.screen === 'insights') renderInsights();
  if (ui.screen === 'settings') renderSettings();
  if (ui.screen === 'routines') renderRoutines();
  if (ui.screen === 'tasklist') renderTaskList();
}

function streakDays() {
  const doneKeys = new Set();
  for (const t of db.tasks) {
    if (t.repeat) Object.keys(t.doneDates || {}).forEach((k) => doneKeys.add(k));
    else if (t.done) doneKeys.add(t.date);
  }
  let d = new Date();
  if (!doneKeys.has(toKey(d))) d = addDays(d, -1);
  let n = 0;
  while (doneKeys.has(toKey(d))) { n += 1; d = addDays(d, -1); }
  return n;
}

function goalKey() {
  const c = ui.cursor;
  if (ui.view === 'day') return `d:${toKey(c)}`;
  if (ui.view === 'grid') return ui.gridDays === 1 ? `d:${toKey(c)}` : `w:${toKey(startOfWeekMon(c))}`;
  if (ui.view === 'week') return `w:${toKey(startOfWeekMon(c))}`;
  if (ui.view === 'month') return `m:${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, '0')}`;
  return `y:${c.getFullYear()}`;
}
const GOAL_PLACEHOLDER = { day: '今日の目標を書く…', week: '今週の目標を書く…', grid: '目標を書く…', month: '今月の目標を書く…', year: '今年の目標を書く…' };

$('#goal-line').addEventListener('click', () => {
  const line = $('#goal-line');
  if (line.dataset.editing) return;
  const k = goalKey();
  line.dataset.editing = '1';
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 60;
  input.className = 'goal-input';
  input.value = db.goals[k] || '';
  input.placeholder = GOAL_PLACEHOLDER[ui.view];
  line.textContent = '';
  line.classList.remove('is-empty');
  line.append(input);
  input.focus();
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  input.addEventListener('blur', () => {
    const v = input.value.trim();
    if (v) db.goals[k] = v; else delete db.goals[k];
    save();
    delete line.dataset.editing;
    renderAll();
  });
});

$('#theme-toggle').addEventListener('click', () => {
  const t = db.settings.theme || 'auto';
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(t) + 1) % THEME_CYCLE.length];
  db.settings.theme = next;
  applyTheme();
  save();
  syncThemeSeg();
  flashToast(`テーマ: ${THEME_LABEL[next]}`);
});
// 設定画面のテーマ選択ボタンの選択状態を、ヘッダー切替と同期
function syncThemeSeg() {
  document.querySelectorAll('#theme-seg button').forEach((b) => {
    if (b.dataset.themeOpt) b.classList.toggle('is-active', b.dataset.themeOpt === (db.settings.theme || 'auto'));
  });
}

function renderCal() {
  document.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.view === ui.view));
  const c = ui.cursor;
  const eyebrow = $('#cal-eyebrow');
  const title = $('#cal-title-text');
  if (ui.view === 'year') {
    eyebrow.textContent = `YEAR ${c.getFullYear()}`;
    title.textContent = `${c.getFullYear()}年`;
  } else if (ui.view === 'day') {
    const isToday = toKey(c) === todayKey();
    eyebrow.textContent = `${WD_EN[c.getDay()]} · ${MONTH_EN[c.getMonth()]} ${c.getDate()}${isToday ? ' · TODAY' : ''}`;
    title.textContent = `${c.getMonth() + 1}月${c.getDate()}日（${WD_JA[c.getDay()]}）`;
  } else if (ui.view === 'grid') {
    const s = gridStart();
    const e2 = addDays(s, ui.gridDays - 1);
    if (ui.gridDays === 1) {
      eyebrow.textContent = `${WD_EN[s.getDay()]} · ${MONTH_EN[s.getMonth()]} ${s.getDate()}`;
      title.textContent = `${s.getMonth() + 1}月${s.getDate()}日（${WD_JA[s.getDay()]}）`;
    } else {
      $('#cal-title').classList.add('small');
      eyebrow.textContent = `${MONTH_EN[s.getMonth()].slice(0, 3)} ${s.getDate()} — ${MONTH_EN[e2.getMonth()].slice(0, 3)} ${e2.getDate()}`;
      title.textContent = s.getMonth() === e2.getMonth()
        ? `${s.getMonth() + 1}月${s.getDate()}日〜${e2.getDate()}日`
        : `${s.getMonth() + 1}月${s.getDate()}日〜${e2.getMonth() + 1}月${e2.getDate()}日`;
    }
  } else if (ui.view === 'week') {
    const s = startOfWeekMon(c);
    $('#cal-title').classList.add('small'); // 「7月27日〜8月2日」が変な位置で折り返さないように
    const e2 = addDays(s, 6);
    eyebrow.textContent = s.getMonth() === e2.getMonth()
      ? `${MONTH_EN[s.getMonth()]} ${s.getDate()} — ${e2.getDate()}`
      : `${MONTH_EN[s.getMonth()].slice(0, 3)} ${s.getDate()} — ${MONTH_EN[e2.getMonth()].slice(0, 3)} ${e2.getDate()}`;
    title.textContent = s.getMonth() === e2.getMonth()
      ? `${s.getMonth() + 1}月${s.getDate()}日〜${e2.getDate()}日`
      : `${s.getMonth() + 1}月${s.getDate()}日〜${e2.getMonth() + 1}月${e2.getDate()}日`;
  } else {
    eyebrow.textContent = `${MONTH_EN[c.getMonth()]} ${c.getFullYear()}`;
    title.textContent = `${c.getFullYear()}年${c.getMonth() + 1}月`;
  }

  if (ui.view !== 'week' && !(ui.view === 'grid' && ui.gridDays > 1)) $('#cal-title').classList.remove('small');

  const goalLine = $('#goal-line');
  if (!goalLine.dataset.editing) {
    const g = db.goals[goalKey()];
    goalLine.textContent = g || GOAL_PLACEHOLDER[ui.view];
    goalLine.classList.toggle('is-empty', !g);
  }
  const body = $('#cal-body');
  tgPrevScrollY = window.scrollY; // 再描画で一瞬ページが縮んでも見ていた位置へ戻せるように
  body.textContent = '';
  openSwipeEl = null;

  // マイカレンダーのフィルタチップ（TimeTree風）
  if (db.calendars.length > 1 || db.routines.length || db.sharedJoined.length || gcalConnected()) {
    const chips = el('div', 'cal-chips');
    const f = db.settings.calendarFilter;
    const mkChip = (id, name, on, color) => {
      const b = el('button', `cal-chip${on ? ' is-on' : ''}`);
      b.type = 'button';
      const d = el('span', 'ccdot');
      if (on && color) d.style.background = color;
      b.append(d, name);
      b.addEventListener('click', () => toggleFilter(id));
      return b;
    };
    chips.append(mkChip('all', 'すべて', f === 'all'));
    const dark = effectiveDark();
    for (const cal of db.calendars) {
      chips.append(mkChip(cal.id, cal.name, f === 'all' || f.includes(cal.id), (ACCENTS[cal.color] || ACCENTS.green)[dark ? 'dark' : 'light']));
    }
    for (const code of db.sharedJoined) {
      const c = db.sharedCache[code];
      chips.append(mkChip(SH_PREFIX + code, `${(c && c.title) || code}（共有）`, f === 'all' || f.includes(SH_PREFIX + code), (ACCENTS[(c && c.color) || 'blue'] || ACCENTS.blue)[dark ? 'dark' : 'light']));
    }
    if (db.routines.length) chips.append(mkChip('routine', 'ルーティン', f === 'all' || f.includes('routine')));
    if (gcalConnected()) chips.append(mkChip('gcal', 'Googleカレンダー', f === 'all' || f.includes('gcal'), (ACCENTS.blue || ACCENTS.green)[dark ? 'dark' : 'light']));
    body.append(chips);
  }
  if (ui.view !== 'grid' && ui.schedMode) { ui.schedMode = false; ui.schedSlots = []; ui.schedEditCode = null; } // 時間割を離れたら調整モード終了
  if (ui.view === 'day') renderDay(body);
  if (ui.view === 'grid') renderGrid(body);
  if (ui.view === 'week') renderWeek(body);
  if (ui.view === 'month') renderMonth(body);
  if (ui.view === 'year') renderYear(body);
  ui.lastView = ui.view; // 時間割の自動スクロール判定用（ビューに入った時だけスクロール）
  updateCalStickH(); // フィルタチップを固定ヘッダーの真下に貼り付けるための高さ計測
}

// 上部固定のON/OFF（設定で切替。OFFなら通常スクロール）
function applyStickyHeader() {
  document.documentElement.dataset.sticky = db.settings.stickyHeader === false ? 'off' : 'on';
}
// 固定ヘッダー（appbar全体）の高さを測って、下のフィルタチップの sticky 位置に使う
function updateCalStickH() {
  const cs = document.querySelector('#scr-cal .appbar');
  if (cs) document.documentElement.style.setProperty('--cal-stick-h', `${cs.offsetHeight}px`);
}
window.addEventListener('resize', updateCalStickH);

/* ----- 時間割（Googleカレンダー風・日×時間のグリッド。既存の日・週ビューとは別口の追加ビュー） ----- */

const TG_HOUR_H = 48; // 1時間の高さ(px)
let tgPrevScrollY = 0; // 再描画前のスクロール位置（時間割で日付を送っても時間帯を保つ）

function gridStart() {
  if (ui.gridDays === 7) return startOfWeekMon(ui.cursor);
  return new Date(ui.cursor.getFullYear(), ui.cursor.getMonth(), ui.cursor.getDate());
}

function renderGrid(body) {
  // 日数の切替（1日／3日／週）
  const seg = el('div', 'tg-seg');
  for (const [n, label] of [[1, '1日'], [3, '3日'], [7, '週']]) {
    const b = el('button', `tg-seg-btn${ui.gridDays === n ? ' is-active' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => { ui.gridDays = n; renderAll(); });
    seg.append(b);
  }
  body.append(seg);

  // スケジュール調整モードの操作バー
  if (ui.schedMode) {
    const bar = el('div', 'sched-bar');
    bar.append(el('p', 'sched-hint', `空いている時間をタップして選択（${ui.schedSlots.length}/3）。もう一度タップで解除。`));
    const row = el('div', 'sched-row');
    const durSeg = el('div', 'seg');
    [[30, '30分'], [60, '60分'], [90, '90分']].forEach(([v, label]) => {
      const b = el('button', `seg-btn${ui.schedDur === v ? ' is-active' : ''}`, label);
      b.type = 'button';
      b.addEventListener('click', () => { ui.schedDur = v; renderAll(); });
      durSeg.append(b);
    });
    row.append(durSeg);
    const copyBtn = el('button', 'cta sched-copy', '定型文をコピー');
    copyBtn.type = 'button';
    copyBtn.disabled = !ui.schedSlots.length;
    copyBtn.addEventListener('click', schedCopy);
    const exitBtn = el('button', 'cta ghost sched-exit', '終了');
    exitBtn.type = 'button';
    exitBtn.addEventListener('click', () => { ui.schedMode = false; ui.schedSlots = []; renderAll(); });
    row.append(copyBtn, exitBtn);
    bar.append(row);
    const row2 = el('div', 'sched-row');
    if (gcalCanWrite()) { // Meet自動発行（Google連携中のみ）
      const mc = el('button', `mo-rt-chip${ui.schedMeet ? ' is-on' : ''}`);
      mc.type = 'button';
      mc.append(el('span', 'ccdot'), '確定時にMeet発行');
      mc.addEventListener('click', () => { ui.schedMeet = !ui.schedMeet; renderAll(); });
      row2.append(mc);
    }
    const linkBtn = el('button', 'cta ghost sched-exit', ui.schedEditCode ? '変更を保存' : 'リンクを発行');
    linkBtn.type = 'button';
    linkBtn.disabled = !ui.schedSlots.length;
    linkBtn.addEventListener('click', schedIssueLink);
    row2.append(linkBtn);
    if (ui.schedEditCode) {
      const cancelEdit = el('button', 'cta ghost sched-exit', '変更をやめる');
      cancelEdit.type = 'button';
      cancelEdit.addEventListener('click', () => { ui.schedEditCode = null; ui.schedSlots = []; renderAll(); });
      row2.append(cancelEdit);
    }
    bar.append(row2);
    bar.append(el('p', 'sched-hint2', 'リンク発行: 相手がリンクから日時を選ぶと、あなたのカレンダーに自動で予定が入ります（要ログイン）。'));
    const offerList = buildOfferList();
    if (offerList) bar.append(offerList);
    body.append(bar);
  }

  const start = gridStart();
  const days = Array.from({ length: ui.gridDays }, (_, i) => addDays(start, i));
  const wrap = el('div', 'tg-wrap');

  // 見出し（曜日・日付。タップでその日のデイリーへ）
  const head = el('div', 'tg-head');
  head.append(el('span', 'tg-gutter'));
  for (const d of days) {
    const h = el('button', `tg-day${toKey(d) === todayKey() ? ' is-today' : ''}`);
    h.type = 'button';
    h.append(el('span', `tg-wd${dayColorClass(d)}`, WD_JA[d.getDay()]));
    h.append(el('span', `tg-num mono${dayColorClass(d)}`, String(d.getDate())));
    h.addEventListener('click', () => { ui.view = 'day'; ui.cursor = d; renderAll(); });
    head.append(h);
  }
  wrap.append(head);

  // 時間なしの項目（終日の段）
  const allday = el('div', 'tg-allday');
  allday.append(el('span', 'tg-gutter tg-adlabel', '終日'));
  let anyAllday = false;
  for (const d of days) {
    const cell = el('div', 'tg-adcell');
    for (const it of itemsFor(toKey(d)).filter(passFilter).filter((x) => !x.time)) {
      anyAllday = true;
      const chip = el('button', `tg-chip${it.done ? ' is-done' : ''}`, it.title);
      chip.type = 'button';
      const col = itemColor(it);
      if (col) chip.style.background = col;
      chip.addEventListener('click', () => openSheet('edit', { item: it }));
      cell.append(chip);
    }
    allday.append(cell);
  }
  if (anyAllday) wrap.append(allday);

  // 本体（縦=時間・横=日）
  const grid = el('div', 'tg-grid');
  const gutter = el('div', 'tg-gutter tg-hours');
  for (let h = 1; h < 24; h += 1) {
    const s = el('span', 'tg-hour mono', `${h}:00`);
    s.style.top = `${h * TG_HOUR_H}px`;
    gutter.append(s);
  }
  grid.append(gutter);
  for (const d of days) {
    const key = toKey(d);
    const col = el('div', `tg-col${key === todayKey() ? ' is-today' : ''}`);
    for (let h = 1; h < 24; h += 1) {
      const ln = el('div', 'tg-line');
      ln.style.top = `${h * TG_HOUR_H}px`;
      col.append(ln);
    }
    // 空きスロットのタップ → 時間枠（下書き）を出してつまみで調整 → 予定として追加
    // スケジュール調整モード中は、タップで「空き候補」を置く（最大3つ・もう一度タップで解除）
    col.addEventListener('click', (e) => {
      if (e.target.closest('.tg-item') || e.target.closest('.tg-draft') || e.target.closest('.tg-sched')) return;
      const rect = col.getBoundingClientRect();
      if (ui.schedMode) { schedAddSlot(key, e.clientY - rect.top); return; }
      tgAddDraft(col, key, e.clientY - rect.top);
    });
    // スケジュール候補の表示
    for (const s of ui.schedSlots.filter((x) => x.key === key)) {
      const sb = el('button', 'tg-sched');
      sb.type = 'button';
      sb.style.top = `${(s.startMin / 60) * TG_HOUR_H + 1}px`;
      sb.style.height = `${Math.max(20, (s.durMin / 60) * TG_HOUR_H - 2)}px`;
      sb.append(el('span', 'tg-sched-t mono', `${tgMinToStr(s.startMin)}〜${tgMinToStr(s.startMin + s.durMin)}`));
      sb.addEventListener('click', (e) => { e.stopPropagation(); ui.schedSlots = ui.schedSlots.filter((x) => x !== s); renderAll(); });
      col.append(sb);
    }
    for (const it of itemsFor(key).filter(passFilter).filter((x) => x.time)) {
      const [hh, mm] = it.time.split(':').map(Number);
      // 長さ: 予定は終了時刻まで、タスクは所要時間、どちらもなければ1時間ぶん
      const durMin = it.timeEnd
        ? Math.max(15, tgStrToMin(it.timeEnd) - tgStrToMin(it.time))
        : (it.minutes || 60);
      const block = el('button', `tg-item${it.done ? ' is-done' : ''}`);
      block.type = 'button';
      block.style.top = `${(hh + mm / 60) * TG_HOUR_H + 1}px`;
      block.style.height = `${Math.max(20, (durMin / 60) * TG_HOUR_H - 2)}px`;
      const c2 = itemColor(it);
      if (c2) block.style.background = c2;
      block.append(el('span', 'tg-ittl', it.title));
      if (durMin >= 45 && ui.gridDays < 7) block.append(el('span', 'tg-itime mono', it.timeEnd ? `${it.time}〜${it.timeEnd}` : it.time));
      block.addEventListener('click', (e) => { e.stopPropagation(); openDetail(it); });
      col.append(block);
    }
    if (key === todayKey()) { // 現在時刻の線
      const now = new Date();
      const line = el('div', 'tg-now');
      line.style.top = `${(now.getHours() + now.getMinutes() / 60) * TG_HOUR_H}px`;
      col.append(line);
    }
    grid.append(col);
  }
  wrap.append(grid);
  body.append(wrap);

  // 時間割に「入った時」は一番上（0時・今日）へ。日付を送った時は見ていた時間帯を保つ
  if (ui.lastView !== 'grid') {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  } else {
    const keep = tgPrevScrollY;
    requestAnimationFrame(() => window.scrollTo(0, keep));
  }
}

/* ----- スケジュール調整（空き枠を選んで定型文で共有） ----- */

const SCHED_TPL_DEFAULT = `以下の日程でご都合いかがでしょうか？

{{候補}}

ご都合が難しければ、他の日程もお送りします！`;

function schedAddSlot(key, y) {
  if (ui.schedSlots.length >= 3) { flashToast('候補は3つまでです（タップで解除できます）'); return; }
  let startMin = Math.round((y / TG_HOUR_H) * 60 / 30) * 30; // 30分にスナップ
  startMin = Math.max(0, Math.min(24 * 60 - ui.schedDur, startMin));
  // 既存の予定・タスクと重なる枠は「空き」ではないので置けない（正直に伝える）
  const busy = itemsFor(key).filter(passFilter).some((it) => {
    if (!it.time) return false;
    const s = tgStrToMin(it.time);
    const e2 = it.timeEnd ? tgStrToMin(it.timeEnd) : s + (it.minutes || 60);
    return startMin < e2 && s < startMin + ui.schedDur;
  });
  if (busy) { flashToast('その時間には予定があります（空いている枠を選んでね）'); return; }
  ui.schedSlots.push({ key, startMin, durMin: ui.schedDur });
  renderAll();
}

function schedText(srcSlots) {
  const slots = [...(srcSlots || ui.schedSlots)].sort((a, b) => a.key.localeCompare(b.key) || a.startMin - b.startMin);
  const lines = slots.map((s) => {
    const d = fromKey(s.key);
    return `・${d.getMonth() + 1}/${d.getDate()}（${WD_JA[d.getDay()]}）${tgMinToStr(s.startMin)}〜${tgMinToStr(s.startMin + s.durMin)}`;
  });
  const tpl = db.settings.schedTemplate || SCHED_TPL_DEFAULT;
  return tpl.includes('{{候補}}') ? tpl.replace('{{候補}}', lines.join('\n')) : `${tpl}\n\n${lines.join('\n')}`;
}

async function schedCopy() {
  const text = schedText();
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) { // クリップボードAPIが使えない環境向けフォールバック
    const ta = document.createElement('textarea');
    ta.value = text; document.body.append(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  flashToast('コピーしました。LINEやメールに貼って送ってね');
}

/* ----- スケジュール調整 第2弾: リンク予約（Firestore・無料枠） -----
   自分: リンク発行 → 相手: リンクから日時を選ぶ → 自分のカレンダーに自動で予定＋（設定時）Meet発行。
   自分が先に予定を入れた枠は候補から自動で消える（save後に同期）。 */

function meetDocRef(code) { return window.firebase.firestore().collection('meet').doc(code); }
function slotBusy(s) {
  return itemsFor(s.key).some((it) => {
    if (!it.time) return false;
    const a = tgStrToMin(it.time);
    const b2 = it.timeEnd ? tgStrToMin(it.timeEnd) : a + (it.minutes || 60);
    return s.startMin < b2 && a < s.startMin + s.durMin;
  });
}

function meetUrl(code) { return `${location.origin}${location.pathname}?meet=${code}`; }

async function schedIssueLink() {
  if (!ui.schedSlots.length) return;
  if (!fbReady || !fbUser) { flashToast('リンク発行にはログインが必要です（設定→アカウントと同期）'); return; }
  const editing = ui.schedEditCode ? (db.settings.meetOffers || []).find((o) => o.code === ui.schedEditCode) : null;
  const code = editing ? editing.code : Math.random().toString(36).slice(2, 10);
  const slots = ui.schedSlots.map((s) => ({ ...s }));
  const meet = Boolean(ui.schedMeet && gcalCanWrite());
  const offerDoc = {
    v: 1,
    ownerUid: fbUser.uid,
    owner: (db.settings.userName || '').trim() || null,
    slots,
    meet,
    status: 'open',
    picked: null,
    meetLink: null,
    updatedAt: Date.now(),
  };
  try {
    await meetDocRef(code).set(offerDoc); // 変更時も丸ごと上書き（open に戻す）
    db.settings.meetOffers = db.settings.meetOffers || [];
    if (editing) {
      removeMeetEvent(code); // 前に自動で入った予定があれば取り消して募集に戻す
      Object.assign(editing, { done: false, slots, owner: offerDoc.owner, meet, status: 'open', picked: null, meetLink: null, createdAt: editing.createdAt || Date.now(), url: meetUrl(code) });
    } else {
      db.settings.meetOffers.push({ code, done: false, slots, owner: offerDoc.owner, meet, status: 'open', picked: null, meetLink: null, createdAt: Date.now(), url: meetUrl(code) });
    }
    ui.schedEditCode = null;
    persistLocal();
    meetWatch(code);
    const text = `${schedText()}\n\n下のリンクから、都合の良い日時を選んでもらえます:\n${meetUrl(code)}`;
    try { await navigator.clipboard.writeText(text); } catch (e) { /* 手動コピーでも可 */ }
    ui.schedSlots = [];
    renderAll();
    flashToast(editing ? '変更を保存して、定型文ごとコピーしました（相手に送り直してね）' : 'リンクを発行して、定型文ごとコピーしました');
  } catch (err) {
    flashToast('リンク発行に失敗しました（Firestoreルールの設定を確認してね）');
  }
}

// 予約リンクに紐づいて自動で入った予定を取り消す（Google側からも削除）
function removeMeetEvent(code) {
  const idx = (db.events || []).findIndex((e) => e.meetCode === code);
  if (idx < 0) return;
  const ev = db.events[idx];
  if (ev.gcalId) gcalDeleteEvent(ev.gcalId);
  db.events.splice(idx, 1);
}

// 発行済みリンクの一覧を作る（募集中・確定・Meetリンクのコピー・変更・取り消し）
function schedStatusLabel(o) {
  if (o.status === 'confirmed' || (o.status === 'picked' && o.done)) return '確定';
  if (o.status === 'picked') return '確定処理中';
  return '募集中';
}
function schedSlotLine(s) {
  const d = fromKey(s.key);
  return `${d.getMonth() + 1}/${d.getDate()}（${WD_JA[d.getDay()]}）${tgMinToStr(s.startMin)}〜${tgMinToStr(s.startMin + s.durMin)}`;
}
async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand('copy'); } catch (e2) { /* noop */ } ta.remove();
  }
  if (msg) flashToast(msg);
}
async function schedCancelOffer(code) {
  removeMeetEvent(code);
  try { await meetDocRef(code).delete(); } catch (e) { /* ローカルからは消す */ }
  db.settings.meetOffers = (db.settings.meetOffers || []).filter((o) => o.code !== code);
  delete meetWatched[code];
  if (ui.schedEditCode === code) { ui.schedEditCode = null; ui.schedSlots = []; }
  persistLocal();
  renderAll();
  flashToast('予約リンクを取り消しました');
}
function schedEditOffer(o) {
  ui.schedEditCode = o.code;
  ui.schedSlots = (o.slots || []).map((s) => ({ ...s }));
  if (o.slots && o.slots[0]) ui.schedDur = o.slots[0].durMin;
  ui.schedMeet = Boolean(o.meet);
  flashToast('候補を読み込みました。変更して「変更を保存」を押してね');
  renderAll();
}
function buildOfferList() {
  const offers = (db.settings.meetOffers || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!offers.length) return null;
  const box = el('div', 'sched-offers');
  box.append(el('p', 'sched-offers-h', '発行済みのリンク'));
  for (const o of offers) {
    const card = el('div', `sched-offer${ui.schedEditCode === o.code ? ' is-editing' : ''}`);
    const head = el('div', 'sched-offer-head');
    const lab = schedStatusLabel(o);
    head.append(el('span', `sched-badge sched-badge-${lab === '確定' ? 'done' : (lab === '募集中' ? 'open' : 'wait')}`, lab));
    const picked = o.picked;
    head.append(el('span', 'sched-offer-when', picked ? schedSlotLine(picked) : `候補${(o.slots || []).length}件`));
    card.append(head);
    if (!picked && (o.slots || []).length) card.append(el('p', 'sched-offer-slots', (o.slots).map(schedSlotLine).join(' / ')));
    const acts = el('div', 'sched-offer-acts');
    const mkBtn = (label, cls, fn) => { const b = el('button', `sched-mini${cls ? ` ${cls}` : ''}`, label); b.type = 'button'; b.addEventListener('click', fn); return b; };
    acts.append(mkBtn('リンクをコピー', '', () => copyText(o.url || meetUrl(o.code), 'リンクをコピーしました')));
    acts.append(mkBtn('定型文をコピー', '', () => copyText(`${schedText(o.slots || [])}\n\n下のリンクから、都合の良い日時を選んでもらえます:\n${o.url || meetUrl(o.code)}`, '定型文をコピーしました。送り直してね')));
    if (o.meetLink) acts.append(mkBtn('会議リンクをコピー', 'sched-mini-meet', () => copyText(o.meetLink, 'Google Meetのリンクをコピーしました')));
    acts.append(mkBtn(ui.schedEditCode === o.code ? '変更中' : '変更', '', () => schedEditOffer(o)));
    acts.append(mkBtn('取り消し', 'sched-mini-del', () => { if (confirm('この予約リンクを取り消しますか？（相手は選べなくなり、入っていた予定も消えます）')) schedCancelOffer(o.code); }));
    card.append(acts);
    box.append(card);
  }
  return box;
}

// 相手が選んだら: 自分のカレンダーに予定を入れ、必要ならMeetを発行してリンクを共有
const meetWatched = {};
function meetWatch(code) {
  if (!fbReady || meetWatched[code]) return;
  meetWatched[code] = true;
  meetDocRef(code).onSnapshot(async (snap) => {
    const d = snap.data();
    const offer = (db.settings.meetOffers || []).find((o) => o.code === code);
    // ローカルの控えを最新化（一覧に反映）
    if (offer && d) {
      Object.assign(offer, { slots: d.slots || offer.slots, status: d.status, picked: d.picked || null, meetLink: d.meetLink || null });
      persistLocal();
      if (ui.schedMode) renderAll();
    }
    if (!d || d.status !== 'picked' || !d.picked) return;
    if (!offer || offer.done) return;
    offer.done = true;
    const s = d.picked;
    const ev = { id: newId('e'), title: '打ち合わせ', date: s.key, time: tgMinToStr(s.startMin), timeEnd: tgMinToStr(s.startMin + s.durMin), calendarId: null, pushGoogle: d.meet, meetCode: code, createdAt: Date.now() };
    db.events.push(ev);
    save(); renderAll();
    const dd = fromKey(s.key);
    flashToast(`相手が日時を選びました: ${dd.getMonth() + 1}/${dd.getDate()} ${tgMinToStr(s.startMin)}（予定に入れました）`);
    try {
      if (d.meet && gcalCanWrite()) {
        await gcalSyncEvent(ev, s.key, true); // Meet付きでGoogleにも登録（ev.hangoutLinkが入る）
        persistLocal();
        await meetDocRef(code).update({ status: 'confirmed', meetLink: ev.hangoutLink || null, updatedAt: Date.now() });
      } else {
        await meetDocRef(code).update({ status: 'confirmed', updatedAt: Date.now() });
      }
    } catch (e) { /* 確定自体は済んでいる */ }
  });
}

// 自分側で予定が入った枠を候補から外す（save後にデバウンス同期）
let meetSyncTimer = null;
function scheduleMeetSync() {
  if (!fbReady || !fbUser || !(db.settings.meetOffers || []).some((o) => !o.done)) return;
  clearTimeout(meetSyncTimer);
  meetSyncTimer = setTimeout(async () => {
    for (const o of (db.settings.meetOffers || [])) {
      if (o.done) continue;
      try {
        const snap = await meetDocRef(o.code).get();
        const d = snap.data();
        if (!d || d.status !== 'open') continue;
        const free = d.slots.filter((s) => !slotBusy(s));
        if (free.length !== d.slots.length) await meetDocRef(o.code).update({ slots: free, updatedAt: Date.now() });
      } catch (e) { /* 次回saveで再試行 */ }
    }
  }, 3000);
}
// ログイン完了後、未確定の発行ぶんを見張る
setInterval(() => { if (fbReady && fbUser) (db.settings.meetOffers || []).filter((o) => !o.done).forEach((o) => meetWatch(o.code)); }, 5000);

// ─ 相手側: ?meet=コード で開いたら予約画面を出す ─
(() => {
  const code = new URLSearchParams(location.search).get('meet');
  if (!code) return;
  const scrim = el('div', 'meet-scrim');
  const card = el('div', 'meet-card');
  card.append(el('p', 'meet-title', '日時をえらぶ'));
  const bodyEl = el('div', 'meet-body');
  bodyEl.append(el('p', 'hint', '読み込み中…'));
  card.append(bodyEl);
  scrim.append(card);
  document.body.append(scrim);
  const fmt = (s) => { const d = fromKey(s.key); return `${d.getMonth() + 1}/${d.getDate()}（${WD_JA[d.getDay()]}）${tgMinToStr(s.startMin)}〜${tgMinToStr(s.startMin + s.durMin)}`; };
  const start = async () => {
    // 相手はログインしていないので、こちらから明示的にFirebaseを起動する（fbReady待ちだと永久に読み込み中になる）
    let ok = false;
    try { ok = await ensureFirebase(); } catch (e) { ok = false; }
    if (!ok) { bodyEl.textContent = ''; bodyEl.append(el('p', 'hint', '読み込めませんでした（通信環境を確認してください）。')); return; }
    meetDocRef(code).onSnapshot((snap) => {
      const d = snap.data();
      bodyEl.textContent = '';
      if (!d) { bodyEl.append(el('p', 'hint', 'この予約リンクは見つかりませんでした（取り消された可能性があります）。')); return; }
      if (d.status === 'open') {
        bodyEl.append(el('p', 'meet-sub', `${d.owner ? `${d.owner}さん` : '相手'}の空いている日時です。都合の良いものを選んでください。`));
        if (!d.slots.length) { bodyEl.append(el('p', 'hint', '選べる日時がなくなりました。相手に連絡して、新しい候補をもらってください。')); return; }
        for (const s of d.slots) {
          const btn = el('button', 'cta meet-slot', fmt(s));
          btn.type = 'button';
          btn.addEventListener('click', async () => {
            try { await meetDocRef(code).update({ status: 'picked', picked: s, pickedAt: Date.now() }); } catch (e) { bodyEl.append(el('p', 'hint', '送信できませんでした。もう一度お試しください。')); }
          });
          bodyEl.append(btn);
        }
      } else {
        const s = d.picked;
        bodyEl.append(el('p', 'meet-sub', 'この日時で確定しました。'));
        if (s) bodyEl.append(el('p', 'meet-done mono', fmt(s)));
        if (d.meetLink) {
          const a = document.createElement('a');
          a.href = d.meetLink; a.target = '_blank'; a.rel = 'noopener'; a.className = 'cta meet-slot'; a.textContent = '会議リンクを開く（Google Meet）';
          bodyEl.append(a);
          const cp = el('button', 'cta ghost meet-slot', '会議リンクをコピー');
          cp.type = 'button';
          cp.addEventListener('click', () => copyText(d.meetLink, 'Google Meetのリンクをコピーしました'));
          bodyEl.append(cp);
        } else if (d.meet && d.status === 'picked') {
          bodyEl.append(el('p', 'hint', '会議リンクを準備中です。少し待ってからもう一度開いてください。'));
        }
      }
    }, () => { bodyEl.textContent = ''; bodyEl.append(el('p', 'hint', '読み込めませんでした（通信環境を確認してください）。')); });
  };
  setTimeout(start, 0); // スクリプト全体の読み込み後に開始（fbReady定義前の参照を避ける）
})();

/* ----- サイドバー（メニュー） ----- */

function openSidebar() { $('#side-scrim').hidden = false; requestAnimationFrame(() => $('#side-scrim').classList.add('is-open')); }
function closeSidebar() {
  $('#side-scrim').classList.remove('is-open');
  setTimeout(() => { $('#side-scrim').hidden = true; }, 180);
}
$('#menu-open').addEventListener('click', openSidebar);
$('#side-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeSidebar(); });
$('#side-sched').addEventListener('click', () => {
  closeSidebar();
  ui.screen = 'cal'; ui.view = 'grid';
  if (ui.gridDays === 1) ui.gridDays = 3; // 空きが見渡せるように
  ui.schedMode = true; ui.schedSlots = [];
  renderAll();
});
$('#side-help').addEventListener('click', () => { closeSidebar(); $('#help-scrim').hidden = false; });
$('#help-close').addEventListener('click', () => { $('#help-scrim').hidden = true; });
$('#help-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
$('#side-backup').addEventListener('click', () => { closeSidebar(); downloadBackup(); flashToast('バックアップを書き出しました（ファイル）'); });
$('#side-settings').addEventListener('click', () => { closeSidebar(); setScreen('settings'); });

// 定型文の設定
$('#sched-template').addEventListener('input', (e) => { db.settings.schedTemplate = e.target.value; persistLocal(); });
$('#sched-template-reset').addEventListener('click', () => {
  delete db.settings.schedTemplate;
  $('#sched-template').value = SCHED_TPL_DEFAULT;
  persistLocal();
  flashToast('定型文を初期状態に戻しました');
});

/* ----- 時間割: タップで時間枠（下書き）→ つまみで開始・終了を調整 → 「予定」として追加 ----- */

function tgStrToMin(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }
function tgMinToStr(min) { return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }

function tgAddDraft(col, key, y) {
  document.querySelectorAll('.tg-draft').forEach((n) => n.remove()); // 下書きは1つだけ
  let start = Math.max(0, Math.min(23 * 60, Math.floor(y / (TG_HOUR_H / 2)) * 30)); // 30分刻みで開始
  let end = Math.min(24 * 60, start + 60);
  const d = el('div', 'tg-draft');
  const lbl = el('span', 'tg-dlbl mono');
  const h1 = el('span', 'tg-handle tg-h1');
  const h2 = el('span', 'tg-handle tg-h2');
  const bar = el('div', 'tg-dbar');
  const okB = el('button', 'tg-dok', '予定を追加');
  okB.type = 'button';
  const noB = el('button', 'tg-dcancel');
  noB.type = 'button';
  noB.setAttribute('aria-label', 'キャンセル');
  noB.textContent = '×';
  bar.append(okB, noB);
  d.append(lbl, h1, h2, bar);
  const sync = () => {
    d.style.top = `${(start / 60) * TG_HOUR_H}px`;
    d.style.height = `${((end - start) / 60) * TG_HOUR_H}px`;
    lbl.textContent = `${tgMinToStr(start)}〜${tgMinToStr(end)}`;
  };
  sync();
  const drag = (handle, apply) => { // つまみを上下にドラッグ（15分刻み）
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const rect = col.getBoundingClientRect();
      const move = (ev) => {
        apply(Math.round((ev.clientY - rect.top) / (TG_HOUR_H / 4)) * 15);
        sync();
      };
      const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    });
  };
  drag(h1, (m) => { start = Math.max(0, Math.min(end - 15, m)); });
  drag(h2, (m) => { end = Math.min(24 * 60, Math.max(start + 15, m)); });
  // 枠そのものを掴む → 長さはそのまま上下に移動（15分刻み）
  d.addEventListener('pointerdown', (e) => {
    if (e.target !== d && e.target !== lbl) return;
    e.preventDefault();
    e.stopPropagation();
    d.setPointerCapture(e.pointerId);
    const rect = col.getBoundingClientRect();
    const dur = end - start;
    const grab = (e.clientY - rect.top) - (start / 60) * TG_HOUR_H; // 枠内のどこを掴んだか
    const move = (ev) => {
      let ns = Math.round((ev.clientY - rect.top - grab) / (TG_HOUR_H / 4)) * 15;
      ns = Math.max(0, Math.min(24 * 60 - dur, ns));
      start = ns;
      end = ns + dur;
      sync();
    };
    const up = () => {
      d.removeEventListener('pointermove', move);
      d.removeEventListener('pointerup', up);
    };
    d.addEventListener('pointermove', move);
    d.addEventListener('pointerup', up);
  });
  okB.addEventListener('click', (e) => {
    e.stopPropagation();
    d.remove();
    openSheet('add', { dateKey: key, time: tgMinToStr(start), timeEnd: tgMinToStr(end), type: 'event' });
  });
  noB.addEventListener('click', (e) => { e.stopPropagation(); d.remove(); });
  col.append(d);
}

/* ----- day（タイムライン） ----- */

function renderDay(body) {
  const key = toKey(ui.cursor);
  if (db.running) body.append(buildRunCard());

  // この日の記念日をお祝い表示（あれば）
  const cur = ui.cursor;
  for (const a of db.anniversaries) {
    if (!annivOccursOn(a, cur)) continue;
    const [ay] = a.date.split('-').map(Number);
    const years = annivRepeat(a) === 'yearly' ? cur.getFullYear() - ay : null;
    const banner = el('div', 'anniv-banner');
    banner.innerHTML = ICONS[annivIconName(a)];
    banner.append(el('span', '', `「${a.title}」${years ? `（${years}周年）` : ''}`));
    body.append(banner);
  }

  body.append(buildSleepCard(key));

  const items = itemsFor(key).filter(passFilter);
  const stats = tasksStatsFor(key);
  if (stats.total > 0 && stats.done === stats.total) {
    const cel = el('div', 'celebrate');
    cel.innerHTML = `${ICONS.sprout}<p><strong>この日のタスク、ぜんぶ完了！</strong>ひとつずつ積み上がっています。</p>`;
    body.append(cel);
  }

  if (items.length === 0) {
    body.append(el('p', 'empty', 'まだ何もありません。右下の「＋」からタスクや予定を追加してみましょう。'));
    body.append(buildDayLogCard(key));
    return;
  }
  const tl = el('div', 'tl');
  let prevEnd = null; // 直前の予定の終了（or開始）時刻。時間の「あいだ」を表示するため
  for (const it of items) {
    // 時間が流れている感じ: 前の予定との空き時間を薄く表示
    if (it.time) {
      const startMin = toMin(it.time);
      if (prevEnd != null && startMin - prevEnd >= 30) {
        const gap = el('div', 'tl-gaprow');
        gap.append(el('span', ''));
        gap.append(el('span', 'tl-rail tl-rail-gap'));
        gap.append(el('span', 'tl-gap', `${fmtDur(startMin - prevEnd)}のあいだ`));
        tl.append(gap);
      }
      prevEnd = Math.max(prevEnd ?? 0, it.timeEnd ? toMin(it.timeEnd) : startMin);
    }
    const row = el('div', `tl-row${it.done ? ' is-done' : ''}${it.kind === 'event' ? ' is-event' : ''}${it.kind === 'gcal' ? ' is-gcal' : ''}${it.span ? ' is-span' : ''}`);
    const timeCell = el('span', 'tl-time mono');
    if (it.span) {
      timeCell.append(el('span', 'tl-span-day', `${it.span.dayIndex}日目`));
      timeCell.append(el('span', 'tl-span-of', `/${it.span.dayCount}日`));
    } else if (it.time) {
      timeCell.append(el('span', 'tl-start', it.time));
      if (it.timeEnd) timeCell.append(el('span', 'tl-end', it.timeEnd)); // 終了時刻を下に添える
    }
    row.append(timeCell);
    row.append(el('span', 'tl-rail'));
    const slot = el('div', 'tl-item');
    slot.append(buildItemCard(it));
    row.append(slot);
    tl.append(row);
  }
  body.append(tl);
  body.append(buildDayLogCard(key));
}

// 「あのね。ノート」: その日まるごとの感想を書くまとめ日記（日ビュー最下部）
function buildDayLogCard(key) {
  const card = el('div', 'daylog-card');
  card.append(el('p', 'daylog-title', 'あのね。ノート'));
  const ta = document.createElement('textarea');
  ta.className = 'daylog-input';
  ta.rows = 3;
  ta.maxLength = 2000;
  ta.placeholder = '今日はどんな一日だった？　まるっと書き残しておこう。';
  ta.value = db.dayLogs[key] || '';
  ta.addEventListener('input', () => {
    const v = ta.value.trim();
    if (v) db.dayLogs[key] = ta.value; else delete db.dayLogs[key];
    save();
  });
  card.append(ta);
  return card;
}

/* ----- week ----- */

function renderWeek(body) {
  const start = startOfWeekMon(ui.cursor);
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(start, i);
    const key = toKey(day);
    const row = el('div', 'wk-row');

    const dateBlock = el('button', `wk-date${key === todayKey() ? ' is-today' : ''}`);
    dateBlock.type = 'button';
    dateBlock.setAttribute('aria-label', `${day.getMonth() + 1}月${day.getDate()}日をデイリー表示で開く`);
    dateBlock.append(el('span', `dnum${dayColorClass(day)}`, String(day.getDate())));
    dateBlock.append(el('span', `wd${day.getDay() === 0 ? ' sun' : day.getDay() === 6 ? ' sat' : ''}`, WD_EN[day.getDay()]));
    dateBlock.addEventListener('click', () => { ui.cursor = day; ui.view = 'day'; renderAll(); });
    row.append(dateBlock);

    const main = el('div', 'wk-main');
    const items = itemsFor(key).filter(passFilter);
    if (items.length === 0) {
      const empty = el('button', 'wk-empty', '予定なし — タップして追加');
      empty.type = 'button';
      empty.addEventListener('click', () => openSheet('add', { dateKey: key }));
      main.append(empty);
    } else {
      for (const it of items) main.append(buildItemCard(it, { compact: true, showTime: true }));
      const stats = tasksStatsFor(key);
      if (stats.total > 0) {
        const bar = el('div', 'wk-bar');
        const fill = el('div', 'wk-bar-fill');
        fill.style.width = `${(stats.done / stats.total) * 100}%`;
        bar.append(fill);
        main.append(bar);
      }
    }
    row.append(main);
    body.append(row);
  }
}

/* ----- month ----- */

/* ========== パッケージ（1日のタイムスケジュールを束ねて別の日にコピー） ========== */

// その日の予定・タスク（繰り返し展開後）を、日付に依存しない“ひな型”として取り込む
function pkgItemsFromDay(key) {
  return itemsFor(key).map((it) => ({
    title: it.title,
    kind: it.kind === 'event' || it.kind === 'gcal' ? 'event' : 'task',
    time: it.time || '',
    timeEnd: it.timeEnd || '',
    minutes: it.minutes || null,
    color: (it.ref && it.ref.color) || null,
    place: (it.ref && it.ref.place) || '',
    who: (it.ref && it.ref.who) ? [...it.ref.who] : [],
  }));
}

// パッケージの各項目を、指定した日付の予定・タスクとして追加
function applyPackage(pkg, key) {
  let n = 0;
  for (const p of pkg.items) {
    if (p.kind === 'event') {
      db.events.push({ id: newId('e'), title: p.title, date: key, time: p.time || '', timeEnd: p.timeEnd || null, who: p.who || [], place: p.place || '', color: p.color || null, calendarId: 'c-default', createdAt: Date.now() });
    } else {
      db.tasks.push({ id: newId('t'), title: p.title, date: key, time: p.time || '', timeEnd: p.timeEnd || null, minutes: p.minutes || null, color: p.color || null, calendarId: 'c-default', done: false, createdAt: Date.now() });
    }
    n += 1;
  }
  save();
  return n;
}

function renderPackages(body) {
  body.append(el('p', 'r-note', 'お気に入りの1日のタイムスケジュールを「パッケージ」として保存して、別の日にまるごとコピーできます。中身はあとから自由に編集できます。'));

  const make = el('div', 'pkg-make');
  const tIn = document.createElement('input');
  tIn.type = 'text'; tIn.maxLength = 40; tIn.placeholder = '例：理想の朝';
  make.append(el('label', 'f-label', 'パッケージ名'), tIn);

  // ① 空で新規作成（あとから項目を足す）
  const newBtn = el('button', 'cta', '＋ 空で新規作成');
  newBtn.type = 'button';
  newBtn.addEventListener('click', () => {
    const title = tIn.value.trim() || '新しいパッケージ';
    db.packages.unshift({ id: newId('pkg'), title, items: [], createdAt: Date.now() });
    tIn.value = '';
    save(); renderAll();
    flashToast(`「${title}」を作成しました`);
  });
  make.append(newBtn);

  // ② 既存の1日から取り込んで作る
  const dIn = document.createElement('input');
  dIn.type = 'date'; dIn.className = 'mono'; dIn.value = todayKey();
  const mkBtn = el('button', 'cta ghost', 'この日から取り込んで作る');
  mkBtn.type = 'button';
  mkBtn.addEventListener('click', () => {
    const title = tIn.value.trim();
    const key = dIn.value;
    if (!title) { flashToast('パッケージ名を入れてね'); return; }
    if (!key) { flashToast('日付を選んでね'); return; }
    const items = pkgItemsFromDay(key);
    if (!items.length) { flashToast('その日には予定・タスクがありません'); return; }
    db.packages.unshift({ id: newId('pkg'), title, items, createdAt: Date.now() });
    tIn.value = '';
    save(); renderAll();
    flashToast(`「${title}」を作成しました（${items.length}件）`);
  });
  const sub = el('div', 'pkg-make-sub');
  sub.append(el('span', 'pkg-sub-label', 'または、既存の1日から取り込む'), dIn, mkBtn);
  make.append(sub);
  body.append(make);

  if (!db.packages.length) {
    body.append(el('p', 'empty', 'まだパッケージがありません。上で作ってみましょう。'));
    return;
  }

  for (const pkg of db.packages) {
    const card = el('div', 'pkg-card');
    const name = document.createElement('input');
    name.type = 'text'; name.className = 'pkg-title'; name.value = pkg.title; name.maxLength = 40;
    name.addEventListener('blur', () => { pkg.title = name.value.trim() || pkg.title; save(); });
    card.append(name);

    const list = el('div', 'pkg-items');
    pkg.items.forEach((p, i) => {
      const row = el('div', 'pkg-item-edit');
      const top = el('div', 'pkg-ie-top');
      // 種類（タスク／予定）トグル
      const kind = el('button', 'pkg-kind');
      kind.type = 'button';
      kind.textContent = p.kind === 'event' ? '予定' : 'タスク';
      kind.addEventListener('click', () => { p.kind = p.kind === 'event' ? 'task' : 'event'; save(); kind.textContent = p.kind === 'event' ? '予定' : 'タスク'; });
      const timeIn = document.createElement('input');
      timeIn.type = 'time'; timeIn.step = 300; timeIn.value = p.time || '';
      timeIn.addEventListener('change', () => { p.time = timeIn.value || ''; save(); });
      const timeEndIn = document.createElement('input');
      timeEndIn.type = 'time'; timeEndIn.step = 300; timeEndIn.value = p.timeEnd || '';
      timeEndIn.addEventListener('change', () => { p.timeEnd = timeEndIn.value || ''; save(); });
      const del = el('button', 'iconbtn pkg-item-del');
      del.type = 'button'; del.setAttribute('aria-label', '削除'); del.innerHTML = ICONS.trash;
      del.addEventListener('click', () => { pkg.items.splice(i, 1); save(); renderAll(); });
      top.append(kind, timeIn, el('span', 'pkg-ie-tilde', '〜'), timeEndIn, del);
      const titleIn = document.createElement('input');
      titleIn.type = 'text'; titleIn.className = 'pkg-ie-title'; titleIn.maxLength = 120; titleIn.value = p.title || ''; titleIn.placeholder = 'やること・予定名';
      titleIn.addEventListener('input', () => { p.title = titleIn.value; save(); });
      row.append(top, titleIn);
      list.append(row);
    });
    card.append(list);

    const addItem = el('button', 'pkg-add-item', '＋ 項目を追加');
    addItem.type = 'button';
    addItem.addEventListener('click', () => { pkg.items.push({ title: '', kind: 'task', time: '', timeEnd: '' }); save(); renderAll(); });
    card.append(addItem);

    const actions = el('div', 'pkg-actions');
    const applyIn = document.createElement('input');
    applyIn.type = 'date'; applyIn.className = 'mono'; applyIn.value = todayKey();
    const applyBtn = el('button', 'cta', 'この日に入れる');
    applyBtn.type = 'button';
    applyBtn.addEventListener('click', () => {
      const key = applyIn.value;
      if (!key) { flashToast('日付を選んでね'); return; }
      const usable = pkg.items.filter((p) => (p.title || '').trim());
      if (!usable.length) { flashToast('中身が空です。項目を追加してね'); return; }
      const n = applyPackage({ ...pkg, items: usable }, key);
      const d = fromKey(key);
      flashToast(`${d.getMonth() + 1}月${d.getDate()}日に${n}件入れました`);
      ui.cursor = d; ui.view = 'day'; ui.screen = 'cal'; renderAll();
    });
    const delPkg = el('button', 'cta ghost', '削除');
    delPkg.type = 'button';
    delPkg.addEventListener('click', () => {
      const idx = db.packages.indexOf(pkg);
      const removed = pkg;
      db.packages.splice(idx, 1);
      save(); renderAll();
      showUndoToast(`「${removed.title}」を削除しました`, () => { db.packages.splice(Math.min(idx, db.packages.length), 0, removed); save(); renderAll(); });
    });
    actions.append(applyIn, applyBtn, delPkg);
    card.append(actions);
    body.append(card);
  }
}

/* ========== タスク一覧（日/週/時間/月/年 とは別の、タスクだけの一覧） ========== */

function renderTaskList() {
  const body = $('#tasklist-body');
  if (!body) return;
  body.textContent = '';
  const filter = ui.taskFilter || 'todo';

  const seg = el('div', 'seg');
  [['todo', '未完了'], ['all', 'すべて']].forEach(([v, label]) => {
    const b = el('button', `seg-btn${filter === v ? ' is-active' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => { ui.taskFilter = v; renderAll(); });
    seg.append(b);
  });
  body.append(seg);

  const keyOf = (t) => (t.repeat ? t.startDate : t.date) || '';
  const list = db.tasks.slice().sort((a, b) => keyOf(a).localeCompare(keyOf(b)) || (a.time || '').localeCompare(b.time || ''));
  const rows = list.filter((t) => (filter === 'all' ? true : (t.repeat ? true : !t.done)));

  if (!rows.length) {
    body.append(el('p', 'empty', filter === 'todo' ? '未完了のタスクはありません。お疲れさま！' : 'タスクはまだありません。右下の「＋」から追加できます。'));
    return;
  }

  const wrap = el('div', 'tasklist');
  for (const t of rows) {
    const done = t.repeat ? false : !!t.done;
    const row = el('div', `tkrow${done ? ' is-done' : ''}`);
    if (!t.repeat) {
      const cb = el('button', `tkcheck${done ? ' is-done' : ''}`);
      cb.type = 'button'; cb.setAttribute('aria-label', '完了を切り替え');
      if (done) cb.innerHTML = ICONS.check;
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        t.done = !t.done;
        if (t.done) t.doneAt = Date.now();
        save(); renderAll();
      });
      row.append(cb);
    } else {
      row.append(el('span', 'tkcheck is-repeat'));
    }
    const main = el('div', 'tkmain');
    main.append(el('span', 'tk-title', t.title));
    const meta = el('span', 'tk-meta');
    if (t.repeat) {
      meta.append(el('span', 'tk-chip', REPEAT_LABEL[t.repeat] || '繰り返し'));
    } else {
      const d = fromKey(t.date);
      meta.append(el('span', `tk-date mono${dayColorClass(d)}`, `${d.getMonth() + 1}/${d.getDate()}（${WD_JA[d.getDay()]}）`));
    }
    if (t.time) meta.append(el('span', 'tk-time mono', t.timeEnd ? `${t.time}〜${t.timeEnd}` : t.time));
    main.append(meta);
    row.append(main);
    row.addEventListener('click', () => {
      const key = t.repeat ? todayKey() : t.date;
      ui.cursor = fromKey(key); ui.view = 'day'; setScreen('cal');
    });
    wrap.append(row);
  }
  body.append(wrap);
}

function renderMonth(body) {
  const c = ui.cursor;
  const schedule = db.settings.monthStyle === 'schedule';

  // ドット（既定）⇄ 予定表（TimeTree風ラベル）の切替 — 既存のドット表示はそのまま
  const styleRow = el('div', 'mo-style-seg');
  const styleSeg = el('div', 'seg');
  [['dots', 'ドット'], ['schedule', '予定表']].forEach(([v, label]) => {
    const b = el('button', `seg-btn${(db.settings.monthStyle || 'dots') === v ? ' is-active' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => { db.settings.monthStyle = v; save(); renderAll(); });
    styleSeg.append(b);
  });
  styleRow.append(styleSeg);
  // ルーティンを「月」だけサッと表示/非表示（設定に潜らず1タップ）
  if (db.routines.length) {
    const rc = el('button', `mo-rt-chip${db.settings.monthHideRoutines ? '' : ' is-on'}`);
    rc.type = 'button';
    const dot = el('span', 'ccdot');
    if (!db.settings.monthHideRoutines) dot.style.background = (ACCENTS.green)[effectiveDark() ? 'dark' : 'light'];
    rc.append(dot, 'ルーティン');
    rc.addEventListener('click', () => { db.settings.monthHideRoutines = !db.settings.monthHideRoutines; save(); renderAll(); });
    styleRow.append(rc);
  }
  body.append(styleRow);

  const head = el('div', 'mo-head');
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach((w) => head.append(el('span', '', w)));
  body.append(head);

  const grid = el('div', schedule ? 'mo-grid schedule' : 'mo-grid');
  const first = new Date(c.getFullYear(), c.getMonth(), 1);
  const gridStart = startOfWeekMon(first);
  for (let i = 0; i < 42; i += 1) {
    const day = addDays(gridStart, i);
    const key = toKey(day);
    const items = itemsFor(key).filter(passFilter).filter(showInMonth); // 「月」に表示ONのものだけ
    const isOther = day.getMonth() !== c.getMonth();
    const cell = el('button', [
      'mo-cell',
      isOther ? 'is-other' : '',
      key === todayKey() ? 'is-today' : '',
      key === ui.selectedKey ? 'is-selected' : '',
    ].filter(Boolean).join(' '));
    cell.type = 'button';
    cell.setAttribute('aria-label', `${day.getMonth() + 1}月${day.getDate()}日を選択`);
    const dnum = el('span', `dnum${dayColorClass(day)}`, String(day.getDate()));
    const annivDay = annivOnDay(day);
    if (annivDay) { const st = el('span', 'mo-star'); st.innerHTML = ICONS[annivIconName(annivDay)]; dnum.append(st); } // 記念日の日は小さくアイコン
    cell.append(dnum);
    if (schedule) { // TimeTree風: 日付の下に色つきラベル（最大4件）
      for (const it of items.slice(0, 4)) {
        const dow = day.getDay();
        const isMon = dow === 1;
        const isSun = dow === 0;
        // 複数日予定は、開始日と各週の月曜だけ名前を出し、中日は帯だけにして横に繋がって見えるように
        const isMidOrEnd = it.span && !it.span.isStart && !isMon;
        const label = isMidOrEnd ? '' : it.title;
        const invert = db.settings.invertEvents && it.kind === 'event'; // 予定は色を反転（フチ＋薄塗り）でタスクと見分ける
        const chip = el('span', `mo-chip${it.done ? ' is-done' : ''}${it.kind === 'event' && !it.ref.color ? ' is-event-chip' : ''}${it.span ? ' mo-chip-span' : ''}${invert ? ' mo-chip-invert' : ''}`, label);
        const cc = itemColor(it);
        if (cc) {
          if (invert) { chip.style.background = 'transparent'; chip.style.color = cc; chip.style.borderColor = cc; }
          else chip.style.background = cc;
        }
        const ec = itemEdgeColor(it);
        if (ec) chip.style.boxShadow = `inset 0 0 0 1.5px ${ec}`;
        if (it.span) { // 隙間なく連日つながって見えるよう、セルのすき間ぶんだけ左右に伸ばす（週の端は伸ばさず角丸に）
          const roundL = it.span.isStart || isMon;
          const roundR = it.span.isEnd || isSun;
          const extL = !it.span.isStart && !isMon ? 2 : 0; // 前日と接続（セルのすき間ぶん）
          const extR = !it.span.isEnd && !isSun ? 2 : 0; // 翌日と接続
          chip.style.width = `calc(100% + ${extL + extR}px)`;
          chip.style.marginLeft = `-${extL}px`;
          chip.style.borderTopLeftRadius = roundL ? '' : '0';
          chip.style.borderBottomLeftRadius = roundL ? '' : '0';
          chip.style.borderTopRightRadius = roundR ? '' : '0';
          chip.style.borderBottomRightRadius = roundR ? '' : '0';
        }
        cell.append(chip);
      }
      if (items.length > 4) cell.append(el('span', 'mo-chip-more', `+${items.length - 4}`));
    } else {
      const dots = el('span', 'mo-dots');
      for (const it of items.slice(0, MAX_MONTH_DOTS)) {
        const dot = el('span', `mdot ${it.kind === 'event' ? 'event' : it.done ? 'done' : 'undone'}`);
        const ec = itemEdgeColor(it);
        if (ec) dot.style.boxShadow = `0 0 0 1.5px ${ec}`;
        dots.append(dot);
      }
      if (items.length > MAX_MONTH_DOTS) dots.append(el('span', 'mdot-more', '+'));
      cell.append(dots);
    }
    cell.addEventListener('click', () => { ui.selectedKey = key; renderAll(); });
    grid.append(cell);
  }
  body.append(grid);

  // 選択日のプレビュー
  const key = ui.selectedKey || todayKey();
  const day = fromKey(key);
  const items = itemsFor(key).filter(passFilter);
  const stats = tasksStatsFor(key);
  const headRow = el('div', 'preview-head');
  headRow.append(el('span', 'preview-title', `${day.getMonth() + 1}月${day.getDate()}日（${WD_JA[day.getDay()]}）`));
  headRow.append(el('span', 'preview-count mono', stats.total ? `${stats.done}/${stats.total} done` : ''));
  body.append(headRow);
  const stack = el('div', 'stack');
  if (items.length === 0) {
    stack.append(el('p', 'empty', 'この日はまだ何もありません。'));
  } else {
    for (const it of items) stack.append(buildItemCard(it, { compact: true, showTime: true }));
  }
  body.append(stack);
}

/* ----- year（ヒートマップ） ----- */

function doneCountMapForYear(y) {
  const prefix = `${y}-`;
  const map = {};
  for (const t of db.tasks) {
    if (t.repeat) {
      for (const k of Object.keys(t.doneDates || {})) if (k.startsWith(prefix)) map[k] = (map[k] || 0) + 1;
    } else if (t.done && t.date && t.date.startsWith(prefix)) {
      map[t.date] = (map[t.date] || 0) + 1;
    }
  }
  return map;
}

function renderYear(body) {
  const y = ui.cursor.getFullYear();
  const map = doneCountMapForYear(y);
  const totalDone = Object.values(map).reduce((s, n) => s + n, 0);
  const activeDays = Object.keys(map).length;
  const tKey = todayKey();

  const stats = el('div', 'yr-stats');
  const s1 = el('span'); s1.append('完了 '); s1.append(el('b', '', String(totalDone))); s1.append(' 回');
  const s2 = el('span'); s2.append('実行した日 '); s2.append(el('b', '', String(activeDays))); s2.append(' 日');
  stats.append(s1, s2);
  body.append(stats);

  const card = el('div', 'card');
  for (let m = 0; m < 12; m += 1) {
    const row = el('div', 'yr-month-row');
    row.append(el('span', 'yr-label', `${m + 1}月`));
    const cells = el('div', 'yr-cells');
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const key = toKey(new Date(y, m, d));
      const n = map[key] || 0;
      const lv = n >= 3 ? 'lv3' : n === 2 ? 'lv2' : n === 1 ? 'lv1' : '';
      const cell = el('button', `yr-cell ${lv}${key === tKey ? ' is-today' : ''}`.trim());
      cell.type = 'button';
      cell.setAttribute('aria-label', `${m + 1}月${d}日（完了${n}件）を開く`);
      cell.addEventListener('click', () => {
        ui.cursor = new Date(y, m, d);
        ui.view = 'day';
        renderAll();
      });
      cells.append(cell);
    }
    row.append(cells);
    card.append(row);
  }
  const legend = el('div', 'yr-legend');
  legend.append('少');
  ['', 'lv1', 'lv2', 'lv3'].forEach((lv) => legend.append(el('span', `yr-cell ${lv}`.trim())));
  legend.append('多');
  card.append(legend);
  body.append(card);
}

/* ----- 年月ピッカー ----- */

let pickerYear = new Date().getFullYear();

function openPicker() {
  pickerYear = ui.cursor.getFullYear();
  renderPicker();
  $('#picker-scrim').hidden = false;
}
function closePicker() { $('#picker-scrim').hidden = true; }
function renderPicker() {
  $('#py-val').textContent = String(pickerYear);
  const grid = $('#pm-grid');
  grid.textContent = '';
  const now = new Date();
  for (let m = 0; m < 12; m += 1) {
    const btn = el('button', 'pm-btn');
    btn.type = 'button';
    btn.textContent = `${m + 1}月`;
    if (pickerYear === ui.cursor.getFullYear() && m === ui.cursor.getMonth()) btn.classList.add('is-active');
    if (pickerYear === now.getFullYear() && m === now.getMonth()) btn.classList.add('is-current');
    btn.addEventListener('click', () => {
      // 日は維持しつつ、月末を超える場合は丸める（例: 31日→2月28日）
      const day = Math.min(ui.cursor.getDate(), new Date(pickerYear, m + 1, 0).getDate());
      ui.cursor = new Date(pickerYear, m, day);
      ui.selectedKey = toKey(new Date(pickerYear, m, 1));
      closePicker();
      renderAll();
    });
    grid.append(btn);
  }
}
$('#cal-title').addEventListener('click', openPicker);
$('#py-prev').addEventListener('click', () => { pickerYear -= 1; renderPicker(); });
$('#py-next').addEventListener('click', () => { pickerYear += 1; renderPicker(); });
$('#picker-today').addEventListener('click', () => {
  ui.cursor = new Date();
  ui.selectedKey = todayKey();
  closePicker();
  renderAll();
});
$('#picker-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) closePicker(); });

// 時刻・所要時間の入力を5分刻みに丸める（端末のピッカーがstep属性を無視しても確実に5分単位に）
// キャプチャ段階で値を丸めるので、各入力のchangeハンドラは丸め後の値を受け取る
document.addEventListener('change', (e) => {
  const t = e.target;
  if (!t || t.tagName !== 'INPUT') return;
  if (t.type === 'time' && t.value) {
    const [h, m] = t.value.split(':').map(Number);
    let mm = Math.round(m / 5) * 5;
    let hh = h;
    if (mm === 60) { mm = 0; hh = (h + 1) % 24; }
    const nv = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    if (nv !== t.value) t.value = nv;
  } else if (t.type === 'number' && t.step === '5' && t.value !== '') {
    let v = Math.round(Number(t.value) / 5) * 5;
    if (t.min !== '' && v < Number(t.min)) v = Number(t.min);
    if (t.max !== '' && v > Number(t.max)) v = Number(t.max);
    if (String(v) !== t.value) t.value = String(v);
  }
}, true);

/* ----- 睡眠記録（朝活サポート: この日の起床とその前夜の就寝） ----- */

function toMin(t) { return Number(t.slice(0, 2)) * 60 + Number(t.slice(3)); }
function sleepDurMin(rec) { return (toMin(rec.wake) - toMin(rec.bed) + 1440) % 1440; }
function sleepTotalMin(rec) { return ((rec.bed && rec.wake) ? sleepDurMin(rec) : 0) + (rec.nap || 0); } // 夜＋お昼寝の合計
function fmtDur(min) { return `${Math.floor(min / 60)}時間${String(Math.round(min % 60)).padStart(2, '0')}分`; }
function fmtClock(min) { const m2 = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m2 / 60)).padStart(2, '0')}:${String(m2 % 60).padStart(2, '0')}`; }

function buildSleepCard(key) {
  const rec = db.sleep[key] || {};
  const card = el('div', 'sleep-card');
  card.innerHTML = ICONS.clock;
  const bed = document.createElement('input');
  bed.type = 'time'; bed.step = 300; bed.value = rec.bed || '';
  const wake = document.createElement('input');
  wake.type = 'time'; wake.step = 300; wake.value = rec.wake || '';
  const nap = document.createElement('input'); // お昼寝は「何分」で入力（時刻ではない）
  nap.type = 'number'; nap.min = 0; nap.max = 1440; nap.step = 5; nap.className = 'sleep-nap-input mono'; nap.placeholder = '分'; nap.value = rec.nap || '';
  const dur = el('span', 'sleep-dur');
  const napMin = () => { const v = parseInt(nap.value, 10); return Number.isInteger(v) && v > 0 ? Math.min(1440, Math.round(v / 5) * 5) : 0; };
  const renderDur = () => {
    dur.textContent = '';
    const night = (bed.value && wake.value) ? sleepDurMin({ bed: bed.value, wake: wake.value }) : 0;
    const nm = napMin();
    const total = night + nm;
    if (!total) return;
    dur.append(el('span', 'sleep-total-v', fmtDur(total)));
    if (night && nm) dur.append(el('span', 'sleep-breakdown', `夜${fmtDur(night)}＋昼寝${fmtDur(nm)}`));
    else if (nm && !night) dur.append(el('span', 'sleep-breakdown', '昼寝のみ'));
  };
  const sync = () => {
    const nm = napMin();
    const r = { bed: bed.value || null, wake: wake.value || null, nap: nm || null };
    if (r.bed || r.wake || r.nap) db.sleep[key] = r; else delete db.sleep[key];
    renderDur();
    save();
  };
  bed.addEventListener('change', sync);
  wake.addEventListener('change', sync);
  nap.addEventListener('change', sync);
  renderDur();
  // 各時刻の上に「その時刻がいつの日か」を小さく表示（日付の矛盾を感じにくく）
  const field = (dayText, labelText, input) => {
    const f = el('div', 'sleep-field');
    f.append(el('span', 'sleep-day', dayText), el('span', 'sleep-flabel', labelText), input);
    return f;
  };
  const napField = () => {
    const f = el('div', 'sleep-field sleep-field-nap');
    const row = el('span', 'sleep-nap-row');
    row.append(nap, el('span', 'sleep-nap-unit', '分'));
    f.append(el('span', 'sleep-day', '今日'), el('span', 'sleep-flabel', 'お昼寝'), row);
    return f;
  };
  // 記録方法の設定で並び順を変える（夜に就寝→翌朝起床 / 朝に起床→夜に就寝）
  if (db.settings.sleepMode === 'morning') {
    card.append(field('今日', '起床', wake), field('今日', '就寝', bed), napField(), dur);
  } else {
    card.append(field('昨日', '就寝', bed), field('今日', '起床', wake), napField(), dur);
  }
  return card;
}

/* ----- insights（振り返り） ----- */

function periodDays(period) {
  const now = new Date();
  let start;
  let count;
  if (period === 'week') { start = startOfWeekMon(now); count = 7; }
  else if (period === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); }
  else { start = new Date(now.getFullYear(), 0, 1); count = Math.round((new Date(now.getFullYear() + 1, 0, 1) - start) / 86400000); }
  const keys = [];
  for (let i = 0; i < count; i += 1) keys.push(toKey(addDays(start, i)));
  return keys;
}

function renderInsights() {
  const body = $('#insights-body');
  body.textContent = '';
  const tKey = todayKey();
  const period = ui.insightsPeriod;

  // 期間セグメント（週／月／年）
  const seg = el('div', 'seg period-seg');
  [['week', '週'], ['month', '月'], ['year', '年']].forEach(([v, label]) => {
    const b = el('button', `seg-btn${period === v ? ' is-active' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => { ui.insightsPeriod = v; renderAll(); });
    seg.append(b);
  });
  body.append(seg);

  const keys = periodDays(period);
  const perDay = keys.map((key) => ({ key, ...tasksStatsFor(key) }));
  const total = perDay.reduce((s, d) => s + d.total, 0);
  const done = perDay.reduce((s, d) => s + d.done, 0);
  const rate = total ? Math.round((done / total) * 100) : null;
  const periodLabel = { week: '今週', month: '今月', year: '今年' }[period];

  const stats = el('div', 'stats-row');
  const c1 = el('div', 'stat-card deep');
  c1.innerHTML = `<div class="stat-num">${rate === null ? '--' : `${rate}<small>%</small>`}</div><div class="stat-label">${periodLabel}の完了率（${done}/${total}）</div>`;
  const c2 = el('div', 'stat-card');
  c2.innerHTML = `<div class="stat-num">${streakDays()}<small>日</small></div><div class="stat-label">連続達成</div>`;
  const c3 = el('div', 'stat-card');
  c3.innerHTML = `<div class="stat-num">${done}<small>件</small></div><div class="stat-label">${periodLabel}の完了数</div>`;
  stats.append(c1, c2, c3);
  body.append(stats);

  // 期間のふりかえりメモ（週・月・年ごとに書き溜めて、あとから見返せる）
  renderPeriodNote(body, period, periodLabel);

  // 完了の棒グラフ（週=曜日別／月=週別／年=月別）
  let cols;
  if (period === 'week') {
    cols = perDay.map((d, i) => ({ label: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][i], done: d.done, now: d.key === tKey }));
  } else if (period === 'month') {
    cols = [];
    perDay.forEach((d, i) => {
      const w = Math.floor(i / 7);
      cols[w] = cols[w] || { label: `W${w + 1}`, done: 0, now: false };
      cols[w].done += d.done;
      if (d.key === tKey) cols[w].now = true;
    });
  } else {
    cols = Array.from({ length: 12 }, (_, m) => ({ label: String(m + 1), done: 0, now: m === new Date().getMonth() }));
    perDay.forEach((d) => { cols[Number(d.key.slice(5, 7)) - 1].done += d.done; });
  }
  const chart = el('div', 'card chart-card');
  chart.append(el('p', 'section-label', `${periodLabel}の完了`));
  const bars = el('div', 'bars');
  const maxDone = Math.max(1, ...cols.map((c) => c.done));
  for (const c of cols) {
    const col = el('div', `bar-col${c.now ? ' is-today' : ''}`);
    const bar = el('div', `bar${c.done > 0 ? ' hot' : ''}`);
    bar.style.height = `${Math.max(4, (c.done / maxDone) * 100)}%`;
    bar.title = `${c.done}件完了`;
    col.append(bar, el('span', 'bar-label', c.label));
    bars.append(col);
  }
  chart.append(bars);
  body.append(chart);

  // できたこと（期間内・新しい順に最大15件）
  const doneItems = [];
  for (let i = keys.length - 1; i >= 0 && doneItems.length < 15; i -= 1) {
    if (keys[i] > tKey) continue; // 未来の日はスキップ
    const dayDone = itemsFor(keys[i]).filter((it) => it.kind === 'task' && it.done);
    for (const it of dayDone.reverse()) {
      if (doneItems.length < 15) doneItems.push(it);
    }
  }
  const doneCard = el('div', 'card chart-card');
  doneCard.append(el('p', 'section-label', `できたこと ✓ ${done}`));
  if (doneItems.length === 0) {
    doneCard.append(el('p', 'hint', '完了したタスクがここに並びます。まずはひとつ。'));
  } else {
    for (const it of doneItems) {
      const row = el('div', 'done-row');
      row.innerHTML = ICONS.check;
      const main = el('div', 'dr-main');
      main.append(el('span', 'dr-title', it.title));
      const m = memoFor(it);
      if (m) main.append(el('span', 'dr-memo', m));
      row.append(main);
      const at = taskDoneAt(it.ref, it.key);
      const d = fromKey(it.key);
      row.append(el('span', 'dr-time', it.key === tKey && at
        ? new Date(at).toTimeString().slice(0, 5)
        : `${d.getMonth() + 1}/${d.getDate()}`));
      doneCard.append(row);
    }
  }
  body.append(doneCard);

  // 「1年前の今日」— 過去のひとことをそっと思い出す（ビジョンボード仕様）
  const mem = [[365, '1年前'], [182, '半年前'], [30, '1ヶ月前']]
    .map(([days, label]) => ({ key: toKey(addDays(new Date(), -days)), label }))
    .find((m2) => db.notes[m2.key]);
  if (mem) {
    const mc = el('div', 'card chart-card memory-card');
    mc.append(el('p', 'section-label', `${mem.label}の今日のひとこと`));
    mc.append(el('p', 'mem-date', mem.key));
    mc.append(el('p', 'mem-text', db.notes[mem.key]));
    body.append(mc);
  }

  // 睡眠（平均就寝・起床・睡眠時間）
  const sleepRecs = keys.filter((k) => k <= tKey).map((k) => db.sleep[k]).filter((r) => r && r.bed && r.wake);
  if (sleepRecs.length) {
    const bedAvg = sleepRecs.reduce((a, r) => a + (toMin(r.bed) < 720 ? toMin(r.bed) + 1440 : toMin(r.bed)), 0) / sleepRecs.length;
    const wakeAvg = sleepRecs.reduce((a, r) => a + toMin(r.wake), 0) / sleepRecs.length;
    const durAvg = sleepRecs.reduce((a, r) => a + sleepTotalMin(r), 0) / sleepRecs.length;
    const sCard = el('div', 'card chart-card');
    sCard.append(el('p', 'section-label', `睡眠（${sleepRecs.length}日分）`));
    const row = el('div', 'stats-row');
    const mk = (num, label) => { const d2 = el('div', 'stat-card'); d2.innerHTML = `<div class="stat-num" style="font-size:18px">${num}</div><div class="stat-label">${label}</div>`; return d2; };
    row.append(mk(fmtClock(bedAvg), '平均就寝'), mk(fmtClock(wakeAvg), '平均起床'), mk(fmtDur(durAvg), '平均睡眠'));
    sCard.append(row);
    // すべての記録の一覧（自分が実際に寝た・起きた時刻をそのまま振り返る）
    const list = el('div', 'sleep-list');
    list.append(el('p', 'section-label', '記録の一覧'));
    for (const k of keys.filter((k2) => k2 <= tKey && db.sleep[k2] && db.sleep[k2].bed && db.sleep[k2].wake).reverse()) {
      const rec = db.sleep[k];
      const d = fromKey(k);
      const li = el('div', 'sleep-row');
      li.append(el('span', `sl-date mono${dayColorClass(d)}`, `${d.getMonth() + 1}/${d.getDate()}（${WD_JA[d.getDay()]}）`));
      li.append(el('span', 'sl-times mono', `就寝 ${rec.bed} ・ 起床 ${rec.wake}${rec.nap ? ` ・ 昼寝 ${fmtDur(rec.nap)}` : ''}`));
      li.append(el('span', 'sl-dur mono', fmtDur(sleepTotalMin(rec))));
      list.append(li);
    }
    sCard.append(list);
    body.append(sCard);
  }

  // ルーティン別の達成
  if (db.routines.length > 0) {
    const rCard = el('div', 'card chart-card');
    rCard.append(el('p', 'section-label', 'ルーティン'));
    for (const r of db.routines) {
      const w = routineWeek(r, startOfWeekMon(new Date()));
      const row = el('div', 'r-hist-row');
      const label = el('span', 'r-item-title', r.title);
      row.append(label);
      row.append(el('span', 'r-count mono', `今週 ${w.done}/${r.targetPerWeek || 3}日`));
      if (w.pass) row.append(el('span', 'pass-chip', '合格'));
      const streakEl = el('span', 'r-streak');
      streakEl.append('連続 ');
      streakEl.append(el('b', '', String(routineStreakWeeks(r))));
      streakEl.append('週');
      row.append(streakEl);
      rCard.append(row);
    }
    body.append(rCard);
  }

  // 今日のひとこと
  const note = el('div', 'card note-card');
  note.append(el('p', 'section-label', '今日のひとこと'));
  const ta = document.createElement('textarea');
  ta.placeholder = '今日できたこと・気づきをひとこと。';
  ta.value = db.notes[tKey] || '';
  let noteTimer = null;
  ta.addEventListener('input', () => {
    db.notes[tKey] = ta.value;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(save, 300);
  });
  note.append(ta);
  body.append(note);
}

/* ----- settings ----- */

const ACCENT_KEYS = Object.keys(ACCENTS);
function renderCalManage() {
  const wrap = $('#cal-manage');
  wrap.textContent = '';
  const dark = effectiveDark();
  for (const cal of db.calendars) {
    const row = el('div', 'calm-row');
    const sw = el('button', 'calm-swatch');
    sw.type = 'button';
    sw.style.background = (ACCENTS[cal.color] || ACCENTS.green)[dark ? 'dark' : 'light'];
    sw.setAttribute('aria-label', '色を切り替え');
    sw.addEventListener('click', () => {
      cal.color = ACCENT_KEYS[(ACCENT_KEYS.indexOf(cal.color) + 1) % ACCENT_KEYS.length];
      save(); renderAll();
    });
    const name = document.createElement('input');
    name.type = 'text'; name.maxLength = 20; name.value = cal.name;
    name.addEventListener('blur', () => {
      cal.name = name.value.trim() || cal.name;
      save(); renderAll();
    });
    row.append(sw, name);
    if (cal.id !== 'c-default') {
      const del = el('button', 'iconbtn');
      del.type = 'button'; del.setAttribute('aria-label', '削除'); del.innerHTML = ICONS.trash;
      del.addEventListener('click', () => {
        const idx = db.calendars.indexOf(cal);
        const moved = [...db.tasks, ...db.events].filter((x) => x.calendarId === cal.id);
        db.calendars.splice(idx, 1);
        moved.forEach((x) => { delete x.calendarId; }); // 項目はマイカレンダーへ
        if (Array.isArray(db.settings.calendarFilter)) db.settings.calendarFilter = 'all';
        save(); renderAll();
        showUndoToast(`「${cal.name}」を削除しました（項目はマイカレンダーへ）`, () => {
          db.calendars.splice(Math.min(idx, db.calendars.length), 0, cal);
          moved.forEach((x) => { x.calendarId = cal.id; });
          save(); renderAll();
        });
      });
      row.append(del);
    }
    wrap.append(row);
  }
  const addBtn = $('#cal-add');
  addBtn.disabled = db.calendars.length >= MAX_CALENDARS;
  addBtn.textContent = addBtn.disabled ? '上限（8個）に達しました' : '＋ カレンダーを追加';
}
$('#cal-add').addEventListener('click', () => {
  if (db.calendars.length >= MAX_CALENDARS) return;
  db.calendars.push({ id: newId('c'), name: `カレンダー${db.calendars.length + 1}`, color: ACCENT_KEYS[db.calendars.length % ACCENT_KEYS.length], order: db.calendars.length });
  save(); renderAll();
});

const MAX_PEOPLE = 30;

function renderPeopleCard() {
  const wrap = $('#people-body');
  if (!wrap) return;
  wrap.textContent = '';
  for (const name of db.people) {
    const row = el('div', 'pp-row');
    row.append(el('span', 'pp-name', name));
    const del = el('button', 'iconbtn');
    del.type = 'button';
    del.setAttribute('aria-label', '削除');
    del.innerHTML = ICONS.trash;
    del.addEventListener('click', () => {
      const idx = db.people.indexOf(name);
      db.people.splice(idx, 1);
      save(); renderPeopleCard();
      showUndoToast(`「${name}」をリストから外しました（過去の予定の記録は残ります）`, () => {
        db.people.splice(Math.min(idx, db.people.length), 0, name);
        save(); renderPeopleCard();
      });
    });
    row.append(del);
    wrap.append(row);
  }
  const form = el('div', 'sh-form');
  const input = document.createElement('input');
  input.type = 'text'; input.maxLength = 20; input.placeholder = '名前・ニックネーム';
  const add = el('button', 'cta ghost', '追加');
  add.type = 'button';
  add.addEventListener('click', () => {
    const v = input.value.trim();
    if (!v) return;
    if (db.people.includes(v)) { flashToast('登録済みです'); return; }
    if (db.people.length >= MAX_PEOPLE) { flashToast(`上限（${MAX_PEOPLE}人）に達しました`); return; }
    db.people.push(v);
    input.value = '';
    save(); renderPeopleCard();
  });
  form.append(input, add);
  wrap.append(form);
}

function renderSettings() {
  renderCalManage();
  renderVisibilityCard();
  renderPeopleCard();
  renderSyncCard();
  renderSharedCard();
  renderGcalCard();
  renderColorRuleCard();
  renderNotionCard();
  document.querySelectorAll('#theme-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.themeOpt === db.settings.theme);
  });
  document.querySelectorAll('#size-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.sizeOpt === (db.settings.fontSize || 'large'));
  });
  document.querySelectorAll('#zoom-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.zoom === (db.settings.zoomLock === false ? 'free' : 'lock'));
  });
  document.querySelectorAll('#style-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.styleOpt === (db.settings.styleVariant || 'round'));
  });
  const un = $('#user-name');
  if (un) un.value = db.settings.userName || '';
  const sn = $('#sender-name');
  if (sn) sn.value = db.settings.senderName || '';
  const tn = $('#timer-notify');
  if (tn) tn.checked = !!db.settings.timerNotify;
  const me = $('#month-edge-toggle');
  if (me) me.checked = !!db.settings.monthEdge;
  const ie = $('#invert-events-toggle');
  if (ie) ie.checked = !!db.settings.invertEvents;
  const st = $('#sched-template');
  if (st) st.value = db.settings.schedTemplate || SCHED_TPL_DEFAULT;
  const sh = $('#sticky-toggle');
  if (sh) sh.checked = db.settings.stickyHeader !== false;
  document.querySelectorAll('#sleep-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.sleep === (db.settings.sleepMode || 'evening'));
  });
  document.querySelectorAll('#font-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.fontOpt === (db.settings.font || 'gothic'));
    const missing = fontMissing(b.dataset.fontOpt);
    let mark = b.querySelector('.miss-mark');
    if (missing && !mark) {
      mark = el('span', 'miss-mark', '＊');
      b.append(mark);
    } else if (!missing && mark) {
      mark.remove();
    }
  });
  const grid = $('#accent-grid');
  grid.textContent = '';
  for (const [id, a] of Object.entries(ACCENTS)) {
    const sw = el('button', `accent-swatch${db.settings.accent === id ? ' is-active' : ''}`);
    sw.type = 'button';
    sw.style.background = effectiveDark() ? a.dark : a.light;
    sw.setAttribute('aria-label', a.name);
    sw.title = a.name;
    if (db.settings.accent === id) sw.innerHTML = ICONS.check;
    sw.addEventListener('click', () => {
      db.settings.accent = id;
      save(); applyAccent(); renderAll();
    });
    grid.append(sw);
  }
  const repeats = db.tasks.filter((t) => t.repeat).length;
  let doneCount = 0;
  for (const t of db.tasks) doneCount += t.repeat ? Object.keys(t.doneDates || {}).length : (t.done ? 1 : 0);
  $('#data-summary').textContent = `タスク ${db.tasks.length}件（うち繰り返し ${repeats}）・予定 ${db.events.length}件・これまでの完了 ${doneCount}回`;
}
document.querySelectorAll('#theme-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    db.settings.theme = b.dataset.themeOpt;
    save(); applyTheme(); renderAll();
  });
});
document.querySelectorAll('#font-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    db.settings.font = b.dataset.fontOpt;
    save(); applyFont(); renderAll();
  });
});
document.querySelectorAll('#size-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    db.settings.fontSize = b.dataset.sizeOpt;
    save(); applySize(); renderAll();
  });
});
document.querySelectorAll('#sleep-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    db.settings.sleepMode = b.dataset.sleep;
    save(); renderAll();
  });
});
document.querySelectorAll('#zoom-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    db.settings.zoomLock = b.dataset.zoom === 'lock';
    save(); applyZoomLock(); renderAll();
  });
});
document.querySelectorAll('#style-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    db.settings.styleVariant = b.dataset.styleOpt;
    save(); applyStyle(); renderAll();
  });
});
$('#user-name').addEventListener('change', (e) => { db.settings.userName = e.target.value.trim(); save(); });
$('#sender-name').addEventListener('change', (e) => { db.settings.senderName = e.target.value.trim(); save(); });
$('#timer-notify').addEventListener('change', async (e) => {
  if (e.target.checked && 'Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch (err) { /* 拒否でもトグルは有効（音・バイブは動く） */ }
  }
  db.settings.timerNotify = e.target.checked;
  if (e.target.checked && 'Notification' in window && Notification.permission === 'denied') {
    flashToast('通知はブロックされています。端末の設定から許可すると通知バナーが出ます');
  }
  save();
});

$('#month-edge-toggle').addEventListener('change', (e) => {
  db.settings.monthEdge = e.target.checked;
  save();
  renderAll();
});

$('#sticky-toggle').addEventListener('change', (e) => {
  db.settings.stickyHeader = e.target.checked;
  applyStickyHeader();
  save();
});

$('#invert-events-toggle').addEventListener('change', (e) => {
  db.settings.invertEvents = e.target.checked;
  save();
  renderAll();
});

/* ----- バックアップ（書き出し／復元。手動・容量は端末のファイル1個だけ） ----- */

function backupFilename() {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  return `task-calendar-backup-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.json`;
}
function downloadBackup() {
  const blob = new Blob([JSON.stringify({ taskCalendarBackup: 2, savedAt: new Date().toISOString(), db }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = backupFilename();
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
$('#backup-export').addEventListener('click', () => {
  downloadBackup();
  flashToast('バックアップを書き出しました（ファイル）');
});
$('#backup-import').addEventListener('click', () => $('#backup-file').click());
$('#backup-file').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incoming = data.taskCalendarBackup ? data.db : (data.tasks && data.settings ? data : null); // 素のdbも受け付ける
    if (!incoming || !Array.isArray(incoming.tasks)) { flashToast('バックアップファイルではないようです'); return; }
    downloadBackup(); // 安全弁: 復元前に現在のデータも書き出しておく
    db = { ...defaultDb(), ...incoming, settings: { ...defaultDb().settings, ...(incoming.settings || {}) } };
    save();
    applyTheme(); applyFont(); applySize(); applyStyle(); applyZoomLock(); applyStickyHeader();
    renderAll();
    flashToast('バックアップから復元しました');
  } catch (err) {
    flashToast('読み込めませんでした（JSONファイルを選んでね）');
  }
});

/* ========== add / edit sheet ========== */

const sheetEls = {
  scrim: $('#sheet-scrim'),
  title: $('#sheet-title'),
  typeSeg: $('#type-seg'),
  fTitle: $('#f-title'),
  fDate: $('#f-date'),
  fTime: $('#f-time'),
  fMinutes: $('#f-minutes'),
  fRepeat: $('#f-repeat'),
  fMemo: $('#f-memo'),
  fDiary: $('#f-diary'),
  minutesCol: $('#minutes-col'),
  repeatHint: $('#repeat-hint'),
};

/* 会議の共有用テキスト（日時・リンク・ID・パスコードを埋める） */
function meetingShareText(it, url) {
  const d = fromKey(it.key);
  const timeStr = it.time ? `${it.time}${it.timeEnd ? ` - ${it.timeEnd}` : ''}` : '（時刻未設定）';
  const when = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${WD_JA[d.getDay()]}) ${timeStr}（Asia/Tokyo）`;
  let id = '';
  let pass = '';
  const meet = url.match(/meet\.google\.com\/([a-z-]+)/i);
  if (meet) { id = meet[1]; pass = '不要（Meetはリンクから参加）'; }
  const zoomId = url.match(/\/j\/(\d+)/);
  if (zoomId) id = zoomId[1];
  const zoomPw = url.match(/[?&]pwd=([^&]+)/);
  if (zoomPw) pass = decodeURIComponent(zoomPw[1]);
  return ['日時：' + when, 'リンク：' + url, 'ID：' + (id || '—'), 'パスコード：' + (pass || '—')].join('\n');
}

/* タップで開く詳細ビュー（読み取り）。右上ペンで編集シートへ */
let detailItem = null;
function openDetail(it) {
  detailItem = it;
  $('#detail-title').textContent = it.title;
  const isGcal = it.kind === 'gcal';
  $('#detail-edit').hidden = isGcal; // Googleの予定は編集不可
  const body = $('#detail-body');
  body.textContent = '';
  const row = (label, value) => {
    if (!value) return;
    const r = el('div', 'dt-row');
    r.append(el('span', 'dt-key', label));
    r.append(el('span', 'dt-val', value));
    body.append(r);
  };
  const d = fromKey(it.key);
  row('日付', `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD_JA[d.getDay()]}）`);
  const timeStr = it.time ? `${it.time}${it.timeEnd ? `〜${it.timeEnd}` : ''}` : '';
  row('時刻', timeStr);
  if (it.repeat) row('くりかえし', REPEAT_LABEL[it.repeat]);
  if (it.kind === 'task' && it.ref.minutes) row('所要時間', `${it.ref.minutes}分`);
  row('種類', isGcal ? 'Googleカレンダー' : it.kind === 'event' ? '予定' : 'タスク');
  if (!isGcal) {
    if ((it.ref.who || []).length) row('誰と', it.ref.who.join('、'));
    row('場所', it.ref.place);
    const cal = db.calendars.find((c) => c.id === it.ref.calendarId);
    if (cal && cal.id !== 'c-default') row('カレンダー', cal.name);
    const memo = memoFor(it);
    if (memo) { const r = el('div', 'dt-block'); r.append(el('span', 'dt-key', 'メモ')); r.append(el('p', 'dt-text', memo)); body.append(r); }
    const diary = diaryFor(it);
    if (diary) { const r = el('div', 'dt-block'); r.append(el('span', 'dt-key', '日記')); r.append(el('p', 'dt-text', diary)); body.append(r); }
  } else if (it.ref.place) {
    row('場所', it.ref.place);
  }
  // 会議リンク（アプリの予定 or GoogleのconferenceData）→「会議に参加」＋「共有用にコピー」
  const meetUrl = it.ref.meetUrl || it.ref.hangoutLink || null;
  if (meetUrl) {
    const join = el('a', 'cta join-btn');
    join.href = meetUrl;
    join.target = '_blank';
    join.rel = 'noopener';
    join.innerHTML = ICONS.video || '';
    join.append(el('span', '', '会議に参加'));
    body.append(join);
    const copyBtn = el('button', 'cta ghost join-btn');
    copyBtn.type = 'button';
    copyBtn.innerHTML = ICONS.copy || '';
    copyBtn.append(el('span', '', '共有用にコピー'));
    copyBtn.addEventListener('click', () => {
      const text = meetingShareText(it, meetUrl);
      navigator.clipboard?.writeText(text).then(() => flashToast('コピーしました')).catch(() => flashToast(text));
    });
    body.append(copyBtn);
  }
  if (it.kind === 'task') { // 完了トグルも詳細から
    const btn = el('button', `cta ${it.done ? 'ghost' : ''}`, it.done ? '完了を取り消す' : '完了にする');
    btn.type = 'button';
    btn.addEventListener('click', () => { toggleItem(it); $('#detail-scrim').hidden = true; });
    body.append(btn);
  }
  $('#detail-scrim').hidden = false;
}
$('#detail-close').addEventListener('click', () => { $('#detail-scrim').hidden = true; });
$('#detail-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
$('#detail-edit').addEventListener('click', () => {
  $('#detail-scrim').hidden = true;
  if (detailItem) openSheet('edit', { item: detailItem });
});

function openSheet(mode, { item = null, dateKey = null, time = null, timeEnd = null, type = null } = {}) {
  ui.editing = mode === 'edit' ? item : null;
  ui.sheetType = item ? item.kind : (type || 'task');
  sheetEls.title.textContent = mode === 'edit' ? '編集' : '追加';
  sheetEls.typeSeg.hidden = mode === 'edit'; // 種類はあとから変えない
  syncSheetType();

  if (item) {
    const r = item.ref;
    sheetEls.fTitle.value = r.title;
    sheetEls.fDate.value = r.repeat ? r.startDate : r.date;
    sheetEls.fTime.value = timeOn(r, item.key) || ''; // 繰り返しは「この日」の時刻を表示
    sheetEls.fMinutes.value = r.minutes || '';
    sheetEls.fRepeat.value = r.repeat || '';
    sheetEls.fMemo.value = memoFor(item) || '';
    sheetEls.fDiary.value = diaryFor(item) || '';
    sheetEls.repeatHint.hidden = !r.repeat;
    $('#f-time-end').value = timeEndOn(r, item.key) || '';
    $('#f-date-end').value = r.endDate || '';
    $('#f-place').value = r.place || '';
    $('#f-meeting').value = r.meetUrl || '';
    setOpt('#opt-push', Boolean(r.pushGoogle || r.gcalId));
    setOpt('#opt-meet', false);
    setOpt('#opt-month', !r.hideMonth);
    $('#f-invite').value = (r.attendees || []).join('、');
    $('#f-invite-note').value = r.inviteNote || '';
    buildWhoChips(Array.isArray(r.who) ? r.who : []);
  } else {
    sheetEls.fTitle.value = '';
    sheetEls.fDate.value = dateKey || (ui.view === 'month' ? (ui.selectedKey || todayKey()) : toKey(ui.cursor));
    sheetEls.fTime.value = time || '';
    sheetEls.fMinutes.value = '';
    sheetEls.fRepeat.value = '';
    sheetEls.fMemo.value = '';
    sheetEls.fDiary.value = '';
    sheetEls.repeatHint.hidden = true;
    $('#f-time-end').value = timeEnd || '';
    $('#f-date-end').value = '';
    $('#f-place').value = '';
    $('#f-meeting').value = '';
    setOpt('#opt-push', false);
    setOpt('#opt-meet', false);
    setOpt('#opt-month', true);
    $('#f-invite').value = '';
    $('#f-invite-note').value = '';
    buildWhoChips([]);
  }
  $('#f-gcal-sync').hidden = !gcalCanWrite(); // Google連携中のみ表示
  buildSheetColors(item ? (item.ref.color || '') : '');
  const calSel = $('#f-cal');
  calSel.textContent = '';
  for (const cal of db.calendars) {
    const o = document.createElement('option');
    o.value = cal.id;
    o.textContent = cal.name;
    calSel.append(o);
  }
  for (const code of db.sharedJoined) {
    const c = db.sharedCache[code];
    const o = document.createElement('option');
    o.value = SH_PREFIX + code;
    o.textContent = `${(c && c.title) || code}（共有）`;
    if (!fbUser || !c || c.role === 'viewer') o.disabled = true; // 閲覧専用・未ログインは選べない
    calSel.append(o);
  }
  calSel.value = item ? (item.ref.calendarId || 'c-default') : 'c-default';
  const single = db.calendars.length < 2 && !db.sharedJoined.length;
  calSel.hidden = single;
  $('#f-cal-label').hidden = single;
  sheetEls.scrim.hidden = false;
  sheetEls.fTitle.focus();
}
/* 「誰と」チップ（設定の「よく会う人」から。選択中の名前を is-on で保持） */
function buildWhoChips(selected) {
  const wrap = $('#f-who-chips');
  wrap.textContent = '';
  for (const name of db.people) {
    const b = el('button', `who-chip${selected.includes(name) ? ' is-on' : ''}`, name);
    b.type = 'button';
    b.dataset.name = name;
    b.addEventListener('click', () => b.classList.toggle('is-on'));
    wrap.append(b);
  }
  wrap.hidden = !db.people.length;
  // リストにない名前は自由入力欄へ
  $('#f-who').value = selected.filter((n) => !db.people.includes(n)).join('、');
  $('#f-who-suggest').textContent = '';
}

/* 自由入力の名前補完: よく会う人＋過去の予定に登場した名前から候補を出す */
function whoNameUniverse() {
  const s = new Set(db.people);
  for (const e of db.events) (e.who || []).forEach((n) => s.add(n));
  return [...s];
}
$('#f-who').addEventListener('input', () => {
  const input = $('#f-who');
  const box = $('#f-who-suggest');
  box.textContent = '';
  const parts = input.value.split(/[、,]/);
  const frag = parts[parts.length - 1].trim();
  if (!frag) return;
  const already = [
    ...parts.slice(0, -1).map((s) => s.trim()),
    ...[...document.querySelectorAll('#f-who-chips .who-chip.is-on')].map((b) => b.dataset.name),
  ];
  const cands = whoNameUniverse()
    .filter((n) => n.toLowerCase().includes(frag.toLowerCase()) && n !== frag && !already.includes(n))
    .slice(0, 5);
  for (const n of cands) {
    const b = el('button', 'who-chip who-suggest', n);
    b.type = 'button';
    b.addEventListener('click', () => {
      parts[parts.length - 1] = n;
      input.value = parts.map((s) => s.trim()).filter(Boolean).join('、');
      box.textContent = '';
      input.focus();
    });
    box.append(b);
  }
})

function buildSheetColors(current) {
  const wrap = $('#f-colors');
  wrap.textContent = '';
  const options = [['', 'なし'], ...Object.entries(ACCENTS).map(([id, a]) => [id, a.name])];
  for (const [id, name] of options) {
    const sw = el('button', `accent-swatch${id === '' ? ' f-colors-none' : ''}${current === id ? ' is-active' : ''}`);
    sw.type = 'button';
    sw.dataset.color = id;
    if (id === '') sw.textContent = 'なし';
    else sw.style.background = effectiveDark() ? ACCENTS[id].dark : ACCENTS[id].light;
    sw.setAttribute('aria-label', name);
    if (current === id && id !== '') sw.innerHTML = ICONS.check;
    sw.addEventListener('click', () => {
      wrap.querySelectorAll('.accent-swatch').forEach((b) => { b.classList.remove('is-active'); if (b.dataset.color !== '') b.innerHTML = ''; });
      sw.classList.add('is-active');
      if (id !== '') sw.innerHTML = ICONS.check;
    });
    wrap.append(sw);
  }
}
function closeSheet() {
  sheetEls.scrim.hidden = true;
  ui.editing = null;
}
sheetEls.scrim.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeSheet(); });
$('#sheet-close').addEventListener('click', closeSheet);
$('#r-close').addEventListener('click', () => { $('#routine-scrim').hidden = true; routineEditing = null; });
$('#share-close').addEventListener('click', () => { $('#share-scrim').hidden = true; });

sheetEls.typeSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-type]');
  if (!btn) return;
  ui.sheetType = btn.dataset.type;
  syncSheetType();
});
function syncSheetType() {
  sheetEls.typeSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.type === ui.sheetType));
  sheetEls.minutesCol.hidden = ui.sheetType !== 'task'; // 所要時間はタスクのみ（繰り返しは両方）
  $('#event-only-fields').hidden = ui.sheetType !== 'event';
}

// カスタムトグル（iOSでネイティブcheckboxがシート内で反応しづらいため自前）
function setOpt(sel, on) { $(sel).classList.toggle('is-on', !!on); }
function getOpt(sel) { return $(sel).classList.contains('is-on'); }
$('#opt-push').addEventListener('click', () => {
  setOpt('#opt-push', !getOpt('#opt-push'));
  if (!getOpt('#opt-push')) setOpt('#opt-meet', false); // 登録オフならMeetもオフ
});
$('#opt-month').addEventListener('click', () => setOpt('#opt-month', !getOpt('#opt-month')));
$('#opt-meet').addEventListener('click', () => {
  const on = !getOpt('#opt-meet');
  setOpt('#opt-meet', on);
  if (on) setOpt('#opt-push', true); // Meet発行はGoogle登録が前提
});
// 「＋ Zoom を開く」→ 新規会議ページを開いて、発行されたURLを会議リンク欄に貼ってもらう
$('#f-meeting-btns').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-meet]');
  if (!btn) return;
  window.open(btn.dataset.meet, '_blank', 'noopener');
  flashToast('新しい会議を作成→発行されたURLを会議リンク欄に貼ってね');
  $('#f-meeting').focus();
});

$('#fab').addEventListener('click', () => openSheet('add', {}));

$('#sheet-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = sheetEls.fTitle.value.trim();
  if (!title) {
    sheetEls.fTitle.classList.remove('shake');
    void sheetEls.fTitle.offsetWidth; // 連続submitでも振動し直す
    sheetEls.fTitle.classList.add('shake');
    sheetEls.fTitle.focus();
    return;
  }
  const dateKey = sheetEls.fDate.value || todayKey();
  let time = sheetEls.fTime.value || null;
  let timeEnd = $('#f-time-end').value || null;
  if (time && timeEnd && timeEnd < time) [time, timeEnd] = [timeEnd, time]; // 逆なら入れ替え
  const repeatVal = sheetEls.fRepeat.value || null;
  let endDate = $('#f-date-end').value || null; // 複数日予定の終了日
  if (endDate && (endDate <= dateKey || repeatVal)) endDate = null; // 開始日以前・繰り返しは複数日にしない
  const place = $('#f-place').value.trim() || null;
  const whoSel = [...document.querySelectorAll('#f-who-chips .who-chip.is-on')].map((b) => b.dataset.name);
  const whoFree = $('#f-who').value.split(/[、,]/).map((s) => s.trim()).filter(Boolean);
  const who = [...whoSel, ...whoFree.filter((n) => !whoSel.includes(n))];
  const rawMin = parseInt(sheetEls.fMinutes.value, 10);
  const minutes = Number.isInteger(rawMin) && rawMin >= 1 && rawMin <= 600 ? rawMin : null;
  const repeat = sheetEls.fRepeat.value || null;
  const memo = sheetEls.fMemo.value.trim() || null;
  const diary = sheetEls.fDiary.value.trim() || null;
  const meetUrl = $('#f-meeting').value.trim() || null;
  const pushGoogle = getOpt('#opt-push');
  const autoMeet = getOpt('#opt-meet');
  const attendees = $('#f-invite').value.split(/[、,\s]+/).map((s) => s.trim()).filter((s) => s.includes('@'));
  const inviteNote = $('#f-invite-note').value.trim() || null;
  const color = $('#f-colors .accent-swatch.is-active')?.dataset.color || null;
  const hideMonth = !getOpt('#opt-month'); // 「月」カレンダーに表示しない
  const calSelV = $('#f-cal').value;
  const calendarId = calSelV && calSelV !== 'c-default' ? calSelV : null;
  if (sharedBlocked(calendarId)) return; // 閲覧専用の共有カレンダーには追加できない
  if (ui.editing && sharedBlocked(ui.editing.ref.calendarId)) return;

  let syncTarget = null; // 保存後にGoogleへ反映する予定
  if (ui.editing) {
    applyEdit(ui.editing, { title, dateKey, time, minutes, repeat, memo, diary, color, calendarId, timeEnd, place, who, meetUrl, endDate });
    if (hideMonth) ui.editing.ref.hideMonth = true; else delete ui.editing.ref.hideMonth;
    if (ui.editing.kind === 'event') {
      ui.editing.ref.pushGoogle = pushGoogle;
      ui.editing.ref.attendees = attendees.length ? attendees : null;
      ui.editing.ref.inviteNote = inviteNote;
      if (pushGoogle && gcalCanWrite()) syncTarget = { ev: ui.editing.ref, key: ui.editing.ref.date || dateKey, meet: autoMeet };
    }
  } else if (ui.sheetType === 'event') {
    const base = { id: newId('e'), title, time, timeEnd: time ? timeEnd : null, place, who: who.length ? who : null, meetUrl, memo, diary, pushGoogle, attendees: attendees.length ? attendees : null, inviteNote, color, calendarId, hideMonth: hideMonth || undefined, createdAt: Date.now() };
    const ev = repeat
      ? { ...base, repeat, startDate: dateKey, exDates: [], memoDates: {}, diaryDates: {} }
      : { ...base, date: dateKey, endDate };
    db.events.push(ev);
    ui.justAddedId = `${ev.id}@${dateKey}`;
    if (pushGoogle && gcalCanWrite() && !repeat) syncTarget = { ev, key: dateKey, meet: autoMeet };
  } else if (repeat) {
    const t = { id: newId('t'), title, time, timeEnd: time ? timeEnd : null, minutes, repeat, startDate: dateKey, doneDates: {}, exDates: [], memo, memoDates: {}, diary, diaryDates: {}, color, calendarId, hideMonth: hideMonth || undefined, createdAt: Date.now() };
    db.tasks.push(t);
    ui.justAddedId = `${t.id}@${dateKey}`;
  } else {
    const t = { id: newId('t'), title, date: dateKey, time, timeEnd: time ? timeEnd : null, minutes, done: false, doneAt: null, memo, diary, color, calendarId, hideMonth: hideMonth || undefined, createdAt: Date.now() };
    db.tasks.push(t);
    ui.justAddedId = `${t.id}@${dateKey}`;
  }
  save();
  closeSheet();
  renderAll();
  ui.justAddedId = null;
  if (syncTarget) gcalSyncEvent(syncTarget.ev, syncTarget.key, syncTarget.meet); // 非同期でGoogleへ
});

function newId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

function setPerDayField(r, base, datesKey, key, val, perDay) {
  if (perDay) {
    r[datesKey] = r[datesKey] || {};
    if (val) r[datesKey][key] = val; else delete r[datesKey][key];
  } else if (val) {
    r[base] = val;
  } else {
    delete r[base];
  }
}

function applyEdit(item, { title, dateKey, time, minutes, repeat, memo, diary, color, calendarId, timeEnd, place, who, meetUrl, endDate }) {
  const r = item.ref;
  r.title = title;
  r.color = color;
  r.calendarId = calendarId;
  if (item.kind === 'event') {
    r.place = place;
    r.who = who && who.length ? who : null;
    r.meetUrl = meetUrl;
    if (!repeat && endDate && endDate > dateKey) r.endDate = endDate; else delete r.endDate; // 複数日予定の終了日
  }
  // メモ・日記・時刻・タイマー時間: 繰り返し中は「この日」の分として独立保存、単発は本体に
  const perDay = Boolean(r.repeat) && Boolean(repeat);
  setPerDayField(r, 'memo', 'memoDates', item.key, memo, perDay);
  setPerDayField(r, 'diary', 'diaryDates', item.key, diary, perDay);
  setPerDayField(r, 'time', 'timeDates', item.key, time || null, perDay);
  setPerDayField(r, 'timeEnd', 'timeEndDates', item.key, time ? timeEnd : null, perDay);
  if (item.kind !== 'event') setPerDayField(r, 'minutes', 'minutesDates', item.key, minutes, perDay);
  // 繰り返しの切替（タスク・予定共通）
  const wasRepeat = Boolean(r.repeat);
  const nowRepeat = Boolean(repeat);
  if (nowRepeat) {
    r.repeat = repeat;
    r.startDate = dateKey;
    r.exDates = r.exDates || [];
    if (item.kind === 'task' && !wasRepeat) {
      r.doneDates = r.done && r.date ? { [r.date]: r.doneAt || Date.now() } : {};
      delete r.done; delete r.doneAt;
    }
    delete r.date;
  } else {
    r.date = dateKey;
    if (wasRepeat) { // 繰り返し→単発へ
      if (item.kind === 'task') {
        r.done = Boolean((r.doneDates || {})[dateKey]);
        r.doneAt = (r.doneDates || {})[dateKey] || null;
        delete r.doneDates;
      }
      delete r.repeat; delete r.startDate; delete r.exDates;
    }
  }
}

/* ========== countdown timer（実行中は1つ・復元可能） ========== */

let tickId = null;

let audioCtx = null;
function ensureAudio() { // must be called from a user gesture (autoplay policy)
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) { audioCtx = null; }
}
function chime() {
  if (!audioCtx) return;
  try {
    [659.25, 987.77].forEach((freq, i) => { // E5 → B5, quiet and short
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + 1);
    });
  } catch (err) { /* sound is a garnish — never break the timer for it */ }
}

function fmtMs(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function remainingMs() {
  const r = db.running;
  if (!r) return 0;
  return r.paused || r.finished ? (r.remainingMs || 0) : Math.max(0, r.endAt - Date.now());
}

function startTimer(it) {
  ensureAudio();
  db.running = {
    taskId: it.ref.id,
    dateKey: it.key,
    title: it.title,
    time: it.time || null,
    totalMs: it.minutes * 60 * 1000,
    startedAt: Date.now(), // タイマーを始めた実時刻（完了時の逆算に使う）
    endAt: Date.now() + it.minutes * 60 * 1000,
    remainingMs: null,
    paused: false,
    finished: false,
  };
  save();
  startTick();
  openFocus();
  renderAll();
}

function startTick() {
  clearInterval(tickId);
  tickId = setInterval(() => {
    const r = db.running;
    if (!r || r.paused || r.finished) return;
    if (r.endAt - Date.now() <= 0) finishTimer();
    updateTimerUI();
  }, 200);
}

function pauseTimer() {
  const r = db.running;
  if (!r || r.paused || r.finished) return;
  r.remainingMs = Math.max(0, r.endAt - Date.now());
  r.endAt = null;
  r.paused = true;
  save();
  updateTimerUI();
}
function resumeTimer() {
  const r = db.running;
  if (!r) return;
  if (r.finished) { r.finished = false; r.remainingMs = r.totalMs; } // もう一度
  r.endAt = Date.now() + (r.remainingMs ?? r.totalMs);
  r.remainingMs = null;
  r.paused = false;
  save();
  updateTimerUI();
}
function finishTimer() {
  const r = db.running;
  if (!r) return;
  const title = r.title || 'タイマー';
  r.finished = true;
  r.paused = false;
  r.remainingMs = 0;
  r.endAt = null;
  save();
  chime();
  notifyTimerDone(title);
  updateTimerUI();
}
// 終了通知: バイブ（Android）＋通知バナー（許可時）。音はchime()で別途
function notifyTimerDone(title) {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (err) { /* 非対応端末は無視 */ }
  if (!db.settings.timerNotify) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const body = `「${title}」が終わりました`;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification('タイマー終了', { body, tag: 'tc-timer', vibrate: [200, 100, 200] })).catch(() => { new Notification('タイマー終了', { body }); });
    } else {
      new Notification('タイマー終了', { body });
    }
  } catch (err) { /* 通知が使えなくてもタイマー自体は完了している */ }
}
function stopTimer() { // 実行を中断してリセット（タスクは未完了のまま）
  db.running = null;
  save();
  closeFocus();
  document.title = BASE_TITLE;
  renderAll();
}
function completeRunning() {
  const r = db.running;
  if (!r) return;
  const t = db.tasks.find((x) => x.id === r.taskId);
  if (t && !taskDoneOn(t, r.dateKey)) {
    if (t.repeat) { t.doneDates = t.doneDates || {}; t.doneDates[r.dateKey] = Date.now(); }
    else { t.done = true; t.doneAt = Date.now(); }
    autoFillTimerTime(t, r.dateKey, r); // 開始/終了時刻を実績で自動記録
  }
  db.running = null;
  save();
  closeFocus();
  document.title = BASE_TITLE;
  renderAll();
}

function updateTimerUI() {
  const r = db.running;
  if (!r) return;
  const rem = remainingMs();
  const label = fmtMs(rem);
  const progress = r.totalMs > 0 ? rem / r.totalMs : 0;
  document.title = r.paused ? BASE_TITLE : `${label}｜${BASE_TITLE}`;

  const focus = $('#focus');
  if (!focus.hidden) {
    $('#focus-time').textContent = label;
    $('#ring-fg').style.strokeDashoffset = String(FOCUS_CIRC * (1 - progress));
    focus.classList.toggle('is-paused', r.paused && !r.finished);
    focus.classList.toggle('is-finished', r.finished);
    $('#timer-toggle').innerHTML = (r.paused || r.finished) ? ICONS.play : ICONS.pause;
    $('#focus-set').textContent = r.finished
      ? 'おつかれさま！'
      : `SET ${Math.round(r.totalMs / 60000)}分${r.time ? ` ・ ${r.time}` : ''}`;
  }
  const runFg = document.querySelector('.run-card .rr-fg');
  if (runFg) {
    runFg.style.strokeDashoffset = String(RUN_CIRC * (1 - progress));
    const timeEl = document.querySelector('.run-card .run-time');
    if (timeEl) timeEl.textContent = label;
  }
}

function buildRunCard() {
  const r = db.running;
  const card = el('div', 'run-card');
  card.setAttribute('role', 'button');
  card.innerHTML = `
    <span class="run-ringwrap">
      <svg class="run-ring" viewBox="0 0 88 88" aria-hidden="true">
        <circle class="rr-bg" cx="44" cy="44" r="40"/>
        <circle class="rr-fg" cx="44" cy="44" r="40"/>
      </svg>
      ${r.paused || r.finished ? ICONS.play : ICONS.pause}
    </span>
    <span class="run-info">
      <span class="run-title"></span>
      <div class="run-time mono">--:--</div>
      <span class="run-set mono">SET ${Math.round(r.totalMs / 60000)}分${r.finished ? ' ・ 時間になりました' : r.paused ? ' ・ 一時停止中' : ''}</span>
    </span>
    <button class="run-expand" aria-label="フォーカス画面を開く">${ICONS.maximize}</button>`;
  card.querySelector('.run-title').textContent = r.title;
  card.addEventListener('click', () => { openFocus(); });
  setTimeout(updateTimerUI, 0);
  return card;
}

function openFocus() {
  const r = db.running;
  if (!r) return;
  $('#focus-task').textContent = r.title;
  $('#focus').hidden = false;
  document.body.style.overflow = 'hidden';

  // 「つぎ」= 今日の未完了・時間つきタスクのうち実行中でないもの
  const next = itemsFor(todayKey()).find((i) => i.kind === 'task' && !i.done && i.minutes && i.ref.id !== r.taskId);
  $('#focus-next').hidden = !next;
  if (next) {
    $('#focus-next-title').textContent = next.title;
    $('#focus-next-time').textContent = next.time || `${next.minutes}分`;
  }
  updateTimerUI();
}
function closeFocus() {
  $('#focus').hidden = true;
  document.body.style.overflow = '';
}

$('#focus-close').addEventListener('click', () => { closeFocus(); renderAll(); }); // タイマーは走り続ける
$('#timer-stop').addEventListener('click', stopTimer);
$('#timer-done').addEventListener('click', completeRunning);
$('#timer-toggle').addEventListener('click', () => {
  const r = db.running;
  if (!r) return;
  if (r.paused || r.finished) resumeTimer();
  else pauseTimer();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#focus').hidden) { closeFocus(); renderAll(); return; }
  if (!$('#detail-scrim').hidden) { $('#detail-scrim').hidden = true; return; }
  if (!$('#anniv-scrim').hidden) { $('#anniv-scrim').hidden = true; return; }
  if (!$('#search-scrim').hidden) { $('#search-scrim').hidden = true; return; }
  if (!sheetEls.scrim.hidden) { closeSheet(); return; }
  if (!$('#confirm-scrim').hidden) { closeConfirm(); return; }
  if (!$('#picker-scrim').hidden) { closePicker(); return; }
  if (!$('#routine-scrim').hidden) { $('#routine-scrim').hidden = true; return; }
  if (!$('#share-scrim').hidden) { $('#share-scrim').hidden = true; return; }
  if (!$('#rdel-scrim').hidden) { $('#rdel-scrim').hidden = true; return; }
  if (!$('#vb-scrim').hidden) { $('#vb-scrim').hidden = true; return; }
  if (!$('#vb-slot-scrim').hidden) $('#vb-slot-scrim').hidden = true;
});


/* ========== v4: ルーティンパッケージ ========== */

const R_DEFAULT_TARGET = 3; // 週3日でOK（仕様§7）

function routineTasks(r) { return db.tasks.filter((t) => t.routineId === r.id); }
// ルーティンに属する項目（タスク型はdb.tasks、予定型はdb.events）
function routineItems(r) { return [...db.tasks.filter((t) => t.routineId === r.id), ...db.events.filter((e) => e.routineId === r.id)]; }
function routineArr(r) { return (r.type === 'event') ? db.events : db.tasks; }
function routineDoneDay(r, key) {
  return db.tasks.some((t) => t.routineId === r.id && taskDoneOn(t, key) && (t.repeat ? true : t.date === key));
}
function routineWeek(r, weekStart) {
  const days = [];
  for (let i = 0; i < 7; i += 1) days.push(routineDoneDay(r, toKey(addDays(weekStart, i))));
  const done = days.filter(Boolean).length;
  return { days, done, pass: done >= (r.targetPerWeek || R_DEFAULT_TARGET) };
}
function routineStreakWeeks(r) {
  let s = startOfWeekMon(new Date());
  let n = routineWeek(r, s).pass ? 1 : 0;
  s = addDays(s, -7);
  while (s >= fromKey(r.startDate || todayKey()) || routineWeek(r, s).pass) {
    if (!routineWeek(r, s).pass) break;
    n += 1;
    s = addDays(s, -7);
  }
  return n;
}

function renderRoutines() {
  const body = $('#routines-body');
  body.textContent = '';

  // ルーティン｜パッケージ｜ビジョン 切替
  const rvSeg = el('div', 'seg rv-seg');
  [['routines', 'ルーティン'], ['packages', 'パッケージ'], ['vision', 'ビジョン']].forEach(([v, label]) => {
    const b = el('button', `seg-btn${(ui.routineTab || 'routines') === v ? ' is-active' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => { ui.routineTab = v; renderAll(); });
    rvSeg.append(b);
  });
  body.append(rvSeg);
  if ((ui.routineTab || 'routines') === 'vision') { vbPicked = null; renderVisions(body); return; }
  if ((ui.routineTab || 'routines') === 'packages') { renderPackages(body); return; }

  const ctaRow = el('div', 'r-cta-row');
  const addBtn = el('button', 'cta', '＋ 新しいルーティン');
  addBtn.type = 'button';
  addBtn.addEventListener('click', () => openRoutineSheet(null));
  const importBtn = el('button', 'cta ghost', '読み込む');
  importBtn.type = 'button';
  importBtn.addEventListener('click', openImportSheet);
  ctaRow.append(addBtn, importBtn);
  body.append(ctaRow);

  if (db.routines.length === 0) {
    body.append(el('p', 'empty', 'ゴールに向けた習慣の束を「ルーティン」としてまとめられます。例：「ダイエット計画」に ウォーキング・体重記録…。週の目標日数をクリアすると合格！'));
    return;
  }

  const weekStart = startOfWeekMon(new Date());
  const tKey = todayKey();
  for (const r of db.routines) {
    const accent = (ACCENTS[r.color] || ACCENTS.green)[effectiveDark() ? 'dark' : 'light'];
    const card = el('div', `r-card${r.pausedFrom ? ' is-paused' : ''}`);
    card.style.borderLeftColor = accent;

    const head = el('div', 'r-head');
    const titleRow = el('div', 'r-title-row');
    titleRow.append(el('span', 'r-title', r.title));
    if (r.pausedFrom) titleRow.append(el('span', 'r-paused-chip', '一時停止中'));
    head.append(titleRow);
    if (r.goal) head.append(el('p', 'r-goal', `ゴール: ${r.goal}`));
    if (r.periodStart || r.periodEnd) { // プロジェクト期間
      const fmt = (k) => { if (!k) return ''; const d = fromKey(k); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; };
      const over = r.periodEnd && todayKey() > r.periodEnd;
      const p = el('p', `r-period${over ? ' is-over' : ''}`);
      p.innerHTML = ICONS.calendar;
      p.append(` ${fmt(r.periodStart) || '開始'}〜${fmt(r.periodEnd) || '無期限'}${over ? '（終了）' : ''}`);
      head.append(p);
    }

    if (r.type === 'event') { // 予定ルーティンは達成トラッキングなし
      head.append(el('span', 'r-type-chip', '予定'));
    } else {
      const w = routineWeek(r, weekStart);
      const weekRow = el('div', 'r-week');
      const dots = el('span', 'r-dots');
      w.days.forEach((done, i) => {
        const key = toKey(addDays(weekStart, i));
        const d = el('span', `rdot${done ? ' done' : ''}${key === tKey ? ' today' : ''}`);
        if (done) d.style.background = accent;
        dots.append(d);
      });
      weekRow.append(dots);
      weekRow.append(el('span', 'r-count', `${w.done}/${r.targetPerWeek || R_DEFAULT_TARGET}日`));
      if (w.pass) weekRow.append(el('span', 'pass-chip', '今週合格'));
      const streakEl = el('span', 'r-streak');
      streakEl.append('連続 ');
      streakEl.append(el('b', '', String(routineStreakWeeks(r))));
      streakEl.append('週');
      weekRow.append(streakEl);
      head.append(weekRow);
    }
    card.append(head);

    const list = el('ul', 'r-item-list');
    for (const t of routineItems(r)) {
      const li = el('li');
      li.append(el('span', 'chip', repeatLabelOf(t)));
      li.append(el('span', 'r-item-title', t.title));
      if (t.time) li.append(el('span', 'r-item-time', t.time));
      if (t.minutes) li.append(el('span', 'r-item-time', `${t.minutes}分`));
      list.append(li);
    }
    if (routineItems(r).length === 0) {
      const li = el('li');
      li.append(el('span', 'r-item-title', `${r.type === 'event' ? '予定' : 'タスク'}がまだありません（編集から追加）`));
      list.append(li);
    }
    card.append(list);

    const actions = el('div', 'r-actions');
    const toggle = el('button', 'pill-btn', r.pausedFrom ? '再開する' : '一時停止');
    toggle.type = 'button';
    toggle.addEventListener('click', () => {
      r.pausedFrom = r.pausedFrom ? null : todayKey();
      r.active = !r.pausedFrom;
      save(); renderAll();
    });
    actions.append(toggle);
    actions.append(el('span', 'spacer'));
    const editBtn = el('button', 'iconbtn');
    editBtn.type = 'button'; editBtn.setAttribute('aria-label', '編集');
    editBtn.innerHTML = ICONS.pencil;
    editBtn.addEventListener('click', () => openRoutineSheet(r));
    const shareBtn = el('button', 'iconbtn');
    shareBtn.type = 'button'; shareBtn.setAttribute('aria-label', '共有');
    shareBtn.innerHTML = ICONS.copy;
    shareBtn.addEventListener('click', () => openShareSheet(r));
    const delBtn = el('button', 'iconbtn');
    delBtn.type = 'button'; delBtn.setAttribute('aria-label', '削除');
    delBtn.innerHTML = ICONS.trash;
    delBtn.addEventListener('click', () => {
      rdelTarget = r;
      $('#rdel-name').textContent = `「${r.title}」`;
      $('#rdel-scrim').hidden = false;
    });
    actions.append(editBtn, shareBtn, delBtn);
    card.append(actions);

    // タップで直近12週の合否履歴を開閉
    head.addEventListener('click', () => {
      const existing = card.querySelector('.r-history');
      if (existing) { existing.remove(); return; }
      const hist = el('div', 'r-history');
      for (let wk = 0; wk < 12; wk += 1) {
        const ws = addDays(weekStart, -7 * wk);
        if (toKey(ws) < (r.startDate || tKey) && wk > 0) break;
        const info = routineWeek(r, ws);
        const row = el('div', 'r-hist-row');
        row.append(el('span', 'r-hist-label', `${ws.getMonth() + 1}/${ws.getDate()}〜`));
        const hd = el('span', 'r-dots');
        info.days.forEach((done) => {
          const d = el('span', `rdot${done ? ' done' : ''}`);
          if (done) d.style.background = accent;
          hd.append(d);
        });
        row.append(hd);
        row.append(info.pass ? el('span', 'pass-chip r-hist-pass', '合格') : el('span', 'r-hist-none', '─'));
        hist.append(row);
      }
      card.append(hist);
    });

    body.append(card);
  }
}

/* ----- 作成／編集シート ----- */

let routineEditing = null; // 編集中のルーティン（nullなら新規）
let rdelTarget = null;

const WD_MON_FIRST = [1, 2, 3, 4, 5, 6, 0]; // 月〜日
function routineItemRow(data = {}) {
  const row = el('div', 'r-item-row');
  const title = document.createElement('input');
  title.type = 'text'; title.maxLength = 80; title.placeholder = '例：ウォーキング'; title.value = data.title || '';
  const rep = document.createElement('select');
  [['daily', '毎日'], ['weekday', '平日'], ['weekend', '土日祝'], ['weekdays', '曜日で'], ['weekly', '毎週'], ['monthly', '毎月']].forEach(([v, l]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = l; rep.append(o);
  });
  rep.value = data.repeat || 'daily';
  const time = document.createElement('input');
  time.type = 'time'; time.step = 300; time.className = 'mono'; time.value = data.time || '';
  const min = document.createElement('input');
  min.type = 'number'; min.min = 5; min.max = 600; min.step = 5; min.placeholder = '分'; min.className = 'mono'; min.value = data.minutes || '';
  const rm = el('button', 'del-btn');
  rm.type = 'button'; rm.setAttribute('aria-label', 'この行を削除'); rm.innerHTML = ICONS.trash;
  rm.addEventListener('click', () => row.remove());
  // 曜日チップ（「曜日で」を選んだときだけ表示。出勤=月〜金 など）
  const wd = el('div', 'r-wd');
  const chosen = new Set(data.weekdays || []);
  const wdBtns = WD_MON_FIRST.map((dow) => {
    const b = el('button', `r-wd-chip${chosen.has(dow) ? ' is-on' : ''}`, WD_JA[dow]);
    b.type = 'button'; b.dataset.dow = String(dow);
    b.addEventListener('click', () => b.classList.toggle('is-on'));
    wd.append(b);
    return b;
  });
  const syncWd = () => { wd.style.display = rep.value === 'weekdays' ? 'flex' : 'none'; };
  rep.addEventListener('change', syncWd);
  syncWd();
  row.append(title, rep, time, min, rm, wd);
  if (data.itemId) row.dataset.itemId = data.itemId;
  row._fields = { title, rep, time, min, getWeekdays: () => wdBtns.filter((b) => b.classList.contains('is-on')).map((b) => Number(b.dataset.dow)) };
  return row;
}

function openRoutineSheet(r) {
  routineEditing = r;
  $('#r-sheet-title').textContent = r ? 'ルーティンを編集' : '新しいルーティン';
  $('#r-title').value = r ? r.title : '';
  $('#r-goal').value = r ? (r.goal || '') : '';
  $('#r-start').value = r ? (r.periodStart || '') : '';
  $('#r-end').value = r ? (r.periodEnd || '') : '';
  $('#r-target').value = String(r ? (r.targetPerWeek || R_DEFAULT_TARGET) : R_DEFAULT_TARGET);
  const colors = $('#r-colors');
  colors.textContent = '';
  const current = r ? (r.color || 'green') : 'green';
  for (const [id, a] of Object.entries(ACCENTS)) {
    const swx = el('button', `accent-swatch${current === id ? ' is-active' : ''}`);
    swx.type = 'button';
    swx.dataset.color = id;
    swx.style.background = effectiveDark() ? a.dark : a.light;
    swx.setAttribute('aria-label', a.name);
    if (current === id) swx.innerHTML = ICONS.check;
    swx.addEventListener('click', () => {
      colors.querySelectorAll('.accent-swatch').forEach((b) => { b.classList.remove('is-active'); b.innerHTML = ''; });
      swx.classList.add('is-active');
      swx.innerHTML = ICONS.check;
    });
    colors.append(swx);
  }
  const items = $('#r-items');
  items.textContent = '';
  if (r) {
    for (const t of routineItems(r)) {
      items.append(routineItemRow({ itemId: t.id, title: t.title, repeat: t.repeat, weekdays: t.weekdays, time: t.time, minutes: t.minutes }));
    }
  }
  if (!items.children.length) items.append(routineItemRow());
  setOpt('#opt-r-month', !(r && r.hideMonth));
  setRType(r && r.type === 'event' ? 'event' : 'task');
  $('#routine-scrim').hidden = false;
  $('#r-title').focus();
}
$('#opt-r-month').addEventListener('click', () => setOpt('#opt-r-month', !getOpt('#opt-r-month')));
$('#r-add-item').addEventListener('click', () => $('#r-items').append(routineItemRow()));
$('#routine-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) $('#routine-scrim').hidden = true; });

// ルーティンの種類（タスク＝習慣 / 予定＝出勤・休みなど）
let rSheetType = 'task';
function setRType(t) {
  rSheetType = t === 'event' ? 'event' : 'task';
  const isEvent = rSheetType === 'event';
  document.querySelectorAll('#r-type-seg button').forEach((b) => b.classList.toggle('is-active', b.dataset.rtype === rSheetType));
  const goalLabel = $('#r-goal-label');
  if (goalLabel) goalLabel.textContent = isEvent ? 'メモ（任意）' : 'ゴール（なんのため？）';
  const itemsLabel = $('#r-items-label');
  if (itemsLabel) itemsLabel.textContent = isEvent ? '予定（曜日ごとに設定できます）' : '習慣タスク（チェックさえ入れば合格 — 時間は目安）';
  const addBtn = $('#r-add-item');
  if (addBtn) addBtn.textContent = isEvent ? '＋ 予定を追加' : '＋ 習慣タスクを追加';
  const targetCol = $('#r-target') ? $('#r-target').closest('.f-col') : null;
  if (targetCol) targetCol.style.display = isEvent ? 'none' : ''; // 週の目標は習慣のみ
}
document.querySelectorAll('#r-type-seg button').forEach((b) => b.addEventListener('click', () => setRType(b.dataset.rtype)));

$('#r-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#r-title').value.trim();
  if (!title) {
    $('#r-title').classList.remove('shake');
    void $('#r-title').offsetWidth;
    $('#r-title').classList.add('shake');
    $('#r-title').focus();
    return;
  }
  const goal = $('#r-goal').value.trim() || null;
  const color = $('#r-colors .accent-swatch.is-active')?.dataset.color || 'green';
  const target = parseInt($('#r-target').value, 10) || R_DEFAULT_TARGET;
  let periodStart = $('#r-start').value || null;
  let periodEnd = $('#r-end').value || null;
  if (periodStart && periodEnd && periodEnd < periodStart) [periodStart, periodEnd] = [periodEnd, periodStart];

  const hideMonth = !getOpt('#opt-r-month');
  const rtype = rSheetType === 'event' ? 'event' : 'task';
  let r = routineEditing;
  if (!r) {
    r = { id: newId('r'), title, goal, color, type: rtype, targetPerWeek: target, active: true, pausedFrom: null, startDate: todayKey(), periodStart, periodEnd, hideMonth: hideMonth || undefined, createdAt: Date.now() };
    db.routines.push(r);
  } else {
    r.title = title; r.goal = goal; r.color = color; r.type = rtype; r.targetPerWeek = target; r.periodStart = periodStart; r.periodEnd = periodEnd;
    if (hideMonth) r.hideMonth = true; else delete r.hideMonth;
  }

  // アイテム行と実データ（タスク or 予定）を同期（行が消えた=削除、idなし=新規）
  const arr = rtype === 'event' ? db.events : db.tasks;
  const keptIds = new Set();
  for (const row of $('#r-items').children) {
    const f = row._fields;
    const t2 = f.title.value.trim();
    if (!t2) continue;
    const minRaw = parseInt(f.min.value, 10);
    const minutes = Number.isInteger(minRaw) && minRaw >= 1 && minRaw <= 600 ? minRaw : null;
    const time = f.time.value || null;
    let repeat = f.rep.value;
    let weekdays = repeat === 'weekdays' ? f.getWeekdays() : null;
    if (repeat === 'weekdays' && (!weekdays || !weekdays.length)) { repeat = 'daily'; weekdays = null; } // 曜日未選択なら毎日扱い
    const existing = row.dataset.itemId ? arr.find((x) => x.id === row.dataset.itemId) : null;
    if (existing) {
      existing.title = t2; existing.time = time; existing.repeat = repeat;
      if (weekdays) existing.weekdays = weekdays; else delete existing.weekdays;
      if (rtype === 'event') delete existing.minutes; else existing.minutes = minutes;
      keptIds.add(existing.id);
    } else {
      const base = { id: newId(rtype === 'event' ? 'e' : 't'), routineId: r.id, title: t2, time, repeat, weekdays: weekdays || undefined, startDate: r.startDate || todayKey(), exDates: [], createdAt: Date.now() };
      if (rtype === 'event') { arr.push(base); } else { arr.push({ ...base, minutes, doneDates: {}, memo: null, memoDates: {} }); }
      keptIds.add(base.id);
    }
  }
  // 行から消えた項目は「過去の記録を残す」ため、削除ではなく昨日でカット（過去がなければ削除）
  const cutoff = toKey(addDays(new Date(), -1));
  const handleRemoved = (x) => {
    if (x.startDate && x.startDate > cutoff) return false; // 過去がない（今日以降開始）→ 削除
    delete x.routineId; if (x.repeat) x.repeatEnd = cutoff; return true; // 過去あり → 残して未来だけ止める
  };
  db.tasks = db.tasks.filter((t) => t.routineId !== r.id || keptIds.has(t.id) || handleRemoved(t));
  db.events = db.events.filter((e) => e.routineId !== r.id || keptIds.has(e.id) || handleRemoved(e));

  save();
  $('#routine-scrim').hidden = true;
  routineEditing = null;
  renderAll();
});

/* ----- 削除 ----- */

// mode: 'keepPast'（今日以降だけやめる・過去の記録は残す） / 'all'（過去も含めぜんぶ消す）
function deleteRoutine(r, mode) {
  const rIndex = db.routines.indexOf(r);
  const affTasks = db.tasks.filter((t) => t.routineId === r.id);
  const affEvents = db.events.filter((e) => e.routineId === r.id);
  const affected = [...affTasks, ...affEvents];
  const snapshot = affected.map((x) => ({ ref: x, routineId: x.routineId, repeatEnd: x.repeatEnd })); // Undo用
  db.routines.splice(rIndex, 1);
  if (mode === 'keepPast') {
    const cutoff = toKey(addDays(new Date(), -1)); // 昨日まで残す（当日より前）
    affected.forEach((x) => {
      delete x.routineId; // ルーティンから切り離す
      if (x.repeat) x.repeatEnd = cutoff; // 未来を止める（過去の occurrences・doneDates は残る）
      else if (x.date && x.date >= todayKey()) { // 単発で今日以降のものは消す対象に
        if (x.doneDates !== undefined || x.minutes !== undefined) db.tasks = db.tasks.filter((t) => t !== x);
        else db.events = db.events.filter((e) => e !== x);
      }
    });
  } else { // all
    db.tasks = db.tasks.filter((t) => t.routineId !== r.id);
    db.events = db.events.filter((e) => e.routineId !== r.id);
  }
  save(); renderAll();
  const msg = mode === 'keepPast' ? `「${r.title}」を今日以降やめました（過去の記録は残っています）` : `「${r.title}」を削除しました`;
  showUndoToast(msg, () => {
    db.routines.splice(Math.min(rIndex, db.routines.length), 0, r);
    snapshot.forEach((s) => {
      s.ref.routineId = s.routineId;
      if (s.repeatEnd) s.ref.repeatEnd = s.repeatEnd; else delete s.ref.repeatEnd;
    });
    if (mode === 'all') { db.tasks.push(...affTasks); db.events.push(...affEvents); }
    else { // keepPast の単発削除ぶんを戻す
      affTasks.forEach((t) => { if (!db.tasks.includes(t)) db.tasks.push(t); });
      affEvents.forEach((e) => { if (!db.events.includes(e)) db.events.push(e); });
    }
    save(); renderAll();
  });
}
$('#rdel-keep').addEventListener('click', () => { $('#rdel-scrim').hidden = true; if (rdelTarget) deleteRoutine(rdelTarget, 'keepPast'); rdelTarget = null; });
$('#rdel-all').addEventListener('click', () => { $('#rdel-scrim').hidden = true; if (rdelTarget) deleteRoutine(rdelTarget, 'all'); rdelTarget = null; });
$('#rdel-cancel').addEventListener('click', () => { $('#rdel-scrim').hidden = true; rdelTarget = null; });
$('#rdel-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) { e.currentTarget.hidden = true; rdelTarget = null; } });

/* ----- 共有（エクスポート／インポート） ----- */

function openShareSheet(r) {
  $('#share-title').textContent = `共有: ${r.title}`;
  const payload = {
    taskCalendarRoutine: 1,
    routine: { title: r.title, goal: r.goal, color: r.color, targetPerWeek: r.targetPerWeek },
    items: routineTasks(r).map((t) => ({ title: t.title, repeat: t.repeat, time: t.time, minutes: t.minutes })),
  };
  const ta = $('#share-text');
  ta.value = JSON.stringify(payload);
  ta.readOnly = true;
  $('#share-copy').hidden = false;
  $('#share-import').hidden = true;
  $('#share-hint').textContent = 'このテキストをコピーして、LINEやメールで送ってください。受け取った人は「読み込む」に貼り付けます。';
  $('#share-scrim').hidden = false;
}
function openImportSheet() {
  $('#share-title').textContent = 'ルーティンを読み込む';
  const ta = $('#share-text');
  ta.value = '';
  ta.readOnly = false;
  $('#share-copy').hidden = true;
  $('#share-import').hidden = false;
  $('#share-hint').textContent = '共有されたテキストを貼り付けて「読み込む」を押してください。読み込んだルーティンは一時停止の状態で入ります。';
  $('#share-scrim').hidden = false;
  ta.focus();
}
$('#share-copy').addEventListener('click', async () => {
  const ta = $('#share-text');
  try {
    await navigator.clipboard.writeText(ta.value);
    $('#share-hint').textContent = 'コピーしました！';
  } catch (err) {
    ta.select();
    document.execCommand('copy');
    $('#share-hint').textContent = 'コピーしました！';
  }
});
$('#share-import').addEventListener('click', () => {
  let data;
  try {
    data = JSON.parse($('#share-text').value);
  } catch (err) { data = null; }
  if (!data || data.taskCalendarRoutine !== 1 || !data.routine || typeof data.routine.title !== 'string' || !Array.isArray(data.items)) {
    $('#share-hint').textContent = '読み込めませんでした。共有テキストをそのまま貼り付けているか確認してください。';
    return;
  }
  let title = data.routine.title.slice(0, 60);
  if (db.routines.some((x) => x.title === title)) title += '（2）';
  const r = {
    id: newId('r'),
    title,
    goal: typeof data.routine.goal === 'string' ? data.routine.goal.slice(0, 120) : null,
    color: ACCENTS[data.routine.color] ? data.routine.color : 'green',
    targetPerWeek: Math.min(7, Math.max(1, parseInt(data.routine.targetPerWeek, 10) || R_DEFAULT_TARGET)),
    active: false,
    pausedFrom: todayKey(), // 無効状態で入る（仕様§3）
    startDate: todayKey(),
    createdAt: Date.now(),
  };
  db.routines.push(r);
  for (const it of data.items.slice(0, 30)) {
    if (typeof it.title !== 'string' || !it.title.trim()) continue;
    db.tasks.push({
      id: newId('t'),
      routineId: r.id,
      title: it.title.trim().slice(0, 80),
      time: typeof it.time === 'string' && /^\d\d:\d\d$/.test(it.time) ? it.time : null,
      minutes: Number.isInteger(it.minutes) && it.minutes >= 1 && it.minutes <= 600 ? it.minutes : null,
      repeat: REPEAT_LABEL[it.repeat] ? it.repeat : 'daily',
      startDate: todayKey(),
      doneDates: {}, exDates: [], memo: null, memoDates: {},
      createdAt: Date.now(),
    });
  }
  $('#share-scrim').hidden = true;
  renderAll();
  save();
  showUndoToast(`「${r.title}」を読み込みました（一時停止中）`, () => {
    db.routines = db.routines.filter((x) => x.id !== r.id);
    db.tasks = db.tasks.filter((t) => t.routineId !== r.id);
    save(); renderAll();
  });
});
$('#share-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });


/* ========== v8: ビジョンボード（思い出すためのページ） ========== */

const VB_SLOTS = { t1: 1, t2: 2, t3: 3, t4: 4 };
const VB_MAX_PHOTOS = 30; // 仕様: iOS PWAの保存領域の安全圏
const VB_ROTS = [0, -6, 6, -12, 12];
let vbPicked = null; // 自由配置で選択中の {it, node}

/* --- 画像はIndexedDBへ（localStorageを圧迫しない） --- */
let vbDbPromise = null;
function vbOpenDb() {
  if (!vbDbPromise) {
    vbDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('tc-images', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('images');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return vbDbPromise;
}
function vbPut(key, blob) {
  return vbOpenDb().then((d) => new Promise((resolve, reject) => {
    const tx = d.transaction('images', 'readwrite');
    tx.objectStore('images').put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  }));
}
function vbGet(key) {
  return vbOpenDb().then((d) => new Promise((resolve, reject) => {
    const req = d.transaction('images').objectStore('images').get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
}
const vbUrlCache = new Map();
async function vbImageUrl(key) {
  if (vbUrlCache.has(key)) return vbUrlCache.get(key);
  try {
    const blob = await vbGet(key);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    vbUrlCache.set(key, url);
    return url;
  } catch (err) { return null; }
}
function vbShrink(file) { // 長辺1280pxへ縮小してJPEG化
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.width * scale));
      cv.height = Math.max(1, Math.round(img.height * scale));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = URL.createObjectURL(file);
  });
}
function vbPhotoCount() { return db.boardItems.filter((i) => i.kind === 'photo').length; }

/* --- 一覧 --- */

function renderVisions(body) {
  const row = el('div', 'r-cta-row');
  const add = el('button', 'cta', '＋ 新しいボード');
  add.type = 'button';
  add.addEventListener('click', openVbSheet);
  row.append(add);
  body.append(row);
  body.append(el('p', 'vb-count', `写真 ${vbPhotoCount()}/${VB_MAX_PHOTOS}枚`));
  if (db.boards.length === 0) {
    body.append(el('p', 'empty', '写真やことばを貼って「なぜ続けるのか」を思い出すページ。テンプレートに写真をはめるか、自由に貼り付けるかを選べます。'));
    return;
  }
  for (const board of db.boards) body.append(buildBoardCard(board));
}

function buildBoardCard(board) {
  const card = el('div', 'vb-card');
  const head = el('div', 'vb-head');
  const title = document.createElement('input');
  title.type = 'text'; title.maxLength = 40; title.value = board.title;
  title.addEventListener('blur', () => { board.title = title.value.trim() || board.title; save(); });
  const del = el('button', 'iconbtn');
  del.type = 'button'; del.setAttribute('aria-label', 'ボードを削除'); del.innerHTML = ICONS.trash;
  del.addEventListener('click', () => {
    const bIndex = db.boards.indexOf(board);
    const items = db.boardItems.filter((i) => i.boardId === board.id);
    db.boards.splice(bIndex, 1);
    db.boardItems = db.boardItems.filter((i) => i.boardId !== board.id);
    save(); renderAll();
    // 画像Blobは消さない（元に戻せるように。孤児Blobは軽微）
    showUndoToast(`「${board.title}」を削除しました`, () => {
      db.boards.splice(Math.min(bIndex, db.boards.length), 0, board);
      db.boardItems.push(...items);
      save(); renderAll();
    });
  });
  head.append(title, del);
  card.append(head);

  if (board.mode === 'free') card.append(buildFreeBoard(board));
  else card.append(buildTplGrid(board));

  const memo = document.createElement('textarea');
  memo.className = 'vb-memo';
  memo.placeholder = 'このボードのテーマ・意図・意味をメモ…';
  memo.value = board.memo || '';
  let mt = null;
  memo.addEventListener('input', () => { board.memo = memo.value; clearTimeout(mt); mt = setTimeout(save, 300); });
  card.append(memo);
  return card;
}

/* --- テンプレート型（コラージュ） --- */

function buildTplGrid(board) {
  const tpl = board.template || 't4';
  const grid = el('div', `vb-grid ${tpl}`);
  const items = db.boardItems.filter((i) => i.boardId === board.id);
  for (let slot = 0; slot < VB_SLOTS[tpl]; slot += 1) {
    const wrap = el('div', 'vb-slot-wrap');
    const it = items.find((x) => x.slot === slot);
    const btn = el('button', it ? 'vb-slot filled' : 'vb-slot');
    btn.type = 'button';
    if (it) {
      const img = document.createElement('img');
      img.alt = it.text || '';
      vbImageUrl(it.imageKey).then((u) => { if (u) img.src = u; });
      btn.append(img);
      btn.addEventListener('click', () => { ui.vbSlotTarget = it; $('#vb-slot-scrim').hidden = false; });
      const cap = document.createElement('input');
      cap.type = 'text'; cap.className = 'vb-caption'; cap.maxLength = 80;
      cap.placeholder = 'この写真の意図・テーマ…';
      cap.value = it.text || '';
      let ct = null;
      cap.addEventListener('input', () => { it.text = cap.value; clearTimeout(ct); ct = setTimeout(save, 300); });
      wrap.append(btn, cap);
    } else {
      btn.innerHTML = ICONS.plus;
      btn.setAttribute('aria-label', '写真を追加');
      btn.addEventListener('click', () => vbPickPhoto({ boardId: board.id, slot }));
      wrap.append(btn);
    }
    grid.append(wrap);
  }
  return grid;
}

/* --- 自由配置型 --- */

function buildFreeBoard(board) {
  const wrapper = el('div');
  const canvas = el('div', 'vb-canvas');
  for (const it of db.boardItems.filter((i) => i.boardId === board.id)) {
    canvas.append(buildFreeItem(it, canvas));
  }
  const tools = el('div', 'vb-tools');
  const mk = (label, fn) => { const b = el('button', 'pill-btn', label); b.type = 'button'; b.addEventListener('click', fn); tools.append(b); };
  mk('＋写真', () => vbPickPhoto({ boardId: board.id, free: true }));
  mk('＋ことば', () => {
    db.boardItems.push({ id: newId('vi'), boardId: board.id, kind: 'word', text: 'ことば', x: 32, y: 42, w: 16, rot: 0, createdAt: Date.now() });
    save(); renderAll();
  });
  mk('小さく', () => vbScale(-1));
  mk('大きく', () => vbScale(1));
  mk('回転', vbRotate);
  mk('削除', vbDeletePicked);
  wrapper.append(canvas, tools);
  return wrapper;
}

function buildFreeItem(it, canvas) {
  let node;
  if (it.kind === 'photo') {
    node = el('div', 'vb-item');
    const img = document.createElement('img');
    vbImageUrl(it.imageKey).then((u) => { if (u) img.src = u; });
    node.append(img);
    node.style.width = `${it.w || 38}%`;
  } else {
    node = el('div', 'vb-item word');
    node.contentEditable = 'true';
    node.textContent = it.text || '';
    node.style.fontSize = `${it.w || 16}px`;
    node.addEventListener('blur', () => {
      it.text = node.textContent.trim();
      save();
      if (!it.text) { db.boardItems = db.boardItems.filter((x) => x.id !== it.id); save(); renderAll(); }
    });
  }
  node.style.left = `${it.x}%`;
  node.style.top = `${it.y}%`;
  node.style.transform = `rotate(${it.rot || 0}deg)`;

  let sx = 0; let sy = 0; let ox = 0; let oy = 0; let dragging = false; let moved = false;
  node.addEventListener('pointerdown', (e) => {
    if (it.kind === 'word' && document.activeElement === node) return; // 文字編集中はドラッグしない
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY; ox = it.x; oy = it.y;
    try { node.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
  });
  node.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const dx = ((e.clientX - sx) / r.width) * 100;
    const dy = ((e.clientY - sy) / r.height) * 100;
    if (Math.abs(dx) + Math.abs(dy) > 1.5) moved = true;
    it.x = Math.min(92, Math.max(0, ox + dx));
    it.y = Math.min(94, Math.max(0, oy + dy));
    node.style.left = `${it.x}%`;
    node.style.top = `${it.y}%`;
  });
  const up = () => { if (dragging) { dragging = false; if (moved) save(); } };
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
  node.addEventListener('click', () => {
    canvas.querySelectorAll('.vb-item').forEach((n) => n.classList.remove('is-picked'));
    node.classList.add('is-picked');
    vbPicked = { it, node };
  });
  return node;
}

function vbApplyPicked() {
  const { it, node } = vbPicked;
  if (it.kind === 'photo') node.style.width = `${it.w}%`;
  else node.style.fontSize = `${it.w || 16}px`;
  node.style.transform = `rotate(${it.rot || 0}deg)`;
}
function vbScale(dir) {
  if (!vbPicked) { flashToast('写真かことばをタップして選んでね'); return; }
  const it = vbPicked.it;
  if (it.kind === 'photo') it.w = Math.min(90, Math.max(14, (it.w || 38) + dir * 6));
  else it.w = Math.min(34, Math.max(10, (it.w || 16) + dir * 2));
  vbApplyPicked(); save();
}
function vbRotate() {
  if (!vbPicked) { flashToast('写真かことばをタップして選んでね'); return; }
  const it = vbPicked.it;
  it.rot = VB_ROTS[(VB_ROTS.indexOf(it.rot || 0) + 1) % VB_ROTS.length];
  vbApplyPicked(); save();
}
function vbDeletePicked() {
  if (!vbPicked) { flashToast('写真かことばをタップして選んでね'); return; }
  const it = vbPicked.it;
  const index = db.boardItems.indexOf(it);
  db.boardItems.splice(index, 1);
  vbPicked = null;
  save(); renderAll();
  showUndoToast('削除しました', () => {
    db.boardItems.splice(Math.min(index, db.boardItems.length), 0, it);
    save(); renderAll();
  });
}

/* --- 写真ピッカー --- */

function vbPickPhoto(target) {
  if (!target.replaceItem && vbPhotoCount() >= VB_MAX_PHOTOS) {
    flashToast(`写真は${VB_MAX_PHOTOS}枚まで。どれか削除してから追加してね`);
    return;
  }
  ui.vbFileTarget = target;
  const input = $('#vb-file');
  input.value = '';
  input.click();
}
$('#vb-file').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  const target = ui.vbFileTarget;
  ui.vbFileTarget = null;
  e.target.value = '';
  if (!file || !target) return;
  try {
    const blob = await vbShrink(file);
    const key = newId('img');
    await vbPut(key, blob);
    if (target.replaceItem) {
      target.replaceItem.imageKey = key; // 旧Blobは残す（元に戻す安全側）
    } else if (target.free) {
      db.boardItems.push({ id: newId('vi'), boardId: target.boardId, kind: 'photo', imageKey: key, x: 28, y: 26, w: 40, rot: 0, text: null, createdAt: Date.now() });
    } else {
      db.boardItems.push({ id: newId('vi'), boardId: target.boardId, kind: 'photo', imageKey: key, slot: target.slot, text: null, createdAt: Date.now() });
    }
    save(); renderAll();
  } catch (err) {
    console.warn('vision photo failed', err);
    flashToast('写真を保存できませんでした（容量や形式を確認してね）');
  }
});

/* --- 差し替え／削除シート --- */

$('#vb-slot-replace').addEventListener('click', () => {
  const it = ui.vbSlotTarget;
  $('#vb-slot-scrim').hidden = true;
  ui.vbSlotTarget = null;
  if (it) vbPickPhoto({ replaceItem: it });
});
$('#vb-slot-delete').addEventListener('click', () => {
  const it = ui.vbSlotTarget;
  $('#vb-slot-scrim').hidden = true;
  ui.vbSlotTarget = null;
  if (!it) return;
  const index = db.boardItems.indexOf(it);
  db.boardItems.splice(index, 1);
  save(); renderAll();
  showUndoToast('写真を削除しました', () => {
    db.boardItems.splice(Math.min(index, db.boardItems.length), 0, it);
    save(); renderAll();
  });
});
$('#vb-slot-cancel').addEventListener('click', () => { $('#vb-slot-scrim').hidden = true; ui.vbSlotTarget = null; });
$('#vb-slot-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) { e.currentTarget.hidden = true; ui.vbSlotTarget = null; } });

/* --- 新規ボードシート --- */

let vbNewMode = 'template';
let vbNewTpl = 't1';
function openVbSheet() {
  vbNewMode = 'template'; vbNewTpl = 't1';
  $('#vb-title').value = '';
  document.querySelectorAll('#vb-mode-seg button').forEach((b) => b.classList.toggle('is-active', b.dataset.vbMode === 'template'));
  document.querySelectorAll('#vb-tpl-pick button').forEach((b) => b.classList.toggle('is-active', b.dataset.tpl === 't1'));
  $('#vb-template-row').hidden = false;
  $('#vb-scrim').hidden = false;
  $('#vb-title').focus();
}
$('#vb-mode-seg').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-vb-mode]');
  if (!btn) return;
  vbNewMode = btn.dataset.vbMode;
  document.querySelectorAll('#vb-mode-seg button').forEach((b) => b.classList.toggle('is-active', b === btn));
  $('#vb-template-row').hidden = vbNewMode !== 'template';
});
$('#vb-tpl-pick').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tpl]');
  if (!btn) return;
  vbNewTpl = btn.dataset.tpl;
  document.querySelectorAll('#vb-tpl-pick button').forEach((b) => b.classList.toggle('is-active', b === btn));
});
$('#vb-save').addEventListener('click', () => {
  const title = $('#vb-title').value.trim() || 'ビジョンボード';
  db.boards.push({ id: newId('b'), title, mode: vbNewMode, template: vbNewTpl, memo: '', order: db.boards.length, createdAt: Date.now() });
  $('#vb-scrim').hidden = true;
  ui.routineTab = 'vision';
  save(); renderAll();
});
$('#vb-close').addEventListener('click', () => { $('#vb-scrim').hidden = true; });
$('#vb-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });


/* ========== v11: 検索（タスク・予定・メモをキーワードで探して、その日へジャンプ） ========== */

function searchAll(qRaw) {
  const q = qRaw.trim().toLowerCase();
  if (!q) return [];
  const hit = (s) => typeof s === 'string' && s.toLowerCase().includes(q);
  const out = [];
  for (const t of db.tasks) {
    const memoDayHit = Object.entries(t.memoDates || {}).find(([, v]) => hit(v));
    if (!hit(t.title) && !hit(t.memo) && !memoDayHit) continue;
    let key = t.date || t.startDate;
    if (t.repeat) {
      if (memoDayHit && !hit(t.title)) key = memoDayHit[0]; // 日記（日ごとメモ）がヒット → その日へ
      else { // 直近の出現日へ（今日から1年以内・なければ開始日）
        for (let i = 0; i < 366; i += 1) { const k = toKey(addDays(new Date(), i)); if (occursOn(t, k)) { key = k; break; } }
      }
    }
    out.push({ kind: 'task', ref: t, key, title: t.title, repeat: t.repeat || null });
  }
  for (const e of db.events) {
    if (!hit(e.title) && !hit(e.memo) && !hit(e.place) && !(e.who || []).some(hit)) continue;
    out.push({ kind: 'event', ref: e, key: e.date, title: e.title, repeat: null });
  }
  return out.sort((a, b) => (b.key || '').localeCompare(a.key || '')).slice(0, 50);
}

function renderSearchResults() {
  const q = $('#search-input').value;
  const list = $('#search-results');
  list.textContent = '';
  const results = searchAll(q);
  if (q.trim() && !results.length) {
    list.append(el('p', 'hint', '見つかりませんでした'));
    return;
  }
  for (const r of results) {
    const row = el('button', 'sr-row');
    row.type = 'button';
    const left = el('span', 'sr-title');
    const dot = el('span', 'ccdot');
    const col = itemColor({ ref: r.ref, kind: r.kind });
    if (col) dot.style.background = col;
    left.append(dot, r.title);
    if (r.repeat) left.append(el('span', 'sr-repeat', REPEAT_LABEL[r.repeat]));
    const d = fromKey(r.key);
    const date = el('span', `sr-date mono${dayColorClass(d)}`, `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD_JA[d.getDay()]}）`);
    row.append(left, date);
    row.addEventListener('click', () => {
      $('#search-scrim').hidden = true;
      // いま見ているビュー（日・週・時間・月）のまま、その日付へジャンプ
      if (ui.view === 'year') ui.view = 'month';
      ui.cursor = d;
      if (ui.view === 'month') ui.selectedKey = r.key;
      ui.selectedItemId = `${r.ref.id}@${r.key}`;
      setScreen('cal');
    });
    list.append(row);
  }
}

$('#search-open').addEventListener('click', () => {
  $('#search-scrim').hidden = false;
  $('#search-input').value = '';
  $('#search-results').textContent = '';
  $('#search-input').focus();
});
$('#search-close').addEventListener('click', () => { $('#search-scrim').hidden = true; });
$('#search-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
$('#search-input').addEventListener('input', renderSearchResults);

/* ========== v13: Googleカレンダー連携（第1弾: メインカレンダーの読み込み・表示）==========
   OAuthはライブラリ不要のリダイレクト方式（インプリシットフロー）— CDN禁止方針と両立。
   トークンはこの端末のみに保存（クラウドへは送らない）。表示のみで書き込み権限は求めない。 */

const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events'; // 読み書き（第2弾: 双方向）
let gcalEvents = {};  // dateKey -> [{id,title,time,timeEnd,place}]
let gcalFetched = {}; // 'YYYY-MM' -> true | 'loading' | false

function gcalToken() {
  const g = db.settings.gcal;
  return g && g.token && g.exp > Date.now() ? g.token : null;
}
// 連携済み（フィルタチップに「Googleカレンダー」を出す条件）
function gcalConnected() { return Boolean(db.settings.gcal); }
// 常時連携の中継Worker（Notion連携と同じURL・合言葉を使う。設定済みならゼロ設定で常時連携に）
function gcalWorkerCfg() {
  const n = db.settings.notion || {};
  return n.url && n.secret ? { url: n.url.replace(/\/+$/, ''), secret: n.secret } : null;
}
// トークンが切れていたら、リフレッシュトークンで静かに更新（常時連携の心臓部）
let gcalRefreshing = null; // 同時多発を1本にまとめる
async function gcalRefreshIfNeeded() {
  const g = db.settings.gcal;
  if (!g) return null;
  if (g.token && g.exp > Date.now()) return g.token;
  const w = gcalWorkerCfg();
  if (!g.refresh || !w) return null;
  if (gcalRefreshing) return gcalRefreshing;
  gcalRefreshing = (async () => {
    try {
      const res = await fetch(`${w.url}/gcal/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-TC-Secret': w.secret },
        body: JSON.stringify({ refreshToken: g.refresh }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access_token) return null;
      g.token = data.access_token;
      g.exp = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
      persistLocal();
      return g.token;
    } catch (err) { return null; } finally { gcalRefreshing = null; }
  })();
  return gcalRefreshing;
}
function gcalConnect() {
  if (!window.TC_GCAL_CLIENT_ID) { flashToast('先にクライアントIDの設定が必要です（下の手順を見てね）'); return; }
  const useCode = Boolean(gcalWorkerCfg()); // Worker があれば常時連携（codeフロー）、なければ従来（1時間）
  const params = new URLSearchParams({
    client_id: window.TC_GCAL_CLIENT_ID,
    redirect_uri: location.origin + location.pathname,
    response_type: useCode ? 'code' : 'token',
    scope: GCAL_SCOPE,
    include_granted_scopes: 'true',
    state: 'tc-gcal',
  });
  if (useCode) { params.set('access_type', 'offline'); params.set('prompt', 'consent'); }
  location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
// 認可画面から戻ってきた時（従来: URLフラグメントのアクセストークン）
(() => {
  if (!location.hash.includes('access_token')) return;
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('state') !== 'tc-gcal' || !h.get('access_token')) return;
  db.settings.gcal = {
    token: h.get('access_token'),
    exp: Date.now() + ((parseInt(h.get('expires_in'), 10) || 3600) - 60) * 1000,
    on: true,
  };
  persistLocal();
  history.replaceState(null, '', location.pathname + location.search);
  flashToast('Googleカレンダーと連携しました');
})();
// 認可画面から戻ってきた時（常時連携: ?code= をWorkerでトークンに交換）
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('state') !== 'tc-gcal' || !q.get('code')) return;
  const code = q.get('code');
  q.delete('code'); q.delete('state'); q.delete('scope'); q.delete('authuser'); q.delete('prompt');
  history.replaceState(null, '', location.pathname + (q.toString() ? `?${q}` : ''));
  const w = gcalWorkerCfg();
  if (!w) return;
  fetch(`${w.url}/gcal/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-TC-Secret': w.secret },
    body: JSON.stringify({ code, redirectUri: location.origin + location.pathname }),
  }).then((res) => res.json().then((data) => {
    if (!res.ok || !data.access_token) { flashToast(`Google連携に失敗しました（${data.error || res.status}）`); return; }
    db.settings.gcal = {
      token: data.access_token,
      exp: Date.now() + ((data.expires_in || 3600) - 60) * 1000,
      refresh: data.refresh_token || (db.settings.gcal && db.settings.gcal.refresh) || null,
      on: true,
    };
    persistLocal();
    flashToast(db.settings.gcal.refresh ? 'Googleカレンダーと連携しました（常時連携・自動更新）' : 'Googleカレンダーと連携しました');
    renderAll();
  })).catch(() => flashToast('Google連携に失敗しました（Workerを確認してね）'));
})();
function gcalDisconnect() {
  delete db.settings.gcal;
  gcalEvents = {};
  gcalFetched = {};
  persistLocal();
  renderAll();
}

async function gcalEnsureMonth(key) {
  const m = key.slice(0, 7); // 月単位でまとめて取得（通信回数を抑える）
  if (gcalFetched[m]) return;
  const token = gcalToken() || await gcalRefreshIfNeeded(); // 切れていたら自動で更新（常時連携）
  if (!token) return;
  gcalFetched[m] = 'loading';
  try {
    const [y, mo] = m.split('-').map(Number);
    const q = new URLSearchParams({
      timeMin: new Date(y, mo - 1, 1).toISOString(),
      timeMax: new Date(y, mo, 1).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      fields: 'items(id,summary,start,end,location,hangoutLink)',
    });
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) { // トークン切れ → 自動更新できれば静かに再取得
      db.settings.gcal.exp = 0;
      persistLocal();
      gcalFetched[m] = false;
      const fresh = await gcalRefreshIfNeeded();
      if (fresh) { gcalEnsureMonth(key); return; } // 常時連携: 更新後にもう一度
      if (ui.screen === 'settings') renderGcalCard();
      return;
    }
    const data = await res.json();
    // この月の既存データを一旦クリア（再取得時に二重登録されるのを防ぐ）
    Object.keys(gcalEvents).forEach((k) => { if (k.slice(0, 7) === m) delete gcalEvents[k]; });
    for (const it of data.items || []) {
      const sd = it.start || {};
      const ed = it.end || {};
      const dateKey = (sd.dateTime || sd.date || '').slice(0, 10);
      if (!dateKey) continue;
      (gcalEvents[dateKey] = gcalEvents[dateKey] || []).push({
        id: it.id,
        title: it.summary || '（タイトルなし）',
        time: sd.dateTime ? sd.dateTime.slice(11, 16) : '',
        timeEnd: ed.dateTime ? ed.dateTime.slice(11, 16) : null,
        place: it.location || null,
        hangoutLink: it.hangoutLink || null,
      });
    }
    gcalFetched[m] = true;
    renderAll();
  } catch (err) {
    console.warn('gcal fetch failed', err);
    gcalFetched[m] = false;
  }
}

function gcalItemsFor(key) {
  const g = db.settings.gcal;
  if (!g || g.on === false) return [];
  gcalEnsureMonth(key); // 未取得の月なら裏で取得→届いたら再描画
  return (gcalEvents[key] || [])
    // このアプリ側に同じ予定（同日・同時刻・同タイトル）があれば重複表示しない
    .filter((e) => !db.events.some((l) => l.date === key && (l.time || '') === (e.time || '') && l.title === e.title))
    .map((e) => ({ kind: 'gcal', id: `g${e.id}@${key}`, ref: e, key, title: e.title, time: e.time, timeEnd: e.timeEnd || null, minutes: null, repeat: null, done: false }));
}

/* ===== 双方向書き込み（アプリの予定→Google・Meet自動発行）===== */
const TC_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo';
function gcalCanWrite() { return Boolean(gcalToken() || (db.settings.gcal && db.settings.gcal.refresh && gcalWorkerCfg())); }

async function gcalWrite(method, path, body) {
  const token = gcalToken() || await gcalRefreshIfNeeded(); // 切れていたら自動で更新（常時連携）
  if (!token) throw new Error('no-token');
  const res = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    if (db.settings.gcal) { db.settings.gcal.exp = 0; persistLocal(); }
    throw new Error('scope-or-expired'); // 権限不足／期限切れ → 再連携が必要
  }
  if (!res.ok) throw new Error(`gcal ${res.status}`);
  return res.status === 204 ? null : res.json();
}

function gcalEventBody(ev, key, wantMeet) {
  const dateStr = ev.date || key;
  const body = { summary: ev.title };
  if (ev.place) body.location = ev.place;
  const name = ((db.settings.senderName || db.settings.userName) || '').trim(); // 差出人名が無ければユーザー名
  const descParts = [
    (ev.attendees || []).length && name ? `${name}さんからのご案内です。` : '',
    (ev.who || []).length ? `誰と: ${ev.who.join('、')}` : '',
    ev.memo || '',
    ev.inviteNote ? `【追記】${ev.inviteNote}` : '',
  ].filter(Boolean);
  if (descParts.length) body.description = descParts.join('\n');
  if (ev.time) {
    const endT = ev.timeEnd || tgMinToStr(Math.min(1439, tgStrToMin(ev.time) + 60));
    body.start = { dateTime: `${dateStr}T${ev.time}:00`, timeZone: TC_TZ };
    body.end = { dateTime: `${dateStr}T${endT}:00`, timeZone: TC_TZ };
  } else {
    body.start = { date: dateStr };
    body.end = { date: toKey(addDays(fromKey(dateStr), 1)) };
  }
  if ((ev.attendees || []).length) body.attendees = ev.attendees.map((email) => ({ email }));
  if (wantMeet) body.conferenceData = { createRequest: { requestId: `tc-${Math.random().toString(36).slice(2)}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } };
  return body;
}

// アプリの予定をGoogleへ反映（作成/更新）。Meet希望なら会議リンクも発行。結果をローカルに保存
async function gcalSyncEvent(ev, key, wantMeet) {
  if (ev.repeat) { flashToast('繰り返しの予定はGoogle連携の対象外です（単発の予定のみ）'); return; }
  try {
    const send = (ev.attendees || []).length ? '&sendUpdates=all' : ''; // 招待メールを送る
    const q = `?conferenceDataVersion=1${send}`;
    let out;
    if (ev.gcalId) out = await gcalWrite('PATCH', `calendars/primary/events/${ev.gcalId}${q}`, gcalEventBody(ev, key, wantMeet && !ev.hangoutLink));
    else out = await gcalWrite('POST', `calendars/primary/events${q}`, gcalEventBody(ev, key, wantMeet));
    if (out && out.id) {
      ev.gcalId = out.id;
      if (out.hangoutLink) ev.hangoutLink = out.hangoutLink;
    }
    gcalFetched = {}; // 取得キャッシュを無効化（次表示で最新を取り直す）
    persistLocal();
    renderAll();
    const invited = (ev.attendees || []).length ? '・招待メールを送信しました' : '';
    flashToast((wantMeet ? 'Googleに登録し、会議リンクを発行しました' : 'Googleカレンダーに登録しました') + invited);
  } catch (err) {
    if (String(err.message).includes('scope')) { flashToast('Googleへの書き込み権限がありません。設定から「再連携」してね'); if (ui.screen === 'settings') renderGcalCard(); }
    else flashToast('Googleへの登録に失敗しました');
  }
}
async function gcalDeleteEvent(gcalId) {
  try { await gcalWrite('DELETE', `calendars/primary/events/${gcalId}`); gcalFetched = {}; } catch (err) { /* ローカル削除は済んでいる */ }
}

function renderGcalCard() {
  const wrap = $('#gcal-body');
  if (!wrap) return;
  wrap.textContent = '';
  if (!window.TC_GCAL_CLIENT_ID) {
    wrap.append(el('p', 'hint', '準備がまだです。Google Cloud ConsoleでOAuthクライアント（ウェブアプリ）を作成し、firebase-config.js の TC_GCAL_CLIENT_ID に貼り付けると使えるようになります（無料・PRの手順参照）。'));
    return;
  }
  // redirect_uri_mismatch対策: 実際に送るリダイレクトURIをそのまま表示（コンソールにこれを登録）
  const redirectUri = location.origin + location.pathname;
  const uriRow = el('div', 'gcal-uri');
  uriRow.append(el('span', 'gcal-uri-label', 'このアプリの承認済みリダイレクトURI'));
  const codeRow = el('div', 'sh-coderow');
  codeRow.append(el('span', 'sh-code mono', redirectUri));
  const cp = el('button', 'iconbtn');
  cp.type = 'button'; cp.setAttribute('aria-label', 'コピー'); cp.innerHTML = ICONS.copy;
  cp.addEventListener('click', () => navigator.clipboard?.writeText(redirectUri).then(() => flashToast('コピーしました')).catch(() => flashToast(redirectUri)));
  codeRow.append(cp);
  uriRow.append(codeRow);
  uriRow.append(el('p', 'hint', 'エラー「redirect_uri_mismatch」が出るときは、Google Cloud Console のOAuthクライアントの「承認済みのリダイレクトURI」に、上のURIを完全一致で追加してください（承認済みのJavaScript生成元にはドメインだけを追加）。'));
  wrap.append(uriRow);

  const g = db.settings.gcal;
  if (!g) {
    const btn = el('button', 'cta', 'Googleカレンダーと連携する');
    btn.type = 'button';
    btn.addEventListener('click', gcalConnect);
    wrap.append(btn);
    return;
  }
  const row = el('div', 'sync-row');
  const always = Boolean(g.refresh && gcalWorkerCfg()); // 常時連携（自動更新）モード
  const expired = !gcalToken() && !always;
  row.append(el('span', 'sync-email', 'Googleカレンダー'));
  row.append(el('span', `sync-state${expired ? '' : ' ok'}`, always ? '常時連携中（自動更新）' : expired ? '接続の期限切れ（再連携してね）' : '連携中'));
  wrap.append(row);
  if (expired) {
    const re = el('button', 'cta', '再連携する');
    re.type = 'button';
    re.addEventListener('click', gcalConnect);
    wrap.append(re);
  }
  if (!always && gcalWorkerCfg()) {
    const up = el('button', 'cta ghost', '常時連携に切り替える（再連携1回）');
    up.type = 'button';
    up.addEventListener('click', gcalConnect);
    wrap.append(up);
    wrap.append(el('p', 'hint', 'Workerの更新（notion-worker.jsの貼り替え＋Googleのクライアントシークレット登録）が済んでいれば、1回の再連携で以後は自動更新になります。'));
  }
  const tg = el('label', 'sync-toggle');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = g.on !== false;
  cb.addEventListener('change', () => { g.on = cb.checked; persistLocal(); renderAll(); });
  tg.append(cb, ' Googleの予定をカレンダーに表示する');
  wrap.append(tg);
  const out = el('button', 'cta ghost', '連携を解除');
  out.type = 'button';
  out.addEventListener('click', gcalDisconnect);
  wrap.append(out);
}

/* ========== v9: クラウド同期（Firebase Phase A — ログイン＋自分のデータのバックアップ/復元） ========== */

const SYNC_KEYS_ARR = ['tasks', 'events', 'routines', 'calendars', 'boards', 'boardItems', 'sharedJoined', 'people', 'anniversaries', 'colorRules', 'packages'];
const SYNC_KEYS_OBJ = ['notes', 'goals', 'sleep', 'periodNotes', 'dayLogs'];
const SH_PREFIX = 's:'; // 共有カレンダー所属の calendarId は 's:招待コード'
function isSharedCal(id) { return typeof id === 'string' && id.startsWith(SH_PREFIX); }
let fbReady = false;
let fbUser = null;
let fbPushTimer = null;
let syncStatus = 'off'; // off | loading | synced | error | offline
let syncErrCode = ''; // 直近の同期エラーコード（原因の切り分け用に画面に出す）
function fbErrCode(err) { return (err && (err.code || err.message)) || 'unknown'; }

function setSyncStatus(st) {
  syncStatus = st;
  if (ui.screen === 'settings') renderSyncCard();
}
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const sc = document.createElement('script');
    sc.src = src;
    sc.onload = resolve;
    sc.onerror = () => reject(new Error(`load failed: ${src}`));
    document.head.append(sc);
  });
}
async function ensureFirebase() { // SDKは必要になった時だけ読み込む（同梱・CDN不使用）
  if (fbReady) return true;
  if (!window.TC_FIREBASE_CONFIG) return false;
  await loadScriptOnce('vendor/firebase-app-compat.js?v=29');
  await loadScriptOnce('vendor/firebase-auth-compat.js?v=29');
  await loadScriptOnce('vendor/firebase-firestore-compat.js?v=29');
  window.firebase.initializeApp(window.TC_FIREBASE_CONFIG);
  fbReady = true;
  // リダイレクト方式ログインの戻りを回収（失敗理由もここで分かる）
  window.firebase.auth().getRedirectResult().catch((err) => {
    console.warn('redirect login failed', err);
    setSyncStatus('error');
    flashToast(`ログインできませんでした（${(err && err.code) || 'unknown'}）`);
  });
  window.firebase.auth().onAuthStateChanged((user) => {
    fbUser = user;
    if (user) {
      db.settings.syncUser = { email: user.email || '' };
      persistLocal();
      cloudPullOrPush().finally(shListenAll); // 自分のデータ復元後に共有の購読を開始
    }
    if (ui.screen === 'settings') { renderSyncCard(); renderSharedCard(); }
  });
  return true;
}
function userDocRef() { return window.firebase.firestore().collection('users').doc(fbUser.uid); }

async function cloudLogin() {
  try {
    setSyncStatus('loading');
    if (!navigator.onLine) { setSyncStatus('offline'); flashToast('オフラインです。電波のある場所でお試しを'); return; }
    if (!(await ensureFirebase())) { setSyncStatus('error'); return; }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    // ホーム画面から開いたPWA（standalone）はポップアップが開けないことが多い → 最初からリダイレクト方式
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) { await window.firebase.auth().signInWithRedirect(provider); return; }
    await window.firebase.auth().signInWithPopup(provider);
  } catch (err) {
    const code = (err && err.code) || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
      try { await window.firebase.auth().signInWithRedirect(new window.firebase.auth.GoogleAuthProvider()); return; } catch (e2) { err = e2; }
    }
    console.warn('login failed', err);
    setSyncStatus('error');
    flashToast(`ログインできませんでした（${(err && err.code) || '設定を確認してね'}）`);
  }
}
/* メールアドレス＋パスワードの新規登録／ログイン（Googleが使えない環境でもOK・承認済みドメイン設定が不要） */
function emailAuthMsg(err) {
  const c = (err && err.code) || '';
  if (c === 'auth/email-already-in-use') return 'このメールアドレスは登録済みです。「ログイン」を押してね';
  if (c === 'auth/invalid-email') return 'メールアドレスの形式が正しくないみたい';
  if (c === 'auth/weak-password' || c === 'auth/missing-password') return 'パスワードは6文字以上で入力してね';
  if (c === 'auth/invalid-credential' || c === 'auth/wrong-password' || c === 'auth/user-not-found') return 'メールアドレスかパスワードが違います';
  if (c === 'auth/too-many-requests') return '試行回数が多すぎます。少し待ってからどうぞ';
  if (c === 'auth/operation-not-allowed') return 'メール/パスワードのログインがFirebase側で無効です（コンソールで有効化）';
  if (c === 'auth/network-request-failed') return '通信に失敗しました。電波を確認してね';
  return `うまくいきませんでした（${c || 'unknown'}）`;
}
async function cloudEmailAuth(mode) {
  const email = $('#sy-email').value.trim();
  const pass = $('#sy-pass').value;
  if (!email || !pass) { flashToast('メールアドレスとパスワードを入力してね'); return; }
  try {
    setSyncStatus('loading');
    if (!navigator.onLine) { setSyncStatus('offline'); flashToast('オフラインです。電波のある場所でお試しを'); return; }
    if (!(await ensureFirebase())) { setSyncStatus('error'); return; }
    if (mode === 'signup') {
      await window.firebase.auth().createUserWithEmailAndPassword(email, pass);
      flashToast('アカウントを作成してログインしました');
    } else {
      await window.firebase.auth().signInWithEmailAndPassword(email, pass);
    }
  } catch (err) {
    console.warn('email auth failed', err);
    setSyncStatus('error');
    flashToast(emailAuthMsg(err));
  }
}
async function cloudResetPass() {
  const email = $('#sy-email').value.trim();
  if (!email) { flashToast('先にメールアドレスを入力してね'); return; }
  try {
    if (!(await ensureFirebase())) return;
    await window.firebase.auth().sendPasswordResetEmail(email);
    flashToast('再設定メールを送りました。受信箱を確認してね');
  } catch (err) { flashToast(emailAuthMsg(err)); }
}

async function cloudLogout() {
  try { if (fbReady) await window.firebase.auth().signOut(); } catch (err) { /* ローカルは無事 */ }
  shUnlistenAll();
  fbUser = null;
  delete db.settings.syncUser;
  db.settings.lastSyncAt = null;
  persistLocal();
  setSyncStatus('off');
  renderAll();
}

/* ドキュメント単位の後勝ち（Phase A）: リモートが新しければ取り込み、そうでなければ押し上げる */
async function cloudPullOrPush() {
  if (db.settings.syncEnabled === false) { setSyncStatus('off'); return; } // 同期オフ（ログインだけの状態）
  try {
    setSyncStatus('loading');
    const snap = await userDocRef().get();
    const remote = snap.exists ? snap.data() : null;
    if (remote && (remote.updatedAt || 0) > (db.updatedAt || 0)) {
      SYNC_KEYS_ARR.forEach((k) => {
        if (!Array.isArray(remote[k])) return;
        // 共有カレンダーの項目はユーザードキュメントに含めない（共有ドキュメントが正）ので、ローカル分を保持
        db[k] = (k === 'tasks' || k === 'events')
          ? remote[k].filter((x) => !isSharedCal(x.calendarId)).concat(db[k].filter((x) => isSharedCal(x.calendarId)))
          : remote[k];
      });
      SYNC_KEYS_OBJ.forEach((k) => { if (remote[k] && typeof remote[k] === 'object') db[k] = remote[k]; });
      db.updatedAt = remote.updatedAt;
      db.settings.lastSyncAt = Date.now();
      persistLocal();
      renderAll();
      flashToast('クラウドのデータを読み込みました');
      setSyncStatus('synced');
    } else {
      await cloudPush();
    }
  } catch (err) {
    console.warn('sync failed', err);
    syncErrCode = fbErrCode(err);
    setSyncStatus('error');
  }
}
async function cloudPush() {
  if (!fbReady || !fbUser) return;
  const payload = { updatedAt: db.updatedAt || Date.now() };
  SYNC_KEYS_ARR.forEach((k) => { payload[k] = (k === 'tasks' || k === 'events') ? db[k].filter((x) => !isSharedCal(x.calendarId)) : db[k]; });
  SYNC_KEYS_OBJ.forEach((k) => { payload[k] = db[k]; });
  await userDocRef().set(payload);
  db.settings.lastSyncAt = Date.now();
  persistLocal();
  setSyncStatus('synced');
}
function scheduleCloudPush() {
  if (!fbUser || db.settings.syncEnabled === false) return;
  clearTimeout(fbPushTimer);
  fbPushTimer = setTimeout(() => { cloudPush().catch((err) => { syncErrCode = fbErrCode(err); setSyncStatus('error'); }); }, 2500);
}

function renderSyncCard() {
  const wrap = $('#sync-body');
  if (!wrap) return;
  wrap.textContent = '';
  if (db.settings.syncUser) {
    const row = el('div', 'sync-row');
    row.append(el('span', 'sync-email', db.settings.syncUser.email || 'ログイン中'));
    const syncOn = db.settings.syncEnabled !== false;
    const st = el('span', `sync-state${syncStatus === 'synced' ? ' ok' : syncStatus === 'error' ? ' err' : ''}`);
    st.textContent = !syncOn ? '同期オフ（この端末にのみ保存）'
      : syncStatus === 'synced'
      ? `同期済み ${db.settings.lastSyncAt ? new Date(db.settings.lastSyncAt).toTimeString().slice(0, 5) : ''}`
      : syncStatus === 'loading' ? '同期中…'
      : syncStatus === 'error' ? `同期エラー: ${syncErrCode || '不明'}${/permission/i.test(syncErrCode) ? '（Firestoreのルール未設定が原因の可能性大）' : ''}（ローカルには保存されています）`
      : syncStatus === 'offline' ? 'オフライン（復帰後に同期します）' : '接続待ち…';
    row.append(st);
    wrap.append(row);
    // 同期する・しないの切替（ログインしたままでもオフにできる）
    const tg = el('label', 'sync-toggle');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = syncOn;
    cb.addEventListener('change', () => {
      db.settings.syncEnabled = cb.checked;
      persistLocal();
      if (cb.checked) cloudPullOrPush(); else setSyncStatus('off');
      renderSyncCard();
    });
    tg.append(cb, ' カレンダーをクラウドと同期する');
    wrap.append(tg);
    const out = el('button', 'cta ghost', 'ログアウト');
    out.type = 'button';
    out.addEventListener('click', cloudLogout);
    wrap.append(out);
  } else {
    const btn = el('button', 'cta', 'Googleでログインして同期');
    btn.type = 'button';
    btn.addEventListener('click', cloudLogin);
    wrap.append(btn);
    wrap.append(el('p', 'sync-or', 'または、メールアドレスで'));
    const email = document.createElement('input');
    email.type = 'email'; email.id = 'sy-email'; email.placeholder = 'メールアドレス'; email.autocomplete = 'email';
    const pass = document.createElement('input');
    pass.type = 'password'; pass.id = 'sy-pass'; pass.placeholder = 'パスワード（6文字以上）'; pass.autocomplete = 'current-password';
    wrap.append(email, pass);
    const row = el('div', 'sync-btnrow');
    const loginB = el('button', 'cta ghost', 'ログイン');
    loginB.type = 'button';
    loginB.addEventListener('click', () => cloudEmailAuth('login'));
    const signupB = el('button', 'cta ghost', '新規登録');
    signupB.type = 'button';
    signupB.addEventListener('click', () => cloudEmailAuth('signup'));
    row.append(loginB, signupB);
    wrap.append(row);
    const reset = el('button', 'sync-reset', 'パスワードを忘れたとき');
    reset.type = 'button';
    reset.addEventListener('click', cloudResetPass);
    wrap.append(reset);
  }
}

// 以前ログインしていたら起動時に静かに再接続（オフラインならスキップ）
if (db.settings.syncUser && navigator.onLine) {
  ensureFirebase().catch(() => setSyncStatus('error'));
}
window.addEventListener('online', () => { if (db.settings.syncUser) ensureFirebase().then(() => { if (fbUser) cloudPush().catch(() => setSyncStatus('error')); }).catch(() => {}); });

/* ========== v10: 共有カレンダー（Firebase Phase B）==========
   Firestoreの shared/{招待コード} 1ドキュメント = 1共有カレンダー。
   項目はローカルでは db.tasks / db.events に calendarId='s:コード' で入るので、
   チェック・スワイプ・チップ・色などの既存機能がそのまま使える。
   db.sharedJoined（参加コード一覧）は自分のクラウドにも同期、
   db.sharedCache（タイトル・色・権限などの控え）はこの端末のみ。 */

let shPushTimer = null;
const shUnsubs = {}; // code -> onSnapshot解除関数
const shSnap = {};   // code -> 最後に送受信した項目のJSON（差分がない書き込みを抑止）

function shDocRef(code) { return window.firebase.firestore().collection('shared').doc(code); }
function shNewCode() { // 招待コード8桁（紛らわしい I/O/0/1 は使わない）
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join('');
}
function shRole(code) {
  const c = db.sharedCache[code];
  return c ? c.role : null; // 'owner' | 'editor' | 'viewer'
}
/* 編集をブロックすべきなら toast を出して true を返す（個人カレンダーは常に false） */
function sharedBlocked(calId) {
  if (!isSharedCal(calId)) return false;
  if (!fbUser) { flashToast('共有カレンダーの編集にはログインが必要です'); return true; }
  const role = shRole(calId.slice(SH_PREFIX.length));
  if (role === 'owner' || role === 'editor') return false;
  flashToast('このカレンダーは閲覧専用です');
  return true;
}

function shItemsFor(code) { // 共有ドキュメントに入れる形（calendarIdは持たせない）
  const calId = SH_PREFIX + code;
  const strip = (x) => { const y = { ...x }; delete y.calendarId; return y; };
  return {
    tasks: db.tasks.filter((t) => t.calendarId === calId).map(strip),
    events: db.events.filter((e) => e.calendarId === calId).map(strip),
  };
}

function shApplyRemote(code, data) {
  const isOwner = fbUser && data.ownerUid === fbUser.uid;
  const me = fbUser && (data.members || {})[fbUser.uid];
  if (fbUser && !isOwner && !me) { // オーナーに共有を解除された
    shLeaveLocal(code);
    flashToast(`「${data.title || code}」の共有が解除されました`);
    renderAll();
    return;
  }
  db.sharedCache[code] = {
    title: data.title || '', color: data.color || 'blue', ownerUid: data.ownerUid,
    members: data.members || {}, role: isOwner ? 'owner' : (me ? me.role : 'viewer'),
    updatedAt: data.updatedAt || 0,
  };
  const calId = SH_PREFIX + code;
  const tag = (x) => ({ ...x, calendarId: calId });
  db.tasks = db.tasks.filter((t) => t.calendarId !== calId).concat((data.tasks || []).map(tag));
  db.events = db.events.filter((e) => e.calendarId !== calId).concat((data.events || []).map(tag));
  shSnap[code] = JSON.stringify([data.tasks || [], data.events || []]);
  persistLocal(); // save()にしない（クラウド押し上げのループを避ける）
  renderAll();
}

function shListen(code) {
  if (shUnsubs[code] || !fbReady || !fbUser) return;
  shUnsubs[code] = shDocRef(code).onSnapshot((snap) => {
    if (!snap.exists) { // オーナーが削除した
      const title = (db.sharedCache[code] || {}).title || code;
      shLeaveLocal(code);
      flashToast(`共有カレンダー「${title}」は削除されました`);
      renderAll();
      return;
    }
    shApplyRemote(code, snap.data());
  }, (err) => { console.warn('shared listen failed', code, err); });
}
function shListenAll() { db.sharedJoined.forEach(shListen); }
function shUnlistenAll() {
  Object.keys(shUnsubs).forEach((code) => { shUnsubs[code](); delete shUnsubs[code]; });
}

/* この端末から外す（ドキュメントは触らない） */
function shLeaveLocal(code) {
  if (shUnsubs[code]) { shUnsubs[code](); delete shUnsubs[code]; }
  db.sharedJoined = db.sharedJoined.filter((c) => c !== code);
  delete db.sharedCache[code];
  const calId = SH_PREFIX + code;
  db.tasks = db.tasks.filter((t) => t.calendarId !== calId);
  db.events = db.events.filter((e) => e.calendarId !== calId);
  if (Array.isArray(db.settings.calendarFilter)) db.settings.calendarFilter = 'all';
  save(); // sharedJoinedの変更を自分のクラウドにも反映
}

async function shPush(code) {
  const c = db.sharedCache[code];
  if (!fbReady || !fbUser || !c || c.role === 'viewer') return;
  const { tasks, events } = shItemsFor(code);
  const j = JSON.stringify([tasks, events]);
  if (shSnap[code] === j) return; // 変わっていなければ書かない（無料枠にやさしく）
  const updatedAt = Date.now();
  await shDocRef(code).update({ tasks, events, updatedAt });
  shSnap[code] = j;
  c.updatedAt = updatedAt;
  persistLocal();
}
function scheduleSharedPush() {
  if (!fbUser || !db.sharedJoined.length) return;
  clearTimeout(shPushTimer);
  shPushTimer = setTimeout(() => {
    db.sharedJoined.forEach((code) => shPush(code).catch((err) => console.warn('shared push failed', code, err)));
  }, 3000);
}

async function shCreate(title) {
  if (!navigator.onLine) { flashToast('オフラインです'); return; }
  if (!(await ensureFirebase()) || !fbUser) { flashToast('先にGoogleでログインしてね'); return; }
  const code = shNewCode();
  const data = { title, color: 'blue', ownerUid: fbUser.uid, ownerEmail: fbUser.email || '', members: {}, updatedAt: Date.now(), tasks: [], events: [] };
  try {
    await shDocRef(code).set(data);
    db.sharedJoined.push(code);
    save();
    shListen(code);
    flashToast(`「${title}」を作成しました。招待コードを共有してね`);
    renderAll();
  } catch (err) { console.warn(err); flashToast('作成できませんでした'); }
}

async function shJoin(codeRaw) {
  const code = (codeRaw || '').trim().toUpperCase();
  if (!code) return;
  if (db.sharedJoined.includes(code)) { flashToast('参加済みです'); return; }
  if (!navigator.onLine) { flashToast('オフラインです'); return; }
  if (!(await ensureFirebase()) || !fbUser) { flashToast('先にGoogleでログインしてね'); return; }
  try {
    const snap = await shDocRef(code).get();
    if (!snap.exists) { flashToast('その招待コードは見つかりませんでした'); return; }
    const data = snap.data();
    if (data.ownerUid !== fbUser.uid && !(data.members || {})[fbUser.uid]) {
      await shDocRef(code).update({ [`members.${fbUser.uid}`]: { role: 'editor', email: fbUser.email || '' } });
    }
    db.sharedJoined.push(code);
    save();
    shListen(code);
    flashToast(`「${data.title}」に参加しました`);
    renderAll();
  } catch (err) { console.warn(err); flashToast('参加できませんでした（コードを確認してね）'); }
}

/* オーナー: メンバーの権限変更（editor/viewer）・解除（null） */
async function shSetRole(code, uid, role) {
  const c = db.sharedCache[code];
  if (!c || c.role !== 'owner') return;
  try {
    const FV = window.firebase.firestore.FieldValue;
    await shDocRef(code).update({ [`members.${uid}`]: role ? { ...(c.members[uid] || {}), role } : FV.delete() });
    flashToast(role ? '権限を変更しました' : '共有を解除しました');
  } catch (err) { console.warn(err); flashToast('変更できませんでした'); }
}
async function shDelete(code) {
  const c = db.sharedCache[code];
  if (!c || c.role !== 'owner') return;
  const title = c.title || code;
  try {
    if (shUnsubs[code]) { shUnsubs[code](); delete shUnsubs[code]; }
    await shDocRef(code).delete();
    shLeaveLocal(code);
    flashToast(`「${title}」を削除しました`);
    renderAll();
  } catch (err) { console.warn(err); flashToast('削除できませんでした'); }
}
async function shLeave(code) {
  const c = db.sharedCache[code];
  try {
    if (fbUser && c && c.role !== 'owner') {
      await shDocRef(code).update({ [`members.${fbUser.uid}`]: window.firebase.firestore.FieldValue.delete() });
    }
  } catch (err) { /* 外れられなくてもローカルからは退出する */ }
  shLeaveLocal(code);
  flashToast('退出しました');
  renderAll();
}

const ROLE_LABEL = { owner: 'オーナー', editor: '編集可', viewer: '閲覧専用' };

function renderSharedCard() {
  const wrap = $('#shared-body');
  if (!wrap) return;
  wrap.textContent = '';
  if (!db.settings.syncUser) {
    wrap.append(el('p', 'hint', '上の「アカウントと同期」からGoogleでログインすると使えます。'));
    return;
  }
  const dark = effectiveDark();
  for (const code of db.sharedJoined) {
    const c = db.sharedCache[code] || { title: code, color: 'blue', role: 'viewer', members: {} };
    const row = el('div', 'sh-cal');
    const head = el('div', 'sh-head');
    const dot = el('span', 'ccdot');
    dot.style.background = (ACCENTS[c.color] || ACCENTS.blue)[dark ? 'dark' : 'light'];
    head.append(dot, el('strong', '', c.title || code), el('span', 'sh-role', ROLE_LABEL[c.role] || ''));
    row.append(head);
    const codeRow = el('div', 'sh-coderow');
    codeRow.append(el('span', 'sh-code mono', code));
    const cp = el('button', 'iconbtn');
    cp.type = 'button'; cp.setAttribute('aria-label', '招待コードをコピー'); cp.innerHTML = ICONS.copy;
    cp.addEventListener('click', () => {
      navigator.clipboard?.writeText(code).then(() => flashToast('招待コードをコピーしました')).catch(() => flashToast(`招待コード: ${code}`));
    });
    codeRow.append(cp);
    row.append(codeRow);
    if (c.role === 'owner') {
      const members = Object.entries(c.members || {});
      if (!members.length) row.append(el('p', 'hint', 'まだメンバーはいません。招待コードを伝えてね。'));
      for (const [uid, m] of members) {
        const mr = el('div', 'sh-member');
        mr.append(el('span', 'sh-email', m.email || 'メンバー'));
        const sel = document.createElement('select');
        for (const [v, label] of [['editor', '編集可'], ['viewer', '閲覧専用'], ['remove', '解除（非表示）']]) {
          const o = document.createElement('option');
          o.value = v; o.textContent = label;
          sel.append(o);
        }
        sel.value = m.role === 'viewer' ? 'viewer' : 'editor';
        sel.addEventListener('change', () => shSetRole(code, uid, sel.value === 'remove' ? null : sel.value));
        mr.append(sel);
        row.append(mr);
      }
      const delBtn = el('button', 'cta ghost danger', 'この共有カレンダーを削除');
      delBtn.type = 'button';
      delBtn.addEventListener('click', () => shDelete(code));
      row.append(delBtn);
    } else {
      const leaveBtn = el('button', 'cta ghost', '退出する');
      leaveBtn.type = 'button';
      leaveBtn.addEventListener('click', () => shLeave(code));
      row.append(leaveBtn);
    }
    wrap.append(row);
  }
  // 作成・参加フォーム
  const mkForm = (ph, btnLabel, maxLen, onGo) => {
    const fr = el('div', 'sh-form');
    const input = document.createElement('input');
    input.type = 'text'; input.placeholder = ph; input.maxLength = maxLen;
    const go = el('button', 'cta ghost', btnLabel);
    go.type = 'button';
    go.addEventListener('click', () => { const v = input.value.trim(); if (v) { onGo(v); input.value = ''; } });
    fr.append(input, go);
    return fr;
  };
  wrap.append(mkForm('新しい共有カレンダー名', '作成', 20, shCreate));
  wrap.append(mkForm('招待コードで参加', '参加', 8, shJoin));
}

/* ========== v15: ホーム表示のON/OFF（使わないビュー・タブを隠す） ========== */

const HIDE_VIEWS = [['week', '週ビュー'], ['grid', '時間ビュー'], ['year', '年ビュー']];
const HIDE_NAVS = [['insights', '振り返り'], ['anniv', '記念日'], ['routines', 'ルーティン']];

function applyVisibility() {
  const h = db.settings.hidden || {};
  for (const [v] of HIDE_VIEWS) {
    const btn = document.querySelector(`.seg-btn[data-view="${v}"]`);
    if (btn) btn.hidden = !!h[`view:${v}`];
  }
  for (const [n] of HIDE_NAVS) {
    const btn = document.querySelector(`#bottomnav button[data-nav="${n}"]`);
    if (btn) btn.hidden = !!h[`nav:${n}`];
  }
  // 隠したビュー・画面を今開いていたら安全な場所へ退避
  if ((h[`view:${ui.view}`]) && ui.screen === 'cal') ui.view = 'day';
  if (h[`nav:${ui.screen}`]) { ui.screen = 'cal'; }
}

function renderVisibilityCard() {
  const wrap = $('#visibility-body');
  if (!wrap) return;
  wrap.textContent = '';
  const h = db.settings.hidden = db.settings.hidden || {};
  const mk = (k, label) => {
    const row = el('label', 'vis-row');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !h[k]; // チェック=表示
    cb.addEventListener('change', () => {
      if (cb.checked) delete h[k]; else h[k] = true;
      save();
      applyVisibility();
      renderAll();
    });
    row.append(cb, ` ${label}`);
    wrap.append(row);
  };
  HIDE_VIEWS.forEach(([v, label]) => mk(`view:${v}`, label));
  HIDE_NAVS.forEach(([n, label]) => mk(`nav:${n}`, label));
}

/* ========== v14: 記念日（あと◯日カウントダウン） ========== */

function annivRepeat(a) { return a.repeat || (a.yearly === false ? 'once' : 'yearly'); } // 旧データ互換
function annivNext(a) { // 次の到来日と残り日数
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = a.date.split('-').map(Number);
  const rep = annivRepeat(a);
  let next;
  if (rep === 'yearly') {
    next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  } else if (rep === 'monthly') {
    next = new Date(today.getFullYear(), today.getMonth(), d);
    if (next < today) next = new Date(today.getFullYear(), today.getMonth() + 1, d);
  } else {
    next = new Date(y, m - 1, d);
  }
  const days = Math.round((next - today) / 86400000);
  const years = rep === 'yearly' ? next.getFullYear() - y : null;
  return { next, days, years, rep };
}
// この日付に記念日が当たるか（月カレンダーの星印用・繰り返しを考慮）
function annivOccursOn(a, dateObj) {
  const [y, m, d] = a.date.split('-').map(Number);
  const rep = annivRepeat(a);
  if (rep === 'monthly') return dateObj.getDate() === d;
  if (rep === 'yearly') return dateObj.getMonth() === m - 1 && dateObj.getDate() === d;
  return dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d;
}
function dayHasAnniv(dateObj) { return db.anniversaries.some((a) => annivOccursOn(a, dateObj)); }
const ANNIV_ICONS = ['sparkles', 'heart', 'cake', 'party'];
function annivIconName(a) { return (a && ANNIV_ICONS.includes(a.icon)) ? a.icon : 'sparkles'; }
function annivOnDay(dateObj) { return db.anniversaries.find((a) => annivOccursOn(a, dateObj)) || null; }

function renderAnniv() {
  const body = $('#anniv-body');
  body.textContent = '';
  const add = el('button', 'cta', '＋ 記念日を追加');
  add.type = 'button';
  add.addEventListener('click', () => openAnnivSheet());
  body.append(add);

  const list = db.anniversaries
    .map((a) => ({ a, ...annivNext(a) }))
    .sort((x, y) => x.days - y.days);
  if (!list.length) {
    body.append(el('p', 'hint', 'つきあった日・誕生日・入社日など、大切な日を登録すると「あと◯日」で表示されます。'));
    return;
  }
  const REP_LABEL = { yearly: '毎年', monthly: '毎月', once: '単発' };
  for (const { a, days, years, next, rep } of list) {
    const card = el('div', 'anniv-card');
    const ic = el('span', 'anniv-ic');
    ic.innerHTML = ICONS[annivIconName(a)];
    card.append(ic);
    const main = el('div', 'anniv-main');
    main.append(el('span', 'anniv-title', a.title));
    const sub = `${next.getFullYear()}年${next.getMonth() + 1}月${next.getDate()}日（${WD_JA[next.getDay()]}）・${REP_LABEL[rep]}${rep === 'yearly' && years ? `・${years}周年` : ''}`;
    main.append(el('span', 'anniv-sub', sub));
    card.append(main);
    const badge = el('div', `anniv-badge${days === 0 ? ' is-today' : ''}`);
    badge.innerHTML = days === 0 ? '<b>当日</b>' : `あと<b>${days}</b>日`;
    card.append(badge);
    card.addEventListener('click', () => openAnnivSheet(a)); // タップで編集（削除はシート内のボタン）
    body.append(card);
  }
}

let annivEditing = null;
function openAnnivSheet(a = null) {
  annivEditing = a;
  $('#anniv-sheet-title').textContent = a ? '記念日を編集' : '記念日を追加';
  $('#a-title').value = a ? a.title : '';
  $('#a-date').value = a ? a.date : todayKey();
  $('#a-repeat').value = a ? annivRepeat(a) : 'yearly';
  setAnnivIconSel(a ? a.icon : 'sparkles');
  $('#anniv-delete').hidden = !a;
  $('#anniv-scrim').hidden = false;
  $('#a-title').focus();
}
function deleteAnniv(a) {
  const idx = db.anniversaries.indexOf(a);
  db.anniversaries.splice(idx, 1);
  save(); renderAnniv();
  showUndoToast(`「${a.title}」を削除しました`, () => {
    db.anniversaries.splice(Math.min(idx, db.anniversaries.length), 0, a);
    save(); renderAnniv();
  });
}
// 記念日アイコンの選択UI（絵文字ではなく線アイコン）
document.querySelectorAll('#a-icon-seg button').forEach((b) => {
  b.innerHTML = ICONS[b.dataset.icon] || ICONS.sparkles;
  b.addEventListener('click', () => {
    document.querySelectorAll('#a-icon-seg button').forEach((x) => x.classList.remove('is-active'));
    b.classList.add('is-active');
  });
});
function setAnnivIconSel(name) {
  const n = ANNIV_ICONS.includes(name) ? name : 'sparkles';
  document.querySelectorAll('#a-icon-seg button').forEach((b) => b.classList.toggle('is-active', b.dataset.icon === n));
}
function getAnnivIconSel() {
  const b = document.querySelector('#a-icon-seg button.is-active');
  return b ? b.dataset.icon : 'sparkles';
}
$('#anniv-close').addEventListener('click', () => { $('#anniv-scrim').hidden = true; });
$('#anniv-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
$('#anniv-delete').addEventListener('click', () => {
  if (annivEditing) { $('#anniv-scrim').hidden = true; deleteAnniv(annivEditing); annivEditing = null; }
});
$('#anniv-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#a-title').value.trim();
  if (!title) { $('#a-title').focus(); return; }
  const date = $('#a-date').value || todayKey();
  const repeat = $('#a-repeat').value;
  const icon = getAnnivIconSel();
  if (annivEditing) {
    annivEditing.title = title; annivEditing.date = date; annivEditing.repeat = repeat; annivEditing.icon = icon;
    delete annivEditing.yearly;
  } else {
    db.anniversaries.push({ id: newId('a'), title, date, repeat, icon });
  }
  save();
  $('#anniv-scrim').hidden = true;
  annivEditing = null;
  renderAnniv();
});

/* ========== v14: 色ルール（色の意味を自分で決めるメモ） ========== */

function renderColorRuleCard() {
  const wrap = $('#colorrule-body');
  if (!wrap) return;
  wrap.textContent = '';
  const dark = effectiveDark();
  if (!db.colorRules.length) { // 何もなければ使い方の例（薄く表示）
    for (const [ex, cid] of [['村山さん', 'blue'], ['遊び', 'green'], ['仕事', 'orange']]) {
      const row = el('div', 'cr-row is-example');
      const sw = el('span', 'cr-swatch');
      sw.style.background = (ACCENTS[cid] || ACCENTS.green)[dark ? 'dark' : 'light'];
      row.append(sw, el('span', 'cr-label', `例：${ex}`));
      wrap.append(row);
    }
  }
  for (const rule of db.colorRules) {
    const row = el('div', 'cr-row');
    const sw = el('button', 'cr-swatch');
    sw.type = 'button';
    sw.style.background = (ACCENTS[rule.color] || ACCENTS.green)[dark ? 'dark' : 'light'];
    sw.setAttribute('aria-label', '色を切り替え');
    sw.addEventListener('click', () => {
      rule.color = ACCENT_KEYS[(ACCENT_KEYS.indexOf(rule.color) + 1) % ACCENT_KEYS.length];
      save(); renderColorRuleCard();
    });
    const name = document.createElement('input');
    name.type = 'text'; name.maxLength = 20; name.value = rule.label;
    name.addEventListener('blur', () => { rule.label = name.value.trim() || rule.label; save(); });
    const del = el('button', 'iconbtn');
    del.type = 'button'; del.setAttribute('aria-label', '削除'); del.innerHTML = ICONS.trash;
    del.addEventListener('click', () => {
      const idx = db.colorRules.indexOf(rule);
      db.colorRules.splice(idx, 1);
      save(); renderColorRuleCard();
    });
    row.append(sw, name, del);
    wrap.append(row);
  }
  const form = el('div', 'sh-form');
  const input = document.createElement('input');
  input.type = 'text'; input.maxLength = 20; input.placeholder = '名前や意味（例：村山さん / 遊び）';
  const add = el('button', 'cta ghost', '追加');
  add.type = 'button';
  add.addEventListener('click', () => {
    const v = input.value.trim();
    if (!v) return;
    db.colorRules.push({ id: newId('cr'), label: v, color: ACCENT_KEYS[db.colorRules.length % ACCENT_KEYS.length] });
    input.value = '';
    save(); renderColorRuleCard();
  });
  form.append(input, add);
  wrap.append(form);
}

/* ========== v14: 期間のふりかえりメモ（週・月・年ごとに書き溜め→見返し） ========== */

function periodNoteKey(period) {
  const now = new Date();
  if (period === 'week') return `w:${toKey(startOfWeekMon(now))}`;
  if (period === 'month') return `m:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `y:${now.getFullYear()}`;
}
function periodNoteLabel(key) {
  const [t, rest] = key.split(':');
  if (t === 'w') { const s = fromKey(rest); const e2 = addDays(s, 6); return `${s.getMonth() + 1}/${s.getDate()}〜${e2.getMonth() + 1}/${e2.getDate()}の週`; }
  if (t === 'm') { const [y, m] = rest.split('-'); return `${y}年${Number(m)}月`; }
  return `${rest}年`;
}
function renderPeriodNote(container, period, periodLabel) {
  const key = periodNoteKey(period);
  const card = el('div', 'card chart-card');
  card.append(el('p', 'section-label', `${periodLabel}のふりかえりメモ`));
  const ta = document.createElement('textarea');
  ta.className = 'period-note';
  ta.rows = 2;
  ta.maxLength = 1000;
  ta.placeholder = `${periodLabel}どうだった？よかったこと・気づき・来${period === 'week' ? '週' : period === 'month' ? '月' : '年'}やりたいこと…`;
  ta.value = db.periodNotes[key] || '';
  ta.addEventListener('blur', () => {
    const v = ta.value.trim();
    if (v) db.periodNotes[key] = v; else delete db.periodNotes[key];
    save();
  });
  card.append(ta);
  // これまでのメモ（同じ種類＝週なら週・月なら月…を新しい順に）
  const past = Object.keys(db.periodNotes)
    .filter((k) => k[0] === key[0] && k !== key)
    .sort().reverse();
  if (past.length) {
    const rev = el('div', 'pn-review');
    rev.append(el('p', 'section-label', 'これまでのメモ'));
    for (const k of past) {
      const row = el('div', 'pn-row');
      row.append(el('span', 'pn-date', periodNoteLabel(k)));
      row.append(el('span', 'pn-text', db.periodNotes[k]));
      rev.append(row);
    }
    card.append(rev);
  }
  container.append(card);
}

/* ========== v15: Notion連携（Cloudflare Worker中継で日々の記録をNotionへ） ========== */

let notionPushTimer = null;
function notionCfg() { return db.settings.notion || (db.settings.notion = { url: '', secret: '', dbId: '', on: false }); }
function notionReady() { const n = notionCfg(); return Boolean(n.url && n.secret && n.dbId); }

// その日の記録をひとまとめに（日記＝タスク/予定の日記＋ひとことメモ）
function notionDayPayload(key) {
  const n = notionCfg();
  const diaries = [];
  const memos = [];
  const log = db.dayLogs[key];
  if (log) diaries.push(`【あのね。ノート】${log}`);
  const note = db.notes[key];
  if (note) diaries.push(`【ひとこと】${note}`);
  for (const it of itemsFor(key)) {
    const dv = diaryFor(it);
    if (dv) diaries.push(`【${it.title}】${dv}`);
    const mv = memoFor(it);
    if (mv) memos.push(`【${it.title}】${mv}`);
  }
  const d = fromKey(key);
  const rec = db.sleep[key] || {};
  return {
    dbId: n.dbId,
    date: key,
    title: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD_JA[d.getDay()]}）`,
    diary: diaries.join('\n') || null,       // あのね。ノート＋ひとこと＋各タスク/予定の日記（全文）
    memo: memos.join('\n') || null,          // 各タスク/予定の「メモ」をまとめて反映
    doneCount: tasksStatsFor(key).done,
    bed: rec.bed || null,
    wake: rec.wake || null,
  };
}

async function notionPush(key, { silent = true } = {}) {
  const n = notionCfg();
  if (!notionReady()) { if (!silent) flashToast('先にNotion連携の設定（URL・合言葉・DB ID）を入れてね'); return false; }
  try {
    const res = await fetch(n.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-TC-Secret': n.secret },
      body: JSON.stringify(notionDayPayload(key)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      const code = [data.error || res.status, data.status].filter(Boolean).join(' ');
      if (!silent) flashToast(`Notionへ送れませんでした（${code}）`);
      return false;
    }
    n.lastPushAt = Date.now();
    persistLocal();
    if (!silent) flashToast(data.updated ? 'Notionの今日のページを更新しました' : 'Notionに今日のページを作成しました');
    if (ui.screen === 'settings') renderNotionCard();
    return true;
  } catch (err) {
    if (!silent) flashToast('Notionへの送信に失敗しました（Worker URLを確認してね）');
    return false;
  }
}
// 保存後の自動送信（ON時・今日の分だけ・8秒デバウンスで無料枠にやさしく）
function scheduleNotionPush() {
  if (!notionCfg().on || !notionReady()) return;
  clearTimeout(notionPushTimer);
  notionPushTimer = setTimeout(() => notionPush(todayKey(), { silent: true }), 8000);
}

function renderNotionCard() {
  const wrap = $('#notion-body');
  if (!wrap) return;
  wrap.textContent = '';
  const n = notionCfg();
  const field = (label, key, ph, type) => {
    const l = el('label', 'f-label', label);
    const inp = document.createElement('input');
    inp.type = type || 'text';
    inp.value = n[key] || '';
    inp.placeholder = ph;
    inp.addEventListener('change', () => { n[key] = inp.value.trim(); persistLocal(); if (ui.screen === 'settings') renderNotionCard(); });
    wrap.append(l, inp);
  };
  field('Worker URL', 'url', 'https://xxx.workers.dev');
  field('合言葉（Workerに設定した TC_SHARED_SECRET）', 'secret', '長めの文字列', 'password');
  field('NotionデータベースID', 'dbId', '32桁の英数字');

  const tg = el('label', 'sync-toggle');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = n.on !== false && !!n.on;
  cb.addEventListener('change', () => { n.on = cb.checked; persistLocal(); });
  tg.append(cb, ' 保存時に自動でNotionへ送る（今日の分）');
  wrap.append(tg);

  const btn = el('button', 'cta', '今日の記録をNotionに送る');
  btn.type = 'button';
  btn.disabled = !notionReady();
  btn.addEventListener('click', () => notionPush(todayKey(), { silent: false }));
  wrap.append(btn);

  if (n.lastPushAt) wrap.append(el('p', 'hint', `最後に送信: ${new Date(n.lastPushAt).toLocaleString('ja-JP')}`));
}

/* ========== PWA ========== */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      // オフライン対応が効かないだけでアプリ本体は動く
      console.warn('Task Calendar: service worker registration failed', err);
    });
  });
}

/* ========== init ========== */

applyTheme();
applyFont();
applySize();
applyStyle();
applyZoomLock();
applyStickyHeader();
// 実行中タイマーの復元（リロード・再起動後）
if (db.running) {
  const r = db.running;
  if (!r.paused && !r.finished && r.endAt && r.endAt - Date.now() <= 0) {
    r.finished = true;
    r.remainingMs = 0;
    r.endAt = null;
    save();
  }
  startTick();
}
ui.selectedKey = todayKey();
renderAll();
