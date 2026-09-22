'use strict';

function safeNoteURL(raw) {
  try { const url = new URL(raw); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function appendNoteLinks(container, text) {
  const pattern = /\[([^\]\n]{1,160})\]\((https?:\/\/[^\s<>]+)\)|https?:\/\/[^\s<>「」『』【】]+/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    container.append(document.createTextNode(text.slice(start, match.index)));
    const raw = match[2] || match[0].replace(/[。、，．！？!?,.;）)]+$/, '');
    const href = safeNoteURL(raw);
    if (href) {
      const a = document.createElement('a'); a.href = href; a.textContent = match[1] || raw;
      a.target = '_blank'; a.rel = 'noopener noreferrer'; container.append(a);
      if (!match[2]) container.append(document.createTextNode(match[0].slice(raw.length)));
    } else container.append(document.createTextNode(match[0]));
    start = match.index + match[0].length;
  }
  container.append(document.createTextNode(text.slice(start)));
}
function insertDayLogLink(textarea) {
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  const { body, close } = openUtilityDialog('リンクを挿入');
  const fields = {};
  for (const [id, labelText, type] of [['label', '表示する名前（任意）', 'text'], ['url', 'リンク先URL', 'url']]) {
    const label = el('label', 'f-label', labelText), input = document.createElement('input');
    input.id = `daylog-link-${id}`; input.type = type; input.maxLength = id === 'url' ? 1500 : 160;
    label.htmlFor = input.id; body.append(label, input); fields[id] = input;
  }
  fields.label.value = textarea.value.slice(start, end).slice(0, 160);
  const error = el('p', 'hint'); error.setAttribute('role', 'alert'); body.append(error);
  const add = el('button', 'cta', '挿入'); add.type = 'button';
  add.onclick = () => {
    const url = safeNoteURL(fields.url.value.trim());
    if (!url) { error.textContent = 'http:// または https:// で始まるURLを入力してください。'; return; }
    const label = fields.label.value.trim().replace(/[\[\]\n]/g, ' ');
    const value = label ? `[${label}](${url.replace(/\)/g, '%29')})` : url;
    if (textarea.value.length - (end - start) + value.length > textarea.maxLength) { error.textContent = '文字数の上限を超えています。'; return; }
    textarea.setRangeText(value, start, end, 'end'); textarea.dispatchEvent(new Event('input', { bubbles: true }));
    close(); textarea.focus();
  };
  body.append(add);
}
function recordHighlights(records) {
  const groups = [
    { label: 'よろこびの言葉', words: ['嬉しかった', 'うれしかった', '楽しかった', '最高だった', '嬉しい', 'うれしい', '楽しい'] },
    { label: '思い出を振り返る言葉', words: ['懐かしい', 'なつかしい', '思い出した'] },
    { label: '気づきの言葉', words: ['気づいた', '気付いた', '学んだ', '振り返った'] },
    { label: '自分を見つめる言葉', words: ['自己理解', '自分らしさ', '大切にしたい', '自分と向き合'] },
    { label: '感謝の言葉', words: ['ありがとう', 'ありがたかった', '感謝している'] },
    { label: 'ひと息つく言葉', words: ['休んだ', 'ゆっくりした', 'ほっとした'] },
  ];
  return groups.map((group) => {
    const matching = records.filter((record) => group.words.some((word) => record.text.includes(word)));
    const days = new Set(matching.map((record) => record.date));
    const example = matching.at(-1);
    return { ...group, count: days.size, example };
  }).filter((group) => group.count).sort((a, b) => b.count - a.count).slice(0, 3);
}
function renderRecordHighlights(container, keys) {
  const records = [];
  for (const date of keys) {
    if (date > todayKey()) continue;
    const add = (text, source) => { if (typeof text === 'string' && text.trim()) records.push({ text: text.trim(), source, date }); };
    add(db.dayLogs[date], dayLogName()); add(db.notes[date], 'メモ');
    for (const it of itemsFor(date)) {
      if (isSharedCal(it.ref.calendarId) || it.kind === 'gcal') continue;
      // Recurring base memos are templates, not a record written on every day.
      const diary = it.ref.repeat ? it.ref.diaryDates?.[date] : diaryFor(it);
      const memo = it.ref.repeat ? it.ref.memoDates?.[date] : memoFor(it);
      add(diary, it.title); add(memo, it.title);
    }
  }
  const section = el('section', 'record-highlights');
  section.append(el('h3', '', '記録のハイライト'));
  section.append(el('p', 'hint', '端末内の言葉を集計しています。生成AIや気持ちの判定ではありません。'));
  const groups = recordHighlights(records);
  if (!groups.length) section.append(el('p', 'hint', records.length ? 'この期間には対象の言葉が見つかりませんでした。記録はそのまま読み返せます。' : 'この期間のメモや日記がまだありません。'));
  for (const group of groups) {
    const entry = el('article', 'record-highlight');
    entry.append(el('h4', '', `${group.label} · ${group.count}日`));
    const example = group.example;
    const index = Math.min(...group.words.map((word) => example.text.indexOf(word)).filter((i) => i >= 0));
    const start = Math.max(0, index - 35);
    const excerpt = (start ? '…' : '') + example.text.slice(start, start + 140) + (example.text.length > start + 140 ? '…' : '');
    entry.append(el('blockquote', '', excerpt));
    const link = el('button', 'record-source', `${example.date} · ${example.source}`); link.type = 'button';
    link.onclick = () => { ui.selectedKey = example.date; ui.view = 'day'; ui.cursor = fromKey(example.date); setScreen('cal'); };
    entry.append(link); section.append(entry);
  }
  container.append(section);
}
