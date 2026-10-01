(function () {
  'use strict';
  const DEFAULT_TEMPLATE = '日程をご調整いただき、ありがとうございます。\n以下の内容で承りました。\n\n{{詳細}}\n\n当日はどうぞよろしくお願いいたします。';
  const messages = { setup_required: '自動案内サーバーは未設定です。', unauthorized: 'TaskAREにログインし直してください。',
    google_login_required: 'Googleアカウントでログインしてください。', connect_required: '設定から自動案内用のGoogle連携が必要です。',
    reconnect_required: 'Googleの追加連携をやり直してください。', invalid_email: 'メールアドレスを確認してください。',
    closed: 'この候補の受付は終了しました。', past_slot: '開始時刻を過ぎています。', limit_reached: '利用上限に達しました。時間をおいてお試しください。',
    storage_limit: '保存できるリンクの上限に達しました。', invalid_date: '候補は現在から30日以内の未来の日時を指定してください。',
    venue_required: '対面の会場が設定されていません。', slot_conflict: 'Googleカレンダーに重なる予定があります。主催者へご連絡ください。',
    delivery_unknown: 'メールの送信結果を確認できません。主催者の送信済みメールをご確認ください。', delivery_failed: 'メール送信に失敗しました。',
    not_found: 'リンクまたは回答控えが見つかりません。主催者へご連絡ください。', already_answered: '回答済みのため、リンクを取り消せません。',
    retry_limit: 'この予約の再試行上限に達しました。', invalid_input: '入力内容を確認してください。' };
  const statuses = { open: '受付中', processing: '確定処理中', confirmed: '予定登録済み', stopped: '要確認', cancelled: '受付取消', closed: '受付終了', expired: '期限切れ' };
  const mails = { sent: 'メール送信済み', unknown: '送信結果不明', sending: 'メール送信中', failed: 'メール未送信', not_sent: 'メール未送信' };
  const node = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
  const button = (text, fn) => { const b = node('button', text, 'cta ghost'); b.type = 'button'; b.addEventListener('click', fn); return b; };
  function baseUrl() {
    try { const u = new URL(window.TC_BOOKING_API_URL); return u.protocol === 'https:' && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash ? u.origin : ''; }
    catch { return ''; }
  }
  async function request(path, { user, data, method } = {}) {
    if (!baseUrl()) throw new Error(messages.setup_required);
    const headers = {};
    if (user) headers.Authorization = 'Bearer ' + await user.getIdToken();
    if (data !== undefined) headers['Content-Type'] = 'application/json';
    let res;
    try { res = await fetch(baseUrl() + path, { method: method || (data === undefined ? 'GET' : 'POST'), headers,
      body: data === undefined ? undefined : JSON.stringify(data), credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20000) }); }
    catch { throw new Error('通信結果を確認できません。再読み込みして状態をご確認ください。'); }
    const body = await res.json();
    if (!res.ok) throw new Error(messages[body.error] || '処理できませんでした。時間をおいて再確認してください。');
    return body;
  }
  const slotLine = s => `${s.key} ${String(Math.floor(s.startMin / 60)).padStart(2, '0')}:${String(s.startMin % 60).padStart(2, '0')}（${s.durMin}分・日本時間）`;
  function field(form, title, type, value, max) {
    const label = node('label', title, 'booking-field'); const input = node(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    input.value = value || ''; input.maxLength = max || 120; label.append(input); form.append(label); return input;
  }
  function link(parent, title, url, allowed) {
    try { const u = new URL(url); if (u.protocol !== 'https:' || !allowed.includes(u.hostname)) return;
      const a = node('a', title, 'cta ghost'); a.href = u.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.append(a);
    } catch { /* Invalid remote URLs are not rendered. */ }
  }
  function statusBlock(parent, offer) {
    parent.append(node('p', statuses[offer.status] || '要確認', 'booking-status'));
    if (offer.picked) parent.append(node('p', slotLine(offer.picked)));
    if (offer.mail) parent.append(node('p', mails[offer.mail] || 'メール未送信'));
    if (offer.error) parent.append(node('p', messages[offer.error] || '処理が止まっています。主催者による確認が必要です。', 'hint'));
    if (offer.meetLink) link(parent, 'Google Meetを開く', offer.meetLink, ['meet.google.com']);
    if (offer.calendarLink) link(parent, 'Googleカレンダーに追加', offer.calendarLink, ['calendar.google.com']);
  }
  async function guest(code) {
    document.body.classList.add('booking-guest');
    const scrim = node('div', '', 'meet-scrim booking-scrim'); const card = node('section', '', 'meet-card booking-card');
    card.append(node('h1', '日程のご回答', 'meet-title')); const body = node('div', '読み込み中…', 'meet-body'); card.append(body); scrim.append(card); document.body.append(scrim);
    if (!/^[a-f0-9]{48}$/.test(code)) { body.textContent = messages.not_found; return; }
    const key = 'taskare-booking-receipt:' + code;
    let receipt;
    try {
      receipt = sessionStorage.getItem(key);
      if (!receipt) { receipt = [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join(''); sessionStorage.setItem(key, receipt); }
    } catch { body.textContent = '回答控えの保存ができません。ブラウザの保存設定をご確認ください。'; return; }
    const showResult = async () => {
      const result = await request(`/public/offers/${code}/receipt`, { data: { receipt } });
      body.replaceChildren(); statusBlock(body, result);
      body.append(button('状態を更新', () => showResult().catch(e => { notice.textContent = e.message; })));
      const notice = node('p', '', 'hint'); body.append(notice);
    };
    try {
      const offer = await request('/public/offers/' + code); body.replaceChildren();
      if (offer.status !== 'open') { await showResult(); return; }
      body.append(node('h2', offer.title), node('p', offer.owner ? `${offer.owner}さんとの予定` : '予定のご回答'));
      const form = node('form', '', 'booking-form');
      const dates = node('fieldset'); dates.append(node('legend', '日時'));
      offer.slots.forEach((s, index) => {
        if (s.unavailable) return;
        const l = node('label', '', 'booking-choice'); const radio = node('input'); radio.type = 'radio'; radio.name = 'slot'; radio.value = String(index); radio.required = true;
        l.append(radio, node('span', slotLine(s))); dates.append(l);
      }); form.append(dates);
      if (offer.slots.every(s => s.unavailable)) { body.append(node('p', '現在選べる候補がありません。主催者へご連絡ください。')); return; }
      const name = field(form, 'お名前', 'text', '', 80); name.required = true; name.autocomplete = 'name';
      const email = field(form, '案内を受け取るメールアドレス', 'email', '', 254); email.required = true; email.autocomplete = 'email';
      const modes = node('fieldset'); modes.append(node('legend', '参加形式'));
      [['online', 'オンライン（Google Meet）'], ...(offer.venue ? [['inperson', '対面：' + offer.venue]] : [])].forEach(([value, title]) => {
        const label = node('label', '', 'booking-choice'); const r = node('input'); r.type = 'radio'; r.name = 'mode'; r.value = value; r.required = true;
        label.append(r, node('span', title)); modes.append(label);
      }); form.append(modes);
      const remarks = field(form, '備考・ご希望の会議URL（任意）', 'textarea', '', 2000); remarks.rows = 4;
      const consent = node('label', '', 'booking-choice'); const accept = node('input'); accept.type = 'checkbox'; accept.required = true;
      consent.append(accept, node('span', '入力内容を主催者へ送り、日程の案内メールを受け取る')); form.append(consent);
      const send = node('button', 'この内容で回答する', 'cta'); send.type = 'submit'; form.append(send);
      const notice = node('p', '', 'hint'); notice.setAttribute('role', 'status'); form.append(notice);
      form.addEventListener('submit', async e => {
        e.preventDefault(); if (!form.reportValidity()) return; send.disabled = true; notice.textContent = '受付中…';
        try {
          await request(`/public/offers/${code}/answer`, { data: { receipt, slot: Number(new FormData(form).get('slot')), mode: new FormData(form).get('mode'), name: name.value, email: email.value, remarks: remarks.value } });
          await showResult();
        } catch (err) { notice.textContent = err.message; send.disabled = false; }
      }); body.append(form);
    } catch (e) { body.textContent = e.message; }
  }
  function settings(container, options) {
    container.replaceChildren();
    const template = field(container, '日程確定メールの本文', 'textarea', options.template || DEFAULT_TEMPLATE, 2000); template.rows = 6;
    template.addEventListener('input', () => options.saveTemplate(template.value));
    container.append(button('本文を初期状態に戻す', () => { template.value = DEFAULT_TEMPLATE; options.saveTemplate(DEFAULT_TEMPLATE); }));
    const state = node('p', baseUrl() ? '連携状態は未確認です' : '自動案内サーバー：未設定', 'hint'); state.setAttribute('role', 'status'); container.append(state);
    const actions = node('div', '', 'booking-actions'); container.append(actions);
    const run = fn => async () => { try { await fn(); } catch (e) { state.textContent = e.message; } };
    const user = () => { const u = options.getUser(); if (!u) throw new Error('TaskAREへのGoogleログインが必要です。'); return u; };
    if (!baseUrl()) return;
    actions.append(button('連携状態を確認', run(async () => { const s = await request('/owner/status', { user: user() }); state.textContent = s.connected ? '送信元：' + s.email : 'Google追加連携：未設定'; })));
    actions.append(button('Google追加連携', run(async () => {
      if (!confirm('日程案内のため、Googleカレンダーへの登録とGmail送信を許可する画面へ移動します。Googleログインと同じアカウントを選んでください。')) return;
      const r = await request('/owner/connect', { user: user(), data: {} }); const u = new URL(r.url);
      if (u.origin !== 'https://accounts.google.com') throw new Error('認可URLを確認できません。'); location.assign(u.href);
    })));
    actions.append(button('自動案内の連携を解除', run(async () => {
      if (!confirm('自動案内用の認可情報をサーバーから削除します。処理待ちの案内は停止します。')) return;
      await request('/owner/disconnect', { user: user(), data: {} }); state.textContent = '自動案内の連携を解除しました';
    })));
    const results = node('div', '', 'booking-results');
    const refresh = async () => {
      const r = await request('/owner/offers', { user: user() }); await options.importOffers(r.offers); results.replaceChildren();
      for (const o of r.offers.slice().reverse()) {
        const row = node('article', '', 'booking-result'); row.append(node('h3', o.title)); statusBlock(row, o);
        row.append(button('共有リンクをコピー', run(async () => {
          const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('booking', o.code);
          await navigator.clipboard.writeText(url.href); state.textContent = '共有リンクをコピーしました';
        })));
        if (o.status === 'open') row.append(button('受付を取り消す', run(async () => { if (!confirm('このリンクの受付を取り消しますか？')) return;
          await request(`/owner/offers/${o.code}/cancel`, { user: user(), data: {} }); await refresh(); })));
        if (['stopped', 'confirmed'].includes(o.status) && o.mail !== 'sent') row.append(button('確認して再試行', run(async () => {
          if (!confirm('先にGmailの送信済みメールを確認してください。送信結果不明の場合は重複して届く可能性があります。再試行しますか？')) return;
          await request(`/owner/offers/${o.code}/retry`, { user: user(), data: { confirm: true } }); await refresh();
        })));
        results.append(row);
      }
      if (!r.offers.length) results.append(node('p', '発行済みの自動案内リンクはありません。', 'hint'));
    };
    actions.append(button('送信結果を更新', run(refresh))); container.append(results);
  }
  async function createDialog(options) {
    if (!baseUrl()) throw new Error(messages.setup_required);
    if (!options.user) throw new Error('TaskAREへのGoogleログインが必要です。');
    const status = await request('/owner/status', { user: options.user }); if (!status.connected) throw new Error(messages.connect_required);
    const dialog = node('dialog', '', 'booking-dialog'); const form = node('form', '', 'booking-form');
    form.append(node('h2', '自動案内リンク'));
    const title = field(form, '予定の名前', 'text', '打ち合わせ', 120); title.required = true;
    const venue = field(form, '対面の会場（未入力ならオンラインのみ）', 'text', '', 300);
    form.append(node('p', '送信元：' + status.email, 'hint'));
    const send = node('button', 'リンクを作成', 'cta'); send.type = 'submit'; form.append(send);
    const note = node('p', '', 'hint'); note.setAttribute('role', 'status'); form.append(note);
    form.append(button('閉じる', () => { dialog.close(); dialog.remove(); })); dialog.append(form); document.body.append(dialog); dialog.showModal();
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (!form.reportValidity()) return; send.disabled = true;
      try {
        const o = await request('/owner/offers', { user: options.user, data: { title: title.value, venue: venue.value, owner: options.owner,
          template: options.template || DEFAULT_TEMPLATE, slots: options.slots } });
        const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('booking', o.code);
        options.created({ ...o, url: u.href });
        form.replaceChildren(node('h2', 'リンクを作成しました'));
        const output = field(form, '共有URL', 'url', u.href, 2000); output.readOnly = true;
        form.append(button('リンクをコピー', async () => { try { await navigator.clipboard.writeText(u.href); } catch { output.select(); } }));
        form.append(button('閉じる', () => { dialog.close(); dialog.remove(); }));
      } catch (e2) { note.textContent = e2.message; send.disabled = false; }
    });
  }
  window.TaskareBooking = { configured: () => !!baseUrl(), request, settings, createDialog, DEFAULT_TEMPLATE };
  const code = new URLSearchParams(location.search).get('booking'); if (code) guest(code);
})();
