'use strict';

// Civil dates are UTC-based to avoid daylight-saving and device timezone shifts.
(() => {
  const offsets = [7, 5, 3, 2, 1, 0];
  const holidays = {
    newyear: ['元日', 1, 1], adult: ['成人の日', 1, 2, 1],
    foundation: ['建国記念の日', 2, 11], emperor: ['天皇誕生日', 2, 23],
    showa: ['昭和の日', 4, 29], constitution: ['憲法記念日', 5, 3],
    greenery: ['みどりの日', 5, 4], children: ['こどもの日', 5, 5],
    marine: ['海の日', 7, 3, 1], mountain: ['山の日', 8, 11],
    respect: ['敬老の日', 9, 3, 1], sports: ['スポーツの日', 10, 2, 1],
    culture: ['文化の日', 11, 3], labor: ['勤労感謝の日', 11, 23],
  };
  const key = (date) => date.toISOString().slice(0, 10);
  function parse(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(+date) && key(date) === value ? date : null;
  }
  const add = (value, days) => key(new Date(+parse(value) + days * 86400000));
  function holiday(id, year) {
    const h = Object.hasOwn(holidays, id) ? holidays[id] : null;
    if (!h) return null;
    let day = h[2];
    if (h.length === 4) day = 1 + (h[3] - new Date(Date.UTC(year, h[1] - 1, 1)).getUTCDay() + 7) % 7 + (h[2] - 1) * 7;
    return key(new Date(Date.UTC(year, h[1] - 1, day)));
  }
  function occurs(a, value) {
    if (!parse(value)) return false;
    if (a.holiday) return holiday(a.holiday, Number(value.slice(0, 4))) === value;
    if (!parse(a.date)) return false;
    const rep = a.repeat || (a.yearly === false ? 'once' : 'yearly');
    return rep === 'monthly' ? a.date.slice(8) === value.slice(8)
      : rep === 'yearly' ? a.date.slice(5) === value.slice(5) : a.date === value;
  }
  function next(a, today) {
    if (!parse(today) || (a.holiday ? !Object.hasOwn(holidays, a.holiday) : !parse(a.date))) return null;
    if (!a.holiday && (a.repeat === 'once' || a.yearly === false && !a.repeat)) return parse(a.date) ? a.date : null;
    for (let i = 0; i <= 2922; i++) { const date = add(today, i); if (occurs(a, date)) return date; }
    return null;
  }
  function due(entries, today) {
    if (!parse(today)) return [];
    return entries.flatMap((a) => offsets.filter((n) => Array.isArray(a.reminders) && a.reminders.includes(n) && occurs(a, add(today, n)))
      .map((days) => ({ id: a.id, title: a.title, days, date: add(today, days) })));
  }
  globalThis.TaskareReminders = { offsets, holidays, parse, add, holiday, occurs, next, due };
})();
