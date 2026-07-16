'use strict';

/* ========== constants ========== */

const STORAGE_V2 = 'nest.task-calendar.v2';
const STORAGE_V1 = 'nest.task-calendar.v1';
const BASE_TITLE = document.title;
const WD_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WD_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const REPEAT_LABEL = { daily: '毎日', weekly: '毎週', monthly: '毎月', yearly: '毎年' };
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
};

/* ========== persistent data ========== */

function defaultDb() {
  return { tasks: [], events: [], notes: {}, routines: [], goals: {}, sleep: {}, calendars: [{ id: 'c-default', name: 'マイカレンダー', color: 'green', order: 0 }], boards: [], boardItems: [], settings: { theme: 'auto', accent: 'green', font: 'gothic', monthStyle: 'dots', fontSize: 'large', calendarFilter: 'all' }, running: null };
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

const db = loadDb();
if (!Array.isArray(db.calendars) || db.calendars.length === 0) {
  db.calendars = [{ id: 'c-default', name: 'マイカレンダー', color: 'green', order: 0 }];
}

function save() {
  try {
    localStorage.setItem(STORAGE_V2, JSON.stringify(db));
  } catch (err) {
    console.warn('Task Calendar: failed to save', err); // keep working in-memory
  }
}

/* ========== ui state (not persisted) ========== */

const ui = {
  screen: 'cal',            // 'cal' | 'insights' | 'settings'
  prevScreen: 'cal',
  view: 'day',              // 'day' | 'week' | 'month'
  cursor: new Date(),
  selectedKey: null,        // month view: selected date key
  selectedItemId: null,     // accent-framed item
  justToggledId: null,
  justAddedId: null,
  sheetType: 'task',
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
  }
  if (!t.repeat) return t.date === key;
  if (key < t.startDate || (t.exDates || []).includes(key)) return false;
  const d = fromKey(key);
  const s = fromKey(t.startDate);
  if (t.repeat === 'daily') return true;
  if (t.repeat === 'weekly') return d.getDay() === s.getDay();
  if (t.repeat === 'monthly') return d.getDate() === s.getDate(); // 31日など存在しない月は自然にスキップ
  if (t.repeat === 'yearly') return d.getDate() === s.getDate() && d.getMonth() === s.getMonth();
  return false;
}
function taskDoneOn(t, key) { return t.repeat ? Boolean((t.doneDates || {})[key]) : Boolean(t.done); }
function taskDoneAt(t, key) { return t.repeat ? (t.doneDates || {})[key] || null : t.doneAt; }
const MAX_CALENDARS = 8; // 仕様§7: 色の見分けとチップ視認性の上限

function allFilterIds() {
  const ids = db.calendars.map((c) => c.id);
  if (db.routines.length) ids.push('routine');
  return ids;
}
function passFilter(it) {
  const f = db.settings.calendarFilter;
  if (!f || f === 'all') return true;
  if (it.kind === 'task' && it.ref.routineId) return f.includes('routine');
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
  if (it.ref.color) return pick(it.ref.color);
  if (it.kind === 'task' && it.ref.routineId) {
    const r = db.routines.find((x) => x.id === it.ref.routineId);
    if (r) return pick(r.color);
  }
  const calId = it.ref.calendarId;
  if (calId && calId !== 'c-default') {
    const cal = db.calendars.find((x) => x.id === calId);
    if (cal) return pick(cal.color);
  }
  return null;
}
function memoFor(it) {
  const r = it.ref;
  if (r.repeat) return (r.memoDates || {})[it.key] ?? r.memo ?? null;
  return r.memo || null;
}

function itemsFor(key) {
  const items = [];
  for (const t of db.tasks) {
    if (!occursOn(t, key)) continue;
    items.push({ kind: 'task', id: `${t.id}@${key}`, ref: t, key, title: t.title, time: t.time || '', minutes: t.minutes || null, repeat: t.repeat || null, done: taskDoneOn(t, key) });
  }
  for (const e of db.events) {
    if (e.date !== key) continue;
    items.push({ kind: 'event', id: `${e.id}@${key}`, ref: e, key, title: e.title, time: e.time || '', minutes: null, repeat: null, done: false });
  }
  return items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || (a.ref.createdAt || 0) - (b.ref.createdAt || 0));
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

function toggleItem(it) {
  const t = it.ref;
  if (t.repeat) {
    t.doneDates = t.doneDates || {};
    if (t.doneDates[it.key]) delete t.doneDates[it.key];
    else t.doneDates[it.key] = Date.now();
  } else {
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : null;
  }
  ui.justToggledId = taskDoneOn(t, it.key) ? it.id : null;
  save();
  renderAll();
  ui.justToggledId = null;
}

function deleteItem(it) {
  if (it.kind === 'event') {
    const index = db.events.indexOf(it.ref);
    db.events.splice(index, 1);
    save(); renderAll();
    showUndoToast(`「${it.title}」を削除しました`, () => {
      db.events.splice(Math.min(index, db.events.length), 0, it.ref);
      save(); renderAll();
    });
    return;
  }
  if (it.ref.repeat) { // 繰り返しは「この回のみ／すべて」を選ぶ
    ui.confirmTarget = it;
    $('#confirm-name').textContent = `「${it.title}」（${REPEAT_LABEL[it.ref.repeat]}）`;
    $('#confirm-scrim').hidden = false;
    return;
  }
  const index = db.tasks.indexOf(it.ref);
  db.tasks.splice(index, 1);
  save(); renderAll();
  showUndoToast(`「${it.title}」を削除しました`, () => {
    db.tasks.splice(Math.min(index, db.tasks.length), 0, it.ref);
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
  const index = db.tasks.indexOf(it.ref);
  db.tasks.splice(index, 1);
  save(); renderAll();
  showUndoToast(`「${it.title}」の繰り返しを削除しました`, () => {
    db.tasks.splice(Math.min(index, db.tasks.length), 0, it.ref);
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
  const memo = memoFor(it);
  if (memo && !compact) main.append(el('span', 'item-memo', memo));
  card.append(main);

  const ownColor = itemColor(it);
  if (ownColor) { // 自分の色 or ルーティン色のタグ
    const dot = el('span', 'routine-dot');
    dot.style.background = ownColor;
    card.append(dot);
  }
  if (it.kind === 'event') card.append(el('span', 'chip', '予定'));
  if (showTime && it.time) {
    const c = el('span', 'chip mono');
    c.innerHTML = ICONS.clock;
    c.append(` ${it.time}`);
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

  // タップで選択（アクセント色の枠）— 設定で色を変えられる
  card.addEventListener('click', () => {
    ui.selectedItemId = ui.selectedItemId === it.id ? null : it.id;
    renderAll();
  });

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
function navigate(dir) {
  const c = ui.cursor;
  if (ui.view === 'day') ui.cursor = addDays(c, dir);
  else if (ui.view === 'week') ui.cursor = addDays(c, dir * 7);
  else if (ui.view === 'year') ui.cursor = new Date(c.getFullYear() + dir, 0, 1);
  else {
    ui.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
    ui.selectedKey = toKey(ui.cursor);
  }
  renderAll();
}

/* ========== rendering ========== */

function renderAll() {
  $('#scr-cal').hidden = ui.screen !== 'cal';
  $('#scr-insights').hidden = ui.screen !== 'insights';
  $('#scr-settings').hidden = ui.screen !== 'settings';
  $('#scr-routines').hidden = ui.screen !== 'routines';
  $('#fab').hidden = ui.screen === 'settings' || ui.screen === 'routines';

  const streak = String(streakDays());
  $('#chip-streak').textContent = streak;
  $('#chip-streak2').textContent = streak;

  document.querySelectorAll('#bottomnav button').forEach((b) => {
    const nav = b.dataset.nav;
    const active = (nav === 'today' && ui.screen === 'cal' && ui.view === 'day')
      || (nav === 'calendar' && ui.screen === 'cal' && ui.view !== 'day')
      || (nav === 'insights' && ui.screen === 'insights')
      || (nav === 'routines' && ui.screen === 'routines');
    b.classList.toggle('is-active', active);
  });

  if (ui.screen === 'cal') renderCal();
  if (ui.screen === 'insights') renderInsights();
  if (ui.screen === 'settings') renderSettings();
  if (ui.screen === 'routines') renderRoutines();
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
  if (ui.view === 'week') return `w:${toKey(startOfWeekMon(c))}`;
  if (ui.view === 'month') return `m:${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, '0')}`;
  return `y:${c.getFullYear()}`;
}
const GOAL_PLACEHOLDER = { day: '今日の目標を書く…', week: '今週の目標を書く…', month: '今月の目標を書く…', year: '今年の目標を書く…' };

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

  if (ui.view !== 'week') $('#cal-title').classList.remove('small');

  const goalLine = $('#goal-line');
  if (!goalLine.dataset.editing) {
    const g = db.goals[goalKey()];
    goalLine.textContent = g || GOAL_PLACEHOLDER[ui.view];
    goalLine.classList.toggle('is-empty', !g);
  }
  const body = $('#cal-body');
  body.textContent = '';
  openSwipeEl = null;

  // マイカレンダーのフィルタチップ（TimeTree風）
  if (db.calendars.length > 1 || db.routines.length) {
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
    if (db.routines.length) chips.append(mkChip('routine', 'ルーティン', f === 'all' || f.includes('routine')));
    body.append(chips);
  }
  if (ui.view === 'day') renderDay(body);
  if (ui.view === 'week') renderWeek(body);
  if (ui.view === 'month') renderMonth(body);
  if (ui.view === 'year') renderYear(body);
}

/* ----- day（タイムライン） ----- */

function renderDay(body) {
  const key = toKey(ui.cursor);
  if (db.running) body.append(buildRunCard());

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
    return;
  }
  const tl = el('div', 'tl');
  for (const it of items) {
    const row = el('div', `tl-row${it.done ? ' is-done' : ''}${it.kind === 'event' ? ' is-event' : ''}`);
    row.append(el('span', 'tl-time mono', it.time || ''));
    row.append(el('span', 'tl-rail'));
    const slot = el('div', 'tl-item');
    slot.append(buildItemCard(it));
    row.append(slot);
    tl.append(row);
  }
  body.append(tl);
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
    const items = itemsFor(key).filter(passFilter);
    const isOther = day.getMonth() !== c.getMonth();
    const cell = el('button', [
      'mo-cell',
      isOther ? 'is-other' : '',
      key === todayKey() ? 'is-today' : '',
      key === ui.selectedKey ? 'is-selected' : '',
    ].filter(Boolean).join(' '));
    cell.type = 'button';
    cell.setAttribute('aria-label', `${day.getMonth() + 1}月${day.getDate()}日を選択`);
    cell.append(el('span', `dnum${dayColorClass(day)}`, String(day.getDate())));
    if (schedule) { // TimeTree風: 日付の下に色つきラベル（最大4件）
      for (const it of items.slice(0, 4)) {
        const chip = el('span', `mo-chip${it.done ? ' is-done' : ''}${it.kind === 'event' && !it.ref.color ? ' is-event-chip' : ''}`, it.title);
        const cc = itemColor(it);
        if (cc) chip.style.background = cc;
        cell.append(chip);
      }
      if (items.length > 4) cell.append(el('span', 'mo-chip-more', `+${items.length - 4}`));
    } else {
      const dots = el('span', 'mo-dots');
      for (const it of items.slice(0, MAX_MONTH_DOTS)) {
        dots.append(el('span', `mdot ${it.kind === 'event' ? 'event' : it.done ? 'done' : 'undone'}`));
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

/* ----- 睡眠記録（朝活サポート: この日の起床とその前夜の就寝） ----- */

function toMin(t) { return Number(t.slice(0, 2)) * 60 + Number(t.slice(3)); }
function sleepDurMin(rec) { return (toMin(rec.wake) - toMin(rec.bed) + 1440) % 1440; }
function fmtDur(min) { return `${Math.floor(min / 60)}時間${String(Math.round(min % 60)).padStart(2, '0')}分`; }
function fmtClock(min) { const m2 = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m2 / 60)).padStart(2, '0')}:${String(m2 % 60).padStart(2, '0')}`; }

function buildSleepCard(key) {
  const rec = db.sleep[key] || {};
  const card = el('div', 'sleep-card');
  card.innerHTML = `${ICONS.clock}<span>就寝</span>`;
  const bed = document.createElement('input');
  bed.type = 'time'; bed.value = rec.bed || '';
  const wakeLabel = el('span', '', '起床');
  const wake = document.createElement('input');
  wake.type = 'time'; wake.value = rec.wake || '';
  const dur = el('span', 'sleep-dur');
  const sync = () => {
    const r = { bed: bed.value || null, wake: wake.value || null };
    if (r.bed || r.wake) db.sleep[key] = r; else delete db.sleep[key];
    dur.textContent = r.bed && r.wake ? fmtDur(sleepDurMin(r)) : '';
    save();
  };
  bed.addEventListener('change', sync);
  wake.addEventListener('change', sync);
  if (rec.bed && rec.wake) dur.textContent = fmtDur(sleepDurMin(rec));
  card.append(bed, wakeLabel, wake, dur);
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
    const durAvg = sleepRecs.reduce((a, r) => a + sleepDurMin(r), 0) / sleepRecs.length;
    const sCard = el('div', 'card chart-card');
    sCard.append(el('p', 'section-label', `睡眠（${sleepRecs.length}日分）`));
    const row = el('div', 'stats-row');
    const mk = (num, label) => { const d2 = el('div', 'stat-card'); d2.innerHTML = `<div class="stat-num" style="font-size:18px">${num}</div><div class="stat-label">${label}</div>`; return d2; };
    row.append(mk(fmtClock(bedAvg), '平均就寝'), mk(fmtClock(wakeAvg), '平均起床'), mk(fmtDur(durAvg), '平均睡眠'));
    sCard.append(row);
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

function renderSettings() {
  renderCalManage();
  document.querySelectorAll('#theme-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.themeOpt === db.settings.theme);
  });
  document.querySelectorAll('#size-seg button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.sizeOpt === (db.settings.fontSize || 'large'));
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
  taskOnly: $('#task-only-fields'),
  repeatHint: $('#repeat-hint'),
};

function openSheet(mode, { item = null, dateKey = null } = {}) {
  ui.editing = mode === 'edit' ? item : null;
  ui.sheetType = item ? item.kind : 'task';
  sheetEls.title.textContent = mode === 'edit' ? '編集' : '追加';
  sheetEls.typeSeg.hidden = mode === 'edit'; // 種類はあとから変えない
  syncSheetType();

  if (item) {
    const r = item.ref;
    sheetEls.fTitle.value = r.title;
    sheetEls.fDate.value = r.repeat ? r.startDate : r.date;
    sheetEls.fTime.value = r.time || '';
    sheetEls.fMinutes.value = r.minutes || '';
    sheetEls.fRepeat.value = r.repeat || '';
    sheetEls.fMemo.value = memoFor(item) || '';
    sheetEls.repeatHint.hidden = !r.repeat;
  } else {
    sheetEls.fTitle.value = '';
    sheetEls.fDate.value = dateKey || (ui.view === 'month' ? (ui.selectedKey || todayKey()) : toKey(ui.cursor));
    sheetEls.fTime.value = '';
    sheetEls.fMinutes.value = '';
    sheetEls.fRepeat.value = '';
    sheetEls.fMemo.value = '';
    sheetEls.repeatHint.hidden = true;
  }
  buildSheetColors(item ? (item.ref.color || '') : '');
  const calSel = $('#f-cal');
  calSel.textContent = '';
  for (const cal of db.calendars) {
    const o = document.createElement('option');
    o.value = cal.id;
    o.textContent = cal.name;
    calSel.append(o);
  }
  calSel.value = item ? (item.ref.calendarId || 'c-default') : 'c-default';
  const single = db.calendars.length < 2;
  calSel.hidden = single;
  $('#f-cal-label').hidden = single;
  sheetEls.scrim.hidden = false;
  sheetEls.fTitle.focus();
}
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
  sheetEls.taskOnly.hidden = ui.sheetType !== 'task';
}

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
  const time = sheetEls.fTime.value || null;
  const rawMin = parseInt(sheetEls.fMinutes.value, 10);
  const minutes = Number.isInteger(rawMin) && rawMin >= 1 && rawMin <= 600 ? rawMin : null;
  const repeat = sheetEls.fRepeat.value || null;
  const memo = sheetEls.fMemo.value.trim() || null;
  const color = $('#f-colors .accent-swatch.is-active')?.dataset.color || null;
  const calSelV = $('#f-cal').value;
  const calendarId = calSelV && calSelV !== 'c-default' ? calSelV : null;

  if (ui.editing) {
    applyEdit(ui.editing, { title, dateKey, time, minutes, repeat, memo, color, calendarId });
  } else if (ui.sheetType === 'event') {
    const ev = { id: newId('e'), title, date: dateKey, time, memo, color, calendarId, createdAt: Date.now() };
    db.events.push(ev);
    ui.justAddedId = `${ev.id}@${dateKey}`;
  } else if (repeat) {
    const t = { id: newId('t'), title, time, minutes, repeat, startDate: dateKey, doneDates: {}, exDates: [], memo, memoDates: {}, color, calendarId, createdAt: Date.now() };
    db.tasks.push(t);
    ui.justAddedId = `${t.id}@${dateKey}`;
  } else {
    const t = { id: newId('t'), title, date: dateKey, time, minutes, done: false, doneAt: null, memo, color, calendarId, createdAt: Date.now() };
    db.tasks.push(t);
    ui.justAddedId = `${t.id}@${dateKey}`;
  }
  save();
  closeSheet();
  renderAll();
  ui.justAddedId = null;
});

function newId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

function applyEdit(item, { title, dateKey, time, minutes, repeat, memo, color, calendarId }) {
  const r = item.ref;
  r.title = title;
  r.time = time;
  r.color = color;
  r.calendarId = calendarId;
  if (item.kind === 'event') {
    r.date = dateKey;
    r.memo = memo;
    return;
  }
  if (r.repeat && repeat) { // 繰り返しのメモは「この日の分」として保存（日記になる）
    r.memoDates = r.memoDates || {};
    if (memo) r.memoDates[item.key] = memo;
    else delete r.memoDates[item.key];
  } else {
    r.memo = memo;
  }
  r.minutes = minutes;
  const wasRepeat = Boolean(r.repeat);
  const nowRepeat = Boolean(repeat);
  if (nowRepeat) {
    r.repeat = repeat;
    r.startDate = dateKey;
    r.exDates = r.exDates || [];
    if (!wasRepeat) { // 単発→繰り返しへ変換
      r.doneDates = r.done && r.date ? { [r.date]: r.doneAt || Date.now() } : {};
      delete r.date; delete r.done; delete r.doneAt;
    }
  } else if (wasRepeat) { // 繰り返し→単発へ変換（この画面の日付の1件にする）
    r.date = dateKey;
    r.done = Boolean((r.doneDates || {})[dateKey]);
    r.doneAt = (r.doneDates || {})[dateKey] || null;
    delete r.repeat; delete r.startDate; delete r.doneDates; delete r.exDates;
  } else {
    r.date = dateKey;
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
  r.finished = true;
  r.paused = false;
  r.remainingMs = 0;
  r.endAt = null;
  save();
  chime();
  updateTimerUI();
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

  // ルーティン｜ビジョン 切替（仕様: ビジョンボードはこのタブ内）
  const rvSeg = el('div', 'seg rv-seg');
  [['routines', 'ルーティン'], ['vision', 'ビジョン']].forEach(([v, label]) => {
    const b = el('button', `seg-btn${(ui.routineTab || 'routines') === v ? ' is-active' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => { ui.routineTab = v; renderAll(); });
    rvSeg.append(b);
  });
  body.append(rvSeg);
  if ((ui.routineTab || 'routines') === 'vision') { vbPicked = null; renderVisions(body); return; }

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
    card.append(head);

    const list = el('ul', 'r-item-list');
    for (const t of routineTasks(r)) {
      const li = el('li');
      li.append(el('span', 'chip', REPEAT_LABEL[t.repeat] || '毎日'));
      li.append(el('span', 'r-item-title', t.title));
      if (t.time) li.append(el('span', 'r-item-time', t.time));
      if (t.minutes) li.append(el('span', 'r-item-time', `${t.minutes}分`));
      list.append(li);
    }
    if (routineTasks(r).length === 0) {
      const li = el('li');
      li.append(el('span', 'r-item-title', 'タスクがまだありません（編集から追加）'));
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

function routineItemRow(data = {}) {
  const row = el('div', 'r-item-row');
  const title = document.createElement('input');
  title.type = 'text'; title.maxLength = 80; title.placeholder = '例：ウォーキング'; title.value = data.title || '';
  const rep = document.createElement('select');
  [['daily', '毎日'], ['weekly', '毎週'], ['monthly', '毎月']].forEach(([v, l]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = l; rep.append(o);
  });
  rep.value = data.repeat || 'daily';
  const time = document.createElement('input');
  time.type = 'time'; time.className = 'mono'; time.value = data.time || '';
  const min = document.createElement('input');
  min.type = 'number'; min.min = 1; min.max = 600; min.placeholder = '分'; min.className = 'mono'; min.value = data.minutes || '';
  const rm = el('button', 'del-btn');
  rm.type = 'button'; rm.setAttribute('aria-label', 'この行を削除'); rm.innerHTML = ICONS.trash;
  rm.addEventListener('click', () => row.remove());
  row.append(title, rep, time, min, rm);
  if (data.taskId) row.dataset.taskId = data.taskId;
  row._fields = { title, rep, time, min };
  return row;
}

function openRoutineSheet(r) {
  routineEditing = r;
  $('#r-sheet-title').textContent = r ? 'ルーティンを編集' : '新しいルーティン';
  $('#r-title').value = r ? r.title : '';
  $('#r-goal').value = r ? (r.goal || '') : '';
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
    for (const t of routineTasks(r)) {
      items.append(routineItemRow({ taskId: t.id, title: t.title, repeat: t.repeat, time: t.time, minutes: t.minutes }));
    }
  }
  if (!items.children.length) items.append(routineItemRow());
  $('#routine-scrim').hidden = false;
  $('#r-title').focus();
}
$('#r-add-item').addEventListener('click', () => $('#r-items').append(routineItemRow()));
$('#routine-scrim').addEventListener('click', (e) => { if (e.target === e.currentTarget) $('#routine-scrim').hidden = true; });

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

  let r = routineEditing;
  if (!r) {
    r = { id: newId('r'), title, goal, color, targetPerWeek: target, active: true, pausedFrom: null, startDate: todayKey(), createdAt: Date.now() };
    db.routines.push(r);
  } else {
    r.title = title; r.goal = goal; r.color = color; r.targetPerWeek = target;
  }

  // アイテム行と実タスクを同期（行が消えた=タスク削除、taskIdなし=新規）
  const keptIds = new Set();
  for (const row of $('#r-items').children) {
    const f = row._fields;
    const t2 = f.title.value.trim();
    if (!t2) continue;
    const minRaw = parseInt(f.min.value, 10);
    const minutes = Number.isInteger(minRaw) && minRaw >= 1 && minRaw <= 600 ? minRaw : null;
    const time = f.time.value || null;
    const repeat = f.rep.value;
    if (row.dataset.taskId) {
      const t = db.tasks.find((x) => x.id === row.dataset.taskId);
      if (t) { t.title = t2; t.time = time; t.minutes = minutes; t.repeat = repeat; keptIds.add(t.id); }
    } else {
      const t = { id: newId('t'), routineId: r.id, title: t2, time, minutes, repeat, startDate: r.startDate || todayKey(), doneDates: {}, exDates: [], memo: null, memoDates: {}, createdAt: Date.now() };
      db.tasks.push(t);
      keptIds.add(t.id);
    }
  }
  db.tasks = db.tasks.filter((t) => t.routineId !== r.id || keptIds.has(t.id));

  save();
  $('#routine-scrim').hidden = true;
  routineEditing = null;
  renderAll();
});

/* ----- 削除 ----- */

function deleteRoutine(r, keepTasks) {
  const rIndex = db.routines.indexOf(r);
  const affected = routineTasks(r);
  db.routines.splice(rIndex, 1);
  if (keepTasks) affected.forEach((t) => { delete t.routineId; }); // ふつうの繰り返しタスクとして残す
  else db.tasks = db.tasks.filter((t) => t.routineId !== r.id);
  save(); renderAll();
  showUndoToast(`「${r.title}」を削除しました`, () => {
    db.routines.splice(Math.min(rIndex, db.routines.length), 0, r);
    if (keepTasks) affected.forEach((t) => { t.routineId = r.id; });
    else db.tasks.push(...affected);
    save(); renderAll();
  });
}
$('#rdel-keep').addEventListener('click', () => { $('#rdel-scrim').hidden = true; if (rdelTarget) deleteRoutine(rdelTarget, true); rdelTarget = null; });
$('#rdel-all').addEventListener('click', () => { $('#rdel-scrim').hidden = true; if (rdelTarget) deleteRoutine(rdelTarget, false); rdelTarget = null; });
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
