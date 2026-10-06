(function () {
  'use strict';
  const KEY = 'taskare-buddy-v1';
  const presets = [['moco', 'もこ', 'ミントの相棒'], ['stella', 'ステラ', '星の相棒'], ['poco', 'ぽこ', '灯りの相棒']];
  const faq = [
    ['予定を追加したい', 'カレンダーの「＋」から予定を追加できます。日時やメモを入力して保存してください。', '予定 カレンダー 追加 登録'],
    ['タイマーを使いたい', '「今日」のタスクにある再生ボタンからタイマーを開けます。所要時間なしのタスクでも時間を選んだり、カウントアップを使えます。', 'タイマー 時間 集中 計測'],
    ['日程候補のリンクを送りたい', 'メニューの「スケジュール調整」で空き時間を最大5つ選べます。「自動案内リンク」はGoogle追加連携が必要です。発行後は案内文とリンクをまとめてコピーできます。', '日程 調整 候補 リンク メール Gmail'],
    ['プロフィールを探したい', 'プロフィール帳の検索欄で名前やメモから探せます。お気に入りやグループも使えます。', 'プロフィール 人 検索 グループ お気に入り'],
    ['デザインを変えたい', '設定の「デザイン」から選べます。ライト・ダークの切替は画面上部から行えます。', '設定 デザイン 配色 テーマ ダーク ライト'],
    ['大切なことを見返したい', '「原点ノート」に、大切にする言葉と理由、やめたい行動や参考リンクを残せます。', '原点 ノート 言葉 習慣'],
    ['Buddyは何を見ている？', '会話に入力した内容とBuddyの名前・呼ばれ方・口調だけです。予定・日記・プロフィールや画像は自動で読みません。予定の操作やメール送信もしません。', '安全 個人情報 AI データ プライバシー'],
    ['少し元気がほしい', 'ここまでおつかれさま。今日は、ひとつできたことを思い出すだけでも十分。急がず、今できそうな小さな一歩からで大丈夫。', '元気 疲れ 応援 励まし'],
  ];
  const defaults = { enabled: false, avatar: 'moco', name: 'もこ', nickname: '', tone: 'gentle', motion: true, x: 0, y: 0.65, image: '' };
  const text = (tag, value, cls) => { const e = document.createElement(tag); if (value) e.textContent = value; if (cls) e.className = cls; return e; };
  const btn = (label, action, cls = 'cta ghost') => { const b = text('button', label, cls); b.type = 'button'; b.addEventListener('click', action); return b; };
  function load() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...defaults, enabled: p.enabled === true, avatar: presets.some(a => a[0] === p.avatar) || p.avatar === 'custom' ? p.avatar : 'moco',
        name: typeof p.name === 'string' ? p.name.slice(0, 24) : defaults.name, nickname: typeof p.nickname === 'string' ? p.nickname.slice(0, 24) : '',
        tone: ['gentle', 'cheerful', 'calm'].includes(p.tone) ? p.tone : 'gentle', motion: p.motion !== false,
        x: Number.isFinite(p.x) ? Math.max(0, Math.min(1, p.x)) : 0, y: Number.isFinite(p.y) ? Math.max(0, Math.min(1, p.y)) : 0.65,
        image: typeof p.image === 'string' && p.image.length < 400000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.image) ? p.image : '' };
    } catch { return { ...defaults }; }
  }
  function init(options) {
    if (['booking', 'meet', 'profwrite'].some(key => new URLSearchParams(location.search).has(key))) return;
    const container = document.getElementById('buddy-settings'); if (!container) return;
    let prefs = load(), history = [], uid = options.getUser()?.uid || null, consent = false, controller = null, serial = 0;
    let dragging = null, moved = false, tab = 'faq';
    const launcher = btn('', () => { if (!moved) open(); }, 'buddy-launcher');
    launcher.setAttribute('aria-haspopup', 'dialog');
    const avatar = text('img'); avatar.alt = ''; avatar.draggable = false; launcher.append(avatar);
    const dialog = text('dialog', '', 'buddy-dialog'); dialog.setAttribute('aria-labelledby', 'buddy-title');
    const header = text('header', '', 'buddy-header'), portrait = text('img'); portrait.alt = '';
    const heading = text('h2'); heading.id = 'buddy-title';
    const close = btn('閉じる', () => dialog.close()); close.setAttribute('aria-label', '閉じる'); close.title = '閉じる';
    const closeIcon = document.querySelector('#settings-back svg'); if (closeIcon) close.replaceChildren(closeIcon.cloneNode(true));
    header.append(portrait, heading, close); dialog.append(header);
    const tabs = text('div', '', 'buddy-tabs');
    const faqTab = btn('検索・よくある質問', () => showTab('faq'));
    const chatTab = btn('会話', () => showTab('chat')); tabs.append(faqTab, chatTab); dialog.append(tabs);
    const faqPane = text('section', '', 'buddy-faq');
    const search = document.createElement('input'); search.type = 'search'; search.placeholder = '使い方を検索'; search.setAttribute('aria-label', 'TaskAREの使い方を検索');
    const answers = text('div', '', 'buddy-answers'); faqPane.append(search, answers); dialog.append(faqPane);
    const chatPane = text('section', '', 'buddy-chat'); chatPane.hidden = true;
    const disclosure = text('p', '会話の入力と、この会話の履歴・名前・呼ばれ方・口調をCloudflareのAIへ送ります。日記や予定、画像は送りません。AIは間違うことがあります。', 'hint');
    const agreeLabel = text('label', '', 'buddy-check'), agree = document.createElement('input'); agree.type = 'checkbox';
    agreeLabel.append(agree, text('span', '内容を確認して、この会話の外部送信に同意する'));
    agree.addEventListener('change', () => { consent = agree.checked; if (!consent) cancel(); });
    const log = text('div', '', 'buddy-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-label', 'Buddyとの会話');
    const notice = text('p', '', 'hint'); notice.setAttribute('role', 'status');
    const form = document.createElement('form'), input = document.createElement('textarea'); input.rows = 3; input.maxLength = 1000; input.required = true;
    input.placeholder = '今日はこんな気分…'; input.setAttribute('aria-label', 'Buddyへのメッセージ');
    const send = text('button', '送信', 'cta'); send.type = 'submit';
    const clear = btn('会話を消去', () => { cancel(); history = []; log.replaceChildren(); input.value = ''; notice.textContent = '会話を消去しました'; });
    form.append(input, send, clear); chatPane.append(disclosure, agreeLabel, log, notice, form); dialog.append(chatPane);
    document.body.append(launcher, dialog);
    function source() { return prefs.avatar === 'custom' && prefs.image ? prefs.image : `assets/buddy-${prefs.avatar === 'custom' ? 'moco' : prefs.avatar}.png`; }
    function store(next) {
      try { localStorage.setItem(KEY, JSON.stringify(next)); prefs = next; settingNote.textContent = ''; refresh(); return true; }
      catch { settingNote.textContent = '端末に保存できません。保存容量やブラウザの設定をご確認ください。'; return false; }
    }
    function bounds() {
      const v = window.visualViewport;
      return { left: (v?.offsetLeft || 0) + 8, top: (v?.offsetTop || 0) + 80,
        width: Math.max(0, (v?.width || innerWidth) - 88), height: Math.max(0, (v?.height || innerHeight) - 280) };
    }
    function position() { const b = bounds(); launcher.style.left = `${b.left + b.width * prefs.x}px`; launcher.style.top = `${b.top + b.height * prefs.y}px`; }
    function refresh() {
      avatar.src = portrait.src = source(); heading.textContent = prefs.name.trim() || 'Buddy';
      launcher.setAttribute('aria-label', `${prefs.name.trim() || 'Buddy'}を開く`); launcher.title = 'ドラッグで移動・タップで開く';
      launcher.dataset.motion = String(prefs.motion); launcher.hidden = !prefs.enabled;
      if (!prefs.enabled && dialog.open) dialog.close(); position();
    }
    function identity() {
      const next = options.getUser()?.uid || null;
      if (uid !== next) { uid = next; cancel(); history = []; consent = false; agree.checked = false; log.replaceChildren(); input.value = ''; }
    }
    function cancel() { serial++; controller?.abort(); controller = null; send.disabled = false; }
    function showTab(value) {
      tab = value; faqPane.hidden = value !== 'faq'; chatPane.hidden = value !== 'chat';
      faqTab.setAttribute('aria-pressed', String(value === 'faq')); chatTab.setAttribute('aria-pressed', String(value === 'chat'));
      if (value === 'chat') notice.textContent = !options.apiUrl() ? 'AI会話は公開準備中です。検索・よくある質問は今すぐ使えます。' : '会話はこの画面を閉じると消えます。無料上限に達すると停止します。';
    }
    function open() { identity(); if (!dialog.open) { refresh(); dialog.showModal(); showTab(tab); } }
    dialog.addEventListener('close', () => { cancel(); history = []; log.replaceChildren(); input.value = ''; consent = false; agree.checked = false; launcher.focus(); });
    function renderFaq() {
      const q = search.value.normalize('NFKC').toLocaleLowerCase().trim(); answers.replaceChildren();
      const matches = faq.filter(row => row.join(' ').normalize('NFKC').toLocaleLowerCase().includes(q));
      for (const [title, answer] of matches) {
        const detail = document.createElement('details'); detail.append(text('summary', title), text('p', answer), text('small', 'TaskAREの用意した回答')); answers.append(detail);
      }
      if (!matches.length) answers.append(text('p', '見つかりませんでした。別の言葉で検索してみてください。'));
    }
    search.addEventListener('input', e => { if (!e.isComposing) renderFaq(); }); search.addEventListener('compositionend', renderFaq);
    function message(role, content) { const p = text('p', '', `buddy-message ${role}`); p.append(text('small', role === 'user' ? (prefs.nickname || 'あなた') : `${prefs.name || 'Buddy'}・AI回答`), text('span', content)); log.append(p); log.scrollTop = log.scrollHeight; }
    form.addEventListener('submit', async e => {
      e.preventDefault(); identity(); const content = input.value.trim(); if (!content || controller) return;
      if (!consent) { notice.textContent = '外部送信への同意が必要です。'; return; }
      const user = options.getUser(); if (!user) { notice.textContent = 'TaskAREにGoogleログインしてください。'; return; }
      let url;
      try { url = new URL(options.apiUrl()); if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error(); }
      catch { notice.textContent = 'AI会話は未接続です。検索・よくある質問をご利用ください。'; return; }
      const requestId = ++serial; controller = new AbortController(); const activeController = controller, signal = controller.signal;
      const timeout = setTimeout(() => activeController.abort(), 25000); send.disabled = true; notice.textContent = '考えています…';
      const messages = [...history, { role: 'user', content }].slice(-7);
      try {
        const token = await user.getIdToken(); identity(); if (requestId !== serial || signal.aborted) return;
        const response = await fetch(url.origin + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ messages, name: prefs.name, nickname: prefs.nickname, tone: prefs.tone, consent: true }), signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
        const data = await response.json(); identity(); if (requestId !== serial) return;
        if (!response.ok) throw new Error(response.status === 429 ? '無料の利用上限または送信間隔の制限です。時間をおいてお試しください。' : response.status === 401 || response.status === 403 ? '本人のGoogleログインを確認してください。' : 'AIを利用できません。検索・よくある質問は引き続き使えます。');
        if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('回答を受け取れませんでした。');
        history = [...messages, { role: 'assistant', content: data.reply.slice(0, 2000) }].slice(-8);
        message('user', content); message('assistant', data.reply.slice(0, 2000));
        while (log.children.length > 8) log.firstChild.remove();
        input.value = ''; notice.textContent = 'AI回答です。大事なことは確認してください。';
      } catch (err) { if (requestId === serial) notice.textContent = err.name === 'AbortError' ? '通信を停止しました。自動では再送しません。' : err.message; }
      finally { clearTimeout(timeout); if (requestId === serial) { controller = null; send.disabled = false; } }
    });
    launcher.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; moved = false; dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, left: launcher.offsetLeft, top: launcher.offsetTop };
      launcher.setPointerCapture(e.pointerId);
    });
    launcher.addEventListener('pointermove', e => {
      if (!dragging || dragging.id !== e.pointerId) return;
      const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y; if (Math.hypot(dx, dy) > 8) moved = true;
      if (!moved) return; const b = bounds();
      prefs.x = b.width ? Math.max(0, Math.min(1, (dragging.left + dx - b.left) / b.width)) : 0;
      prefs.y = b.height ? Math.max(0, Math.min(1, (dragging.top + dy - b.top) / b.height)) : 0; position();
    });
    launcher.addEventListener('pointerup', () => { if (dragging && moved) store({ ...prefs }); dragging = null; });
    launcher.addEventListener('pointercancel', () => { moved = true; dragging = null; });
    launcher.addEventListener('keydown', e => {
      if (e.key.startsWith('Arrow')) { e.preventDefault(); const n = { ...prefs }; if (e.key === 'ArrowLeft') n.x -= 0.05; if (e.key === 'ArrowRight') n.x += 0.05; if (e.key === 'ArrowUp') n.y -= 0.05; if (e.key === 'ArrowDown') n.y += 0.05;
        n.x = Math.max(0, Math.min(1, n.x)); n.y = Math.max(0, Math.min(1, n.y)); store(n);
      } else moved = false;
    });
    document.addEventListener('focusin', e => { if (!dialog.contains(e.target) && e.target.matches('input,textarea,[contenteditable="true"]')) launcher.style.visibility = 'hidden'; });
    document.addEventListener('focusout', () => { launcher.style.visibility = ''; });
    window.addEventListener('resize', position); window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancel(); if (dialog.open) dialog.close(); } });
    function field(label, type, value, handler) {
      const l = text('label', label, 'buddy-field'), i = document.createElement('input'); i.type = type;
      if (type === 'checkbox') { i.checked = value; l.classList.add('buddy-check'); } else { i.value = value; i.maxLength = 24; }
      i.addEventListener(type === 'checkbox' ? 'change' : 'input', () => handler(type === 'checkbox' ? i.checked : i.value)); l.append(i); container.append(l); return i;
    }
    field('Buddyを表示', 'checkbox', prefs.enabled, v => store({ ...prefs, enabled: v }));
    const choices = text('fieldset', '', 'buddy-presets'); choices.append(text('legend', '相棒を選ぶ'));
    for (const [id, name, caption] of presets) {
      const label = text('label'), radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'buddy-avatar'; radio.value = id; radio.checked = prefs.avatar === id;
      const img = text('img'); img.src = `assets/buddy-${id}.png`; img.alt = ''; label.append(radio, img, text('strong', name), text('small', caption));
      radio.addEventListener('change', () => store({ ...prefs, avatar: id })); choices.append(label);
    }
    container.append(choices);
    field('Buddyの名前', 'text', prefs.name, v => store({ ...prefs, name: v }));
    field('あなたの呼ばれ方', 'text', prefs.nickname, v => store({ ...prefs, nickname: v }));
    const toneLabel = text('label', '話し方', 'buddy-field'), tone = document.createElement('select');
    for (const [value, label] of [['gentle', 'やさしい'], ['cheerful', '元気'], ['calm', '落ち着いた']]) { const o = text('option', label); o.value = value; tone.append(o); }
    tone.value = prefs.tone; tone.addEventListener('change', () => store({ ...prefs, tone: tone.value })); toneLabel.append(tone); container.append(toneLabel);
    field('ゆっくり浮かぶ動き', 'checkbox', prefs.motion, v => store({ ...prefs, motion: v }));
    const uploadLabel = text('label', 'オリジナル画像（PNG / WebP・2MBまで）', 'buddy-field'), upload = document.createElement('input'); upload.type = 'file'; upload.accept = 'image/png,image/webp'; uploadLabel.append(upload); container.append(uploadLabel);
    const custom = btn('保存した画像を使う', () => { if (prefs.image && store({ ...prefs, avatar: 'custom' })) choices.querySelectorAll('input').forEach(r => { r.checked = false; }); });
    const removeImage = btn('オリジナル画像を削除', () => { if (store({ ...prefs, image: '', avatar: prefs.avatar === 'custom' ? 'moco' : prefs.avatar })) { custom.disabled = true; choices.querySelectorAll('input').forEach(r => { r.checked = r.value === prefs.avatar; }); } });
    custom.disabled = !prefs.image; container.append(custom, removeImage);
    const settingNote = text('p', '', 'hint'); settingNote.setAttribute('role', 'status'); container.append(settingNote);
    container.append(text('p', '設定と画像はこの端末のみ。会話は保存せず、閉じると消えます。', 'hint'));
    upload.addEventListener('change', async () => {
      const file = upload.files[0]; if (!file) return;
      try {
        if (!['image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('PNG / WebPの2MB以下の画像を選んでください。');
        const bitmap = await createImageBitmap(file);
        try {
          if (!bitmap.width || !bitmap.height || bitmap.width > 4096 || bitmap.height > 4096) throw new Error('画像は縦横4096px以下にしてください。');
          const canvas = document.createElement('canvas'); const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
          canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); const image = canvas.toDataURL('image/png');
          if (image.length >= 400000) throw new Error('画像を小さくして選び直してください。');
          if (store({ ...prefs, image, avatar: 'custom' })) { custom.disabled = false; choices.querySelectorAll('input').forEach(r => { r.checked = false; }); }
        } finally { bitmap.close(); }
      } catch (err) { settingNote.textContent = err.message || '画像を読み込めませんでした。'; }
      upload.value = '';
    });
    container.append(btn('位置を戻す', () => store({ ...prefs, x: 0, y: 0.65 })), btn('Buddyを開く', open));
    renderFaq(); refresh(); showTab('faq');
    return { identity };
  }
  window.TaskareBuddy = { init };
})();
