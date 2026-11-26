// ============================================================
// نسخ مجانية للأفكار 29 و7 و30:
//  29) ترجمة لعدة لغات على الجهاز نفسه (Translator API في Chrome): مجانية وخاصة، والنص ما بيتبعتش لأي خدمة.
//  7)  رسم تلقائي للقصة: مشهد SVG بيتولّد على الجهاز من كلمات القصة (مفيش ذكاء اصطناعي مدفوع).
//  30) تذكير يومي بقصة اليوم: إشعار المتصفح لما الموقع مفتوح + ملف تقويم (.ics) بيفكّرك حتى والموقع مقفول.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX;
  const esc = HX.escapeHtml;
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  // ---------- 29) ترجمة على الجهاز ----------
  const LANGS = [['en', 'English'], ['ar', 'العربية'], ['fr', 'Français'], ['de', 'Deutsch'], ['es', 'Español'], ['it', 'Italiano'], ['pt', 'Português'], ['tr', 'Türkçe'], ['ru', 'Русский'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['hi', 'हिन्दी'], ['id', 'Bahasa Indonesia'], ['nl', 'Nederlands'], ['pl', 'Polski']];
  const supported = () => !!window.Translator && ['object', 'function'].includes(typeof window.Translator);
  const SPEECH = {zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', hi: 'hi-IN', en: 'en-US', ar: 'ar-EG'};
  let lastResult = null;
  function openTranslate(s) {
    if (!s) return;
    const from = s.lang || 'ar';
    HX.dialog('hxTr', 'ترجمة القصة على جهازك', `<p class="voice-note" style="margin-top:0">الترجمة بتحصل جوه المتصفح ومفيش نص بيتبعت لأي سيرفر ولا بتكلّف حاجة.</p>
      <div class="hx-field"><label for="hxTrLang">ترجم إلى</label><select id="hxTrLang">${LANGS.filter(([c]) => c !== from).map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></div>
      <div class="hx-row"><button class="button primary" id="hxTrGo" type="button">🌐 ترجم</button></div>
      <p class="hx-feedback" id="hxTrMsg" role="status">${supported() ? '' : 'الترجمة على الجهاز محتاجة Chrome أو Edge حديث على الكمبيوتر (إصدار ١٣٨ فما فوق). الترجمة السحابية لـ٦ لغات موجودة في قائمة اللغة داخل القصة.'}</p>
      <div id="hxTrOut" hidden><textarea id="hxTrText" class="hx-link" rows="8" aria-label="النص المترجم" readonly></textarea><div class="hx-row"><button class="button secondary" id="hxTrSay" type="button">🔊 اسمع</button><button class="button secondary" id="hxTrSave" type="button">➕ احفظها كقصة</button></div></div>`);
    HX.open('hxTr');
  }
  document.addEventListener('click', async e => {
    const s = window.hikmaReader?.story;
    if (e.target.closest('#hxTrGo') && s) {
      const msg = document.getElementById('hxTrMsg'), to = document.getElementById('hxTrLang').value, from = s.lang || 'ar';
      if (!supported()) { msg.textContent = 'المتصفح ده مش بيدعم الترجمة على الجهاز. جرّب Chrome على الكمبيوتر.'; return; }
      try {
        const avail = await Translator.availability({sourceLanguage: from, targetLanguage: to});
        if (avail === 'unavailable') { msg.textContent = 'الزوج ده من اللغات مش متاح على جهازك.'; return; }
        msg.textContent = avail === 'available' ? 'بترجم...' : 'بنحمّل نموذج اللغة لأول مرة (مرة واحدة)...';
        const tr = await Translator.create({sourceLanguage: from, targetLanguage: to});
        const out = await tr.translate(s.text.slice(0, 6000));
        lastResult = {to, text: out, title: s.title};
        document.getElementById('hxTrText').value = out; document.getElementById('hxTrText').dir = ['ar', 'ur', 'he', 'fa'].includes(to) ? 'rtl' : 'ltr';
        document.getElementById('hxTrOut').hidden = false; msg.textContent = 'تمت الترجمة.';
      } catch (err) { msg.textContent = 'الترجمة فشلت على جهازك: ' + (err?.message || 'جرّب لغة تانية'); }
    }
    if (e.target.closest('#hxTrSay') && lastResult) HX.speak(lastResult.text, {lang: lastResult.to === 'ar' ? 'ar' : 'en', rate: 0.9});
    if (e.target.closest('#hxTrSave') && lastResult) {
      HX.addStory({title: `${lastResult.title} (${lastResult.to})`, text: lastResult.text, lang: lastResult.to === 'ar' ? 'ar' : 'en', icon: '🌐'});
      HX.close('hxTr'); HX.toast('اتضافت للمكتبة');
    }
  });
  HX.addReaderTool({id: 'tr', icon: '🌐', label: 'ترجمة', order: 43, onClick: openTranslate});

  // ---------- 7) رسم تلقائي ----------
  const KW = [
    ['night', /ليل|ليلة|نجم|قمر|night|star|moon|dark|sleep|نوم/i, 'ليل'], ['sun', /شمس|صباح|نهار|sun|morning|day|دافئ/i, 'شمس'],
    ['tree', /شجر|غاب|بستان|حديقة|tree|forest|garden|wood/i, 'شجرة'], ['water', /نهر|بحر|ماء|مطر|river|sea|water|rain|lake|نيل/i, 'ماء'],
    ['house', /بيت|منزل|مدرسة|مدينة|house|home|school|city|town/i, 'بيت'], ['owl', /بومة|حكمة|owl|hikma/i, 'بومة'],
    ['rabbit', /أرنب|ارنب|rabbit|hare|bunny/i, 'أرنب'], ['book', /كتاب|قرأ|قراءة|book|read|مكتبة/i, 'كتاب'], ['mountain', /جبل|mountain|hill|صحراء|desert/i, 'جبل']
  ];
  function scene(text, title) {
    const t = title + ' ' + text, has = k => KW.find(x => x[0] === k)[1].test(t);
    const night = has('night') && !has('sun'), h = hash(t), r = n => ((h >> n) & 255) / 255;
    const sky = night ? ['#1d2a5c', '#3d4f9b'] : ['#bfe3f2', '#fdf1c9'], ground = night ? '#1f4a43' : '#5c9a6a', ground2 = night ? '#173a35' : '#437a54';
    const parts = [`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="640" height="400" fill="url(#sk)"/>`];
    const names = [];
    if (night) { names.push('ليل'); for (let i = 0; i < 18; i++) parts.push(`<circle cx="${(hash(t + i) % 600) + 20}" cy="${(hash(t + 'y' + i) % 170) + 15}" r="${1 + (i % 3)}" fill="#fff6c8"/>`); parts.push('<circle cx="540" cy="70" r="30" fill="#fff3b0"/><circle cx="528" cy="62" r="26" fill="#2c3a78"/>'); }
    else if (has('sun') || !has('night')) { names.push('شمس'); parts.push('<circle cx="540" cy="75" r="38" fill="#ffd45e"/><circle cx="540" cy="75" r="52" fill="#ffd45e" opacity=".25"/>'); }
    if (has('mountain')) { names.push('جبل'); parts.push(`<path d="M0 270 L120 130 L220 250 L330 110 L470 270 Z" fill="${night ? '#2d3b6e' : '#9cb7a6'}"/>`); }
    parts.push(`<path d="M0 290 Q160 ${250 + r(3) * 30} 320 285 T640 270 V400 H0Z" fill="${ground}"/><path d="M0 335 Q200 ${305 + r(5) * 25} 400 335 T640 325 V400 H0Z" fill="${ground2}"/>`);
    if (has('water')) { names.push('ماء'); parts.push(`<path d="M0 350 Q80 335 160 350 T320 350 T480 350 T640 350 V400 H0Z" fill="${night ? '#27407a' : '#6bb7d8'}" opacity=".9"/>`); }
    if (has('tree')) { names.push('شجرة'); const x = 90 + r(1) * 60; parts.push(`<rect x="${x}" y="215" width="22" height="95" rx="6" fill="#7a5233"/><circle cx="${x + 11}" cy="195" r="58" fill="${night ? '#2b6b57' : '#4aa36a'}"/><circle cx="${x - 25}" cy="225" r="38" fill="${night ? '#245a49' : '#3f9060'}"/><circle cx="${x + 46}" cy="225" r="38" fill="${night ? '#245a49' : '#3f9060'}"/>`); }
    if (has('house')) { names.push('بيت'); parts.push('<rect x="420" y="235" width="110" height="80" fill="#f2d9b4"/><path d="M410 238 L475 185 L540 238Z" fill="#b5533c"/><rect x="458" y="268" width="28" height="47" fill="#7a5233"/><rect x="494" y="255" width="22" height="22" fill="#fff6c8"/>'); }
    if (has('rabbit')) { names.push('أرنب'); parts.push('<g transform="translate(330 290)"><ellipse cx="0" cy="20" rx="30" ry="24" fill="#f4efe6"/><circle cx="26" cy="2" r="17" fill="#f4efe6"/><ellipse cx="22" cy="-30" rx="6" ry="20" fill="#f4efe6"/><ellipse cx="36" cy="-28" rx="6" ry="20" fill="#f4efe6" transform="rotate(8 36 -28)"/><circle cx="32" cy="0" r="2.4" fill="#222"/></g>'); }
    if (has('owl') || names.length < 3) { names.push('البومة حكمة'); parts.push('<g transform="translate(250 205)"><ellipse cx="0" cy="40" rx="40" ry="48" fill="#a8743f"/><ellipse cx="0" cy="48" rx="26" ry="32" fill="#f2dfbc"/><circle cx="-14" cy="22" r="14" fill="#fff"/><circle cx="14" cy="22" r="14" fill="#fff"/><circle cx="-14" cy="23" r="6" fill="#222"/><circle cx="14" cy="23" r="6" fill="#222"/><path d="M-6 32 L0 42 L6 32Z" fill="#e8a33c"/><path d="M-44 -2 L0 -16 L44 -2 L0 6Z" fill="#2c3e50"/><rect x="-4" y="-22" width="8" height="8" fill="#2c3e50"/></g>'); }
    if (has('book')) { names.push('كتاب'); parts.push('<g transform="translate(385 318)"><path d="M0 0 L36 -8 L36 28 L0 36Z" fill="#2f7d6d"/><path d="M72 0 L36 -8 L36 28 L72 36Z" fill="#3a9482"/></g>'); }
    return {svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400">${parts.join('')}</svg>`, alt: 'رسم توضيحي للقصة فيه: ' + [...new Set(names)].join('، ')};
  }
  async function toPng(svg) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const c = document.createElement('canvas'); c.width = 640; c.height = 400; c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  }
  async function autoDraw(s) {
    if (!s) return;
    const {svg, alt} = scene(s.text, s.title);
    try {
      (HX.X.art || (HX.X.art = {}))[s.id] = {src: await toPng(svg), alt, auto: true};
      HX.save(); HX.emit('barmounted', {bar: document.querySelector('#readerContent .hx-bar')});
      HX.toast('اترسمت صورة للقصة');
    } catch { HX.toast('الرسم التلقائي مش مدعوم هنا'); }
  }
  HX.scene = scene;
  HX.addReaderTool({id: 'draw', icon: '✨', label: 'ارسم لي القصة', order: 44, onClick: autoDraw});

  // ---------- 30) تذكير يومي ----------
  const rem = () => HX.prefs.reminder || (HX.prefs.reminder = {on: false, time: '18:00', last: ''});
  function dayStory() { const list = state.stories; return list.length ? list[Math.floor(Date.now() / 86400000) % list.length] : null; }
  function notify() {
    const r = rem(), s = dayStory();
    r.last = HX.today(); HX.save();
    const title = 'حكمة: قصة النهاردة', body = s ? `"${s.title}" مستنياك. اقرأها دلوقتي.` : 'وقت القراءة اليومي.';
    HX.toast('🔔 ' + body);
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker?.getRegistration?.().then(reg => reg?.showNotification ? reg.showNotification(title, {body, tag: 'hikma-daily', icon: '/icon.svg'}) : new Notification(title, {body})).catch(() => { try { new Notification(title, {body}); } catch { /* غير متاح */ } });
    }
  }
  function checkReminder() {
    const r = rem(); if (!r.on || r.last === HX.today()) return;
    const [h, m] = (r.time || '18:00').split(':').map(Number), now = new Date();
    if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) notify();
  }
  setInterval(checkReminder, 30000); setTimeout(checkReminder, 3000);
  function ics() {
    const [h, m] = rem().time.split(':'), d = new Date(), p = n => String(n).padStart(2, '0');
    const start = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${h}${m}00`;
    const url = location.origin + '/';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hikma//Reminder//AR', 'BEGIN:VEVENT', `UID:hikma-daily-${start}@hikma`, `DTSTAMP:${start}`, `DTSTART:${start}`, 'DURATION:PT15M', 'RRULE:FREQ=DAILY', 'SUMMARY:وقت القراءة مع حكمة', `DESCRIPTION:افتح حكمة واقرأ قصة النهاردة: ${url}`, `URL:${url}`, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:وقت القراءة مع حكمة', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function openReminder() {
    const r = rem();
    HX.dialog('hxRem', 'تذكير يومي بقصة اليوم', `<p class="voice-note" style="margin-top:0">الإشعار بيظهر لما الموقع يكون مفتوح في الوقت ده. لو عايز تذكير حتى والموقع مقفول، نزّل ملف التقويم وافتحه على موبايلك.</p>
      <div class="hx-switches"><label class="hx-switch"><input type="checkbox" id="hxRemOn" ${r.on ? 'checked' : ''}><span><strong>فعّل التذكير</strong><em id="hxRemState">${'Notification' in window ? 'الإذن: ' + ({granted: 'مسموح', denied: 'مرفوض من المتصفح', default: 'لسه هيتطلب'}[Notification.permission]) : 'المتصفح مفيهوش إشعارات، هنعرض تنبيه جوه الموقع.'}</em></span></label></div>
      <div class="hx-field"><label for="hxRemTime">الوقت</label><input id="hxRemTime" type="time" value="${esc(r.time)}"></div>
      <div class="hx-row"><button class="button secondary" id="hxRemTest" type="button">🔔 جرّب الإشعار</button><button class="button secondary" id="hxRemIcs" type="button">📅 نزّل تذكير للتقويم</button></div>`);
    HX.open('hxRem');
  }
  document.addEventListener('change', async e => {
    if (e.target.id === 'hxRemOn') {
      rem().on = e.target.checked;
      if (e.target.checked && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch { /* تجاهل */ } }
      HX.save(); const st = document.getElementById('hxRemState'); if (st && 'Notification' in window) st.textContent = 'الإذن: ' + ({granted: 'مسموح', denied: 'مرفوض من المتصفح', default: 'لسه هيتطلب'}[Notification.permission]);
    } else if (e.target.id === 'hxRemTime') { rem().time = e.target.value || '18:00'; rem().last = ''; HX.save(); }
  });
  document.addEventListener('click', e => {
    if (e.target.closest('#hxRemTest')) notify();
    if (e.target.closest('#hxRemIcs')) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics()], {type: 'text/calendar'})); a.download = 'hikma-daily.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  });
  HX.features.push({id: 'reminder', icon: '🔔', name: 'تذكير يومي', sub: 'قصة النهاردة', order: 58, open: openReminder});
})();

// ---------- شاشة الدخول: صورة البومة بدل الإيموجي (مقترح، بينتظر موافقة صاحب المشروع) ----------
(() => {
  const swap = () => {
    document.querySelectorAll('.onboarding .gate-brand > span:not([data-hx-owl])').forEach(sp => {
      if (sp.textContent.trim() !== '🦉') return;
      sp.dataset.hxOwl = '1';
      sp.innerHTML = '<img class="hx-gate-owl" src="assets/mascots/hikma.webp" alt="" width="56" height="56" decoding="async">';
    });
  };
  new MutationObserver(swap).observe(document.body, {childList: true, subtree: true});
  swap();
})();
