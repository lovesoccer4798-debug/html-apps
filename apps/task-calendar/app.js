'use strict';

/* ========== constants ========== */

const STORAGE_KEY = 'nest.task-calendar.v1';
const BASE_TITLE = document.title;
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MAX_MONTH_DOTS = 4;
const UNDO_TOAST_MS = 6000;
const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // must match r="88" in index.html

const ICON_ATTRS = 'class="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
/* Lucide icons, inlined per docs/design-guide.md (no CDN) */
const ICONS = {
  check: `<svg ${ICON_ATTRS}><path d="M20 6 9 17l-5-5"/></svg>`,
  play: `<svg ${ICON_ATTRS}><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`,
  pause: `<svg ${ICON_ATTRS}><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>`,
  clock: `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  trash: `<svg ${ICON_ATTRS}><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
};

/* ========== state ========== */

const state = {
  tasks: loadTasks(),
  view: 'day',          // 'day' | 'week' | 'month'
  cursor: new Date(),   // the date the views are centered on
  justToggledId: null,  // replay the check "pop" only on the toggled task
  justAddedId: null,    // replay the row "rise" only on the added task
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.tasks) ? data.tasks : [];
  } catch (err) {
    console.warn('Task Calendar: failed to load, starting empty', err);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: state.tasks }));
  } catch (err) {
    // keep working in-memory (spec §5)
    console.warn('Task Calendar: failed to save', err);
  }
}

/* ========== date helpers (local timezone) ========== */

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d) { // week starts on Sunday
  return addDays(d, -d.getDay());
}
function todayKey() {
  return toKey(new Date());
}
function tasksOn(key) {
  return state.tasks
    .filter((t) => t.date === key)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/* ========== dom ========== */

const $ = (sel) => document.querySelector(sel);
const els = {
  statToday: $('#stat-today'),
  statStreak: $('#stat-streak'),
  statTotal: $('#stat-total'),
  heading: $('#heading'),
  views: {
    day: $('#view-day'),
    week: $('#view-week'),
    month: $('#view-month'),
  },
  addForm: $('#add-form'),
  addTitle: $('#add-title'),
  addMinutes: $('#add-minutes'),
  timePresets: $('#time-presets'),
  dayProgress: $('#day-progress'),
  barFill: $('#bar-fill'),
  barText: $('#bar-text'),
  celebrate: $('#celebrate'),
  dayList: $('#day-list'),
  dayEmpty: $('#day-empty'),
  weekGrid: $('#week-grid'),
  monthWeekdays: $('#month-weekdays'),
  monthGrid: $('#month-grid'),
  timerOverlay: $('#timer-overlay'),
  timerCard: document.querySelector('.timer-card'),
  timerTask: $('#timer-task'),
  timerTime: $('#timer-time'),
  timerMsg: $('#timer-msg'),
  timerToggle: $('#timer-toggle'),
  ringFg: $('#ring-fg'),
  toast: $('#toast'),
  toastText: $('#toast-text'),
  toastUndo: $('#toast-undo'),
};

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/* ========== task operations ========== */

function addTask(title, minutes) {
  const id = `t${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  state.tasks.push({
    id,
    title,
    date: toKey(state.cursor),
    minutes,
    done: false,
    doneAt: null,
    createdAt: Date.now(),
  });
  saveTasks();
  state.justAddedId = id;
  renderAll();
  state.justAddedId = null;
}

function toggleDone(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.doneAt = task.done ? Date.now() : null;
  state.justToggledId = task.done ? id : null;
  saveTasks();
  renderAll();
  state.justToggledId = null;
}

function removeTask(id) {
  const index = state.tasks.findIndex((t) => t.id === id);
  if (index === -1) return;
  const [removed] = state.tasks.splice(index, 1);
  saveTasks();
  renderAll();
  showUndoToast(`「${removed.title}」を削除しました`, () => {
    state.tasks.splice(Math.min(index, state.tasks.length), 0, removed);
    saveTasks();
    renderAll();
  });
}

/* ========== undo toast ========== */

let toastTimer = null;
let undoAction = null;

function showUndoToast(text, onUndo) {
  els.toastText.textContent = text;
  undoAction = onUndo;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, UNDO_TOAST_MS);
}
function hideToast() {
  els.toast.hidden = true;
  undoAction = null;
  clearTimeout(toastTimer);
}
els.toastUndo.addEventListener('click', () => {
  if (undoAction) undoAction();
  hideToast();
});

/* ========== rendering ========== */

function renderAll() {
  renderStats();
  renderHeading();
  for (const [name, section] of Object.entries(els.views)) {
    section.hidden = name !== state.view;
  }
  if (state.view === 'day') renderDay();
  if (state.view === 'week') renderWeek();
  if (state.view === 'month') renderMonth();
}

function renderStats() {
  const todays = tasksOn(todayKey());
  const doneToday = todays.filter((t) => t.done).length;
  els.statToday.textContent = `${doneToday}/${todays.length}`;
  els.statStreak.textContent = `${streakDays()}日`;
  els.statTotal.textContent = String(state.tasks.filter((t) => t.done).length);
}

/* consecutive days (ending today, or yesterday if today has none yet)
   with at least one completed task — the habit-building meter */
function streakDays() {
  const doneDates = new Set(state.tasks.filter((t) => t.done).map((t) => t.date));
  let d = new Date();
  if (!doneDates.has(toKey(d))) d = addDays(d, -1);
  let n = 0;
  while (doneDates.has(toKey(d))) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

function renderHeading() {
  const c = state.cursor;
  els.heading.textContent = '';
  if (state.view === 'day') {
    els.heading.append(`${c.getFullYear()}年${c.getMonth() + 1}月${c.getDate()}日（${WEEKDAYS[c.getDay()]}）`);
    if (toKey(c) === todayKey()) {
      const badge = el('span', 'today-badge');
      badge.textContent = '今日';
      els.heading.append(badge);
    }
  } else if (state.view === 'week') {
    const start = startOfWeek(c);
    const end = addDays(start, 6);
    const endLabel = start.getMonth() === end.getMonth()
      ? `${end.getDate()}日`
      : `${end.getMonth() + 1}月${end.getDate()}日`;
    els.heading.append(`${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日〜${endLabel}`);
  } else {
    els.heading.append(`${c.getFullYear()}年${c.getMonth() + 1}月`);
  }
}

/* ----- day view ----- */

function renderDay() {
  const key = toKey(state.cursor);
  const tasks = tasksOn(key);
  const done = tasks.filter((t) => t.done).length;

  els.dayProgress.hidden = tasks.length === 0;
  els.barFill.style.width = tasks.length ? `${(done / tasks.length) * 100}%` : '0';
  els.barText.textContent = `${done}/${tasks.length} 完了`;
  els.celebrate.hidden = !(tasks.length > 0 && done === tasks.length);
  els.dayEmpty.hidden = tasks.length !== 0;

  els.dayList.textContent = '';
  for (const task of tasks) els.dayList.append(taskRow(task));
}

function checkButton(task) {
  const btn = el('button', 'check');
  btn.type = 'button';
  btn.setAttribute('role', 'checkbox');
  btn.setAttribute('aria-checked', String(task.done));
  btn.setAttribute('aria-label', task.done ? `「${task.title}」を未完了に戻す` : `「${task.title}」を完了にする`);
  btn.innerHTML = ICONS.check;
  if (task.id === state.justToggledId) btn.classList.add('pop');
  btn.addEventListener('click', () => toggleDone(task.id));
  return btn;
}

function taskRow(task) {
  const li = el('li', task.done ? 'task is-done' : 'task');
  if (task.id === state.justAddedId) li.classList.add('rise');
  li.append(checkButton(task));

  const title = el('span', 'task-title');
  title.textContent = task.title;
  li.append(title);

  if (task.minutes) {
    const chip = el('span', 'time-chip');
    chip.innerHTML = ICONS.clock;
    chip.append(` ${task.minutes}分`);
    li.append(chip);
    if (!task.done) {
      const start = el('button', 'start-btn');
      start.type = 'button';
      start.innerHTML = ICONS.play;
      start.append(' 開始');
      start.addEventListener('click', () => openTimer(task.id));
      li.append(start);
    }
  }

  const del = el('button', 'del-btn');
  del.type = 'button';
  del.setAttribute('aria-label', `「${task.title}」を削除`);
  del.innerHTML = ICONS.trash;
  del.addEventListener('click', () => removeTask(task.id));
  li.append(del);

  return li;
}

/* ----- week view ----- */

function renderWeek() {
  const start = startOfWeek(state.cursor);
  els.weekGrid.textContent = '';

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(start, i);
    const key = toKey(day);
    const isToday = key === todayKey();

    const col = el('div', isToday ? 'week-day is-today' : 'week-day');

    const head = el('button', 'week-day-head');
    head.type = 'button';
    head.setAttribute('aria-label', `${day.getMonth() + 1}月${day.getDate()}日をデイリー表示で開く`);
    const wd = el('span', `wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`.trim());
    wd.textContent = WEEKDAYS[i];
    const dnum = el('span', 'dnum');
    dnum.textContent = String(day.getDate());
    head.append(wd, dnum);
    head.addEventListener('click', () => {
      state.cursor = day;
      setView('day');
    });
    col.append(head);

    const list = el('ul', 'week-tasks');
    for (const task of tasksOn(key)) {
      const item = el('li', task.done ? 'week-task is-done' : 'week-task');
      item.append(checkButton(task));
      const title = el('span', 'w-title');
      title.textContent = task.title;
      title.title = task.title;
      item.append(title);
      list.append(item);
    }
    col.append(list);
    els.weekGrid.append(col);
  }
}

/* ----- month view ----- */

function renderMonth() {
  const c = state.cursor;
  const first = new Date(c.getFullYear(), c.getMonth(), 1);
  const gridStart = startOfWeek(first);
  els.monthGrid.textContent = '';

  for (let i = 0; i < 42; i += 1) {
    const day = addDays(gridStart, i);
    const key = toKey(day);
    const tasks = tasksOn(key);
    const done = tasks.filter((t) => t.done).length;
    const isOther = day.getMonth() !== c.getMonth();
    const isToday = key === todayKey();
    const isComplete = tasks.length > 0 && done === tasks.length;

    const cell = el('button', [
      'month-cell',
      isOther ? 'is-other' : '',
      isToday ? 'is-today' : '',
      isComplete && !isOther ? 'is-complete' : '',
    ].filter(Boolean).join(' '));
    cell.type = 'button';
    cell.setAttribute('aria-label', `${day.getMonth() + 1}月${day.getDate()}日（タスク${tasks.length}件・完了${done}件）をデイリー表示で開く`);

    const dnum = el('span', `dnum ${day.getDay() === 0 ? 'sun' : day.getDay() === 6 ? 'sat' : ''}`.trim());
    dnum.textContent = String(day.getDate());
    cell.append(dnum);

    if (tasks.length > 0) {
      const dots = el('span', 'cell-dots');
      for (const task of tasks.slice(0, MAX_MONTH_DOTS)) {
        dots.append(el('span', task.done ? 'dot done' : 'dot'));
      }
      if (tasks.length > MAX_MONTH_DOTS) {
        const more = el('span', 'dot-more');
        more.textContent = `+${tasks.length - MAX_MONTH_DOTS}`;
        dots.append(more);
      }
      cell.append(dots);
    }

    cell.addEventListener('click', () => {
      state.cursor = day;
      setView('day');
    });
    els.monthGrid.append(cell);
  }
}

/* ========== view switching & date navigation ========== */

function setView(view) {
  state.view = view;
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  renderAll();
}

function navigate(dir) { // dir: -1 | +1
  const c = state.cursor;
  if (state.view === 'day') state.cursor = addDays(c, dir);
  else if (state.view === 'week') state.cursor = addDays(c, dir * 7);
  else state.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
  renderAll();
}

document.querySelectorAll('.seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});
$('#nav-prev').addEventListener('click', () => navigate(-1));
$('#nav-next').addEventListener('click', () => navigate(1));
$('#nav-today').addEventListener('click', () => {
  state.cursor = new Date();
  renderAll();
});

/* ========== add form ========== */

els.addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = els.addTitle.value.trim();
  if (!title) {
    els.addTitle.classList.remove('shake');
    // restart the shake animation even on repeated empty submits
    void els.addTitle.offsetWidth;
    els.addTitle.classList.add('shake');
    els.addTitle.focus();
    return;
  }
  const rawMinutes = parseInt(els.addMinutes.value, 10);
  const minutes = Number.isInteger(rawMinutes) && rawMinutes >= 1 && rawMinutes <= 600 ? rawMinutes : null;
  addTask(title, minutes);
  els.addTitle.value = '';
  els.addMinutes.value = '';
  syncPresets();
  els.addTitle.focus();
});

els.timePresets.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-min]');
  if (!btn) return;
  els.addMinutes.value = btn.dataset.min;
  syncPresets();
});
els.addMinutes.addEventListener('input', syncPresets);

function syncPresets() {
  els.timePresets.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.min === els.addMinutes.value);
  });
}

/* ========== countdown timer ========== */

const timer = {
  taskId: null,
  totalMs: 0,
  remainingMs: 0,
  endAt: null,       // timestamp-based so background tabs stay accurate
  intervalId: null,
  finished: false,
};

let audioCtx = null;
function ensureAudio() { // must be called from a user gesture (autoplay policy)
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) {
    audioCtx = null;
  }
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
      osc.start(t);
      osc.stop(t + 1);
    });
  } catch (err) { /* sound is a garnish — never break the timer for it */ }
}

function formatMs(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function openTimer(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || !task.minutes) return;
  ensureAudio();
  timer.taskId = taskId;
  timer.totalMs = task.minutes * 60 * 1000;
  timer.remainingMs = timer.totalMs;
  timer.finished = false;
  els.timerTask.textContent = task.title;
  els.timerCard.classList.remove('is-finished');
  els.timerMsg.textContent = ' ';
  els.timerOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  resumeTimer();
}

function updateTimerDisplay() {
  const label = formatMs(timer.remainingMs);
  els.timerTime.textContent = label;
  const progress = timer.totalMs > 0 ? timer.remainingMs / timer.totalMs : 0;
  els.ringFg.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));
  document.title = `${label}｜${BASE_TITLE}`;
}

function resumeTimer() {
  timer.endAt = Date.now() + timer.remainingMs;
  clearInterval(timer.intervalId);
  timer.intervalId = setInterval(tickTimer, 200);
  els.timerToggle.innerHTML = ICONS.pause;
  els.timerToggle.setAttribute('aria-label', '一時停止');
  els.timerMsg.textContent = ' ';
  updateTimerDisplay();
}

function pauseTimer() {
  timer.remainingMs = Math.max(0, timer.endAt - Date.now());
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  els.timerToggle.innerHTML = ICONS.play;
  els.timerToggle.setAttribute('aria-label', '再開');
  els.timerMsg.textContent = '一時停止中';
  updateTimerDisplay();
}

function tickTimer() {
  timer.remainingMs = timer.endAt - Date.now();
  if (timer.remainingMs <= 0) {
    finishTimer();
    return;
  }
  updateTimerDisplay();
}

function finishTimer() {
  timer.remainingMs = 0;
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.finished = true;
  els.timerCard.classList.add('is-finished');
  els.timerMsg.textContent = '時間になりました。おつかれさま！';
  els.timerToggle.innerHTML = ICONS.play;
  els.timerToggle.setAttribute('aria-label', 'もう一度');
  updateTimerDisplay();
  chime();
}

function resetTimer() {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.remainingMs = timer.totalMs;
  timer.finished = false;
  els.timerCard.classList.remove('is-finished');
  els.timerToggle.innerHTML = ICONS.play;
  els.timerToggle.setAttribute('aria-label', '開始');
  els.timerMsg.textContent = 'リセットしました';
  updateTimerDisplay();
}

function closeTimer() {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.taskId = null;
  els.timerOverlay.hidden = true;
  document.body.style.overflow = '';
  document.title = BASE_TITLE;
}

els.timerToggle.addEventListener('click', () => {
  if (timer.finished) {
    resetTimer();
    resumeTimer();
  } else if (timer.intervalId) {
    pauseTimer();
  } else {
    resumeTimer();
  }
});
$('#timer-reset').addEventListener('click', resetTimer);
$('#timer-close').addEventListener('click', closeTimer);
$('#timer-done').addEventListener('click', () => {
  const task = state.tasks.find((t) => t.id === timer.taskId);
  closeTimer();
  if (task && !task.done) toggleDone(task.id);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.timerOverlay.hidden) closeTimer();
});

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

for (let i = 0; i < 7; i += 1) {
  const wd = el('span', i === 0 ? 'sun' : i === 6 ? 'sat' : '');
  wd.textContent = WEEKDAYS[i];
  els.monthWeekdays.append(wd);
}
renderAll();
