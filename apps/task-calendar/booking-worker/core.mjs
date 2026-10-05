export const DAY = 86400000;
export const LIMITS = Object.freeze({ records: 50, creates: 10, sends: 10, attempts: 6, resends: 3 });
export const DEFAULT_TEMPLATE = '日程をご調整いただき、ありがとうございます。\n以下の内容で承りました。\n\n{{詳細}}\n\n当日はどうぞよろしくお願いいたします。';
export class BookingError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
export function check(value, code = 'invalid_input', status = 400) { if (!value) throw new BookingError(code, status); }
export const randomToken = () => [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join('');
export const tokenValid = value => typeof value === 'string' && /^[a-f0-9]{48}$/.test(value);
export async function hash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function string(value, max, required = true) {
  check(typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value));
  const result = value.trim(); check(!required || result.length); return result;
}
export function email(value) {
  const result = string(value, 254);
  check(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(result), 'invalid_email');
  check(!result.includes('..'), 'invalid_email'); return result;
}
export function slotTime(slot) { return Date.parse(`${slot.key}T00:00:00+09:00`) + slot.startMin * 60000; }
export function validateOffer(data, now = Date.now()) {
  check(data && Array.isArray(data.slots) && data.slots.length > 0 && data.slots.length <= 5);
  const slots = data.slots.map(s => {
    check(s && /^\d{4}-\d{2}-\d{2}$/.test(s.key) && Number.isInteger(s.startMin) && s.startMin >= 0
      && Number.isInteger(s.durMin) && s.durMin >= 15 && s.durMin <= 180 && s.startMin + s.durMin <= 1440);
    const midnight = Date.parse(`${s.key}T00:00:00Z`);
    check(Number.isFinite(midnight) && new Date(midnight).toISOString().slice(0, 10) === s.key);
    const slot = { key: s.key, startMin: s.startMin, durMin: s.durMin };
    check(slotTime(slot) > now && slotTime(slot) <= now + 30 * DAY, 'invalid_date'); return slot;
  });
  check(new Set(slots.map(s => `${s.key}:${s.startMin}`)).size === slots.length);
  return { title: string(data.title, 120), owner: string(data.owner || '', 80, false),
    venue: string(data.venue || '', 300, false), template: string(data.template || DEFAULT_TEMPLATE, 2000), slots };
}
export function validateAnswer(data, offer, now = Date.now()) {
  check(offer.status === 'open' && offer.expiresAt > now, 'closed', 409);
  check(Number.isInteger(data.slot) && offer.slots[data.slot], 'invalid_slot');
  check(!(offer.blockedSlots || []).includes(data.slot), 'slot_conflict', 409);
  const picked = offer.slots[data.slot];
  check(slotTime(picked) > now, 'past_slot', 409);
  check(['online', 'inperson'].includes(data.mode));
  check(data.mode !== 'inperson' || offer.venue, 'venue_required');
  check(tokenValid(data.receipt), 'invalid_receipt');
  return { picked, mode: data.mode, email: email(data.email), name: string(data.name, 80), remarks: string(data.remarks || '', 2000, false) };
}
export function dateTimes(slot) {
  const start = new Date(slotTime(slot));
  return { start: start.toISOString(), end: new Date(+start + slot.durMin * 60000).toISOString() };
}
export function description(offer) {
  return `形式: ${offer.answer.mode === 'online' ? 'オンライン' : '対面'}\n`
    + (offer.answer.mode === 'inperson' ? `会場: ${offer.venue}\n` : '')
    + `お名前: ${offer.answer.name}\n\n先方からの備考:\n${offer.answer.remarks || 'なし'}`;
}
export function eventBody(offer) {
  const times = dateTimes(offer.answer.picked);
  return { id: 't' + offer.code, summary: offer.title, description: description(offer),
    start: { dateTime: times.start, timeZone: 'Asia/Tokyo' }, end: { dateTime: times.end, timeZone: 'Asia/Tokyo' },
    location: offer.answer.mode === 'inperson' ? offer.venue : '',
    extendedProperties: { private: { taskareBooking: offer.code } },
    ...(offer.answer.mode === 'online' ? { conferenceData: { createRequest: { requestId: offer.code, conferenceSolutionKey: { type: 'hangoutsMeet' } } } } : {}) };
}
export function calendarLink(offer) {
  const times = dateTimes(offer.answer.picked);
  const compact = date => date.replace(/[-:]/g, '').replace('.000', '');
  const p = new URLSearchParams({ action: 'TEMPLATE', text: offer.title, dates: `${compact(times.start)}/${compact(times.end)}`,
    ctz: 'Asia/Tokyo', details: description(offer) + (offer.meetLink ? `\n\nTaskARE発行のGoogle Meet:\n${offer.meetLink}` : ''),
    location: offer.answer.mode === 'online' ? offer.meetLink || '' : offer.venue });
  return `https://calendar.google.com/calendar/render?${p}`;
}
export function mailText(offer) {
  const s = offer.answer.picked;
  const time = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const details = `予定: ${offer.title}\n日時: ${s.key} ${time(s.startMin)}〜${time(s.startMin + s.durMin)}（日本時間）\n${description(offer)}`
    + (offer.meetLink ? `\n\nTaskARE発行のGoogle Meet:\n${offer.meetLink}` : '')
    + `\n\nGoogleカレンダーに追加:\n${calendarLink(offer)}`;
  const template = offer.template || DEFAULT_TEMPLATE;
  return `${offer.answer.name} 様\n\n` + (template.includes('{{詳細}}') ? template.replace('{{詳細}}', () => details) : `${template}\n\n${details}`);
}
function base64(value) { return btoa(String.fromCharCode(...new TextEncoder().encode(value))); }
export function rawMail(offer, sender) {
  const lines = [`From: ${email(sender)}`, `To: ${email(offer.answer.email)}`,
    `Subject: =?UTF-8?B?${base64('日程確定のご案内') }?=`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64', '', base64(mailText(offer)).match(/.{1,76}/g).join('\r\n')];
  return base64(lines.join('\r\n')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function publicOffer(o, now = Date.now()) {
  return { code: o.code, title: o.title, owner: o.owner, venue: o.venue,
    slots: o.slots.map((s, i) => ({ ...s, unavailable: (o.blockedSlots || []).includes(i) || slotTime(s) <= now })),
    expiresAt: o.expiresAt, status: o.status === 'open' && o.expiresAt <= now ? 'expired' : o.status === 'open' ? 'open' : 'closed' };
}
export function receiptOffer(o) {
  return { code: o.code, title: o.title, status: o.status, mail: o.mail || 'not_sent', error: o.error || '',
    picked: o.answer?.picked, mode: o.answer?.mode, meetLink: o.meetLink || '', venue: o.venue,
    calendarLink: o.eventId ? calendarLink(o) : '' };
}
