// ============================================================
// مزايا الموقع: اقرأ لي الصفحة، جرّب القلم، وضع مكفوف مع ديمو صوتي، أوضاع (طفل/مكفوف/طالب/مدرسة)،
// تحذير الصوت، نص بديل، اختصارات، بحث، سرعة القراءة، تقييم، مراجع الطلاب، صفحة المشروع.
// كله بصوت الجهاز (speechSynthesis) ومحلي: مفيش حصة ولا خدمة مدفوعة.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX;
  const P = () => HX.prefs;
  const esc = HX.escapeHtml;
  const root = document.documentElement;
  const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
  const isOpen = id => document.getElementById(id)?.classList.contains('open');

  // ---------- نطق بصوت الجهاز مع كشف الصوت المكتوم ----------
  let lastSpeakStart = 0;
  function speak(text, {lang = 'ar', rate = 0.95, onend, queue = false} = {}) {
    if (!canSpeak) { warnSound('no-tts'); return false; }
    if (!queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
    u.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    u.rate = rate;
    let started = false;
    u.onstart = () => { started = true; lastSpeakStart = Date.now(); };
    u.onend = () => { if (onend) onend(); };
    speechSynthesis.speak(u);
    setTimeout(() => { if (!started && speechSynthesis.speaking === false && !speechSynthesis.pending) warnSound('silent'); }, 3500);
    return true;
  }
  HX.speak = speak;
  let warned = 0;
  function warnSound(kind) {
    if (Date.now() - warned < 30000) return;
    warned = Date.now();
    const msg = kind === 'no-tts' ? '🔇 المتصفح ده مفيهوش صوت قراءة. جرّب Chrome أو Edge، أو استخدم الصوت السحابي.' : '🔇 مفيش صوت طالع. اتأكد إن الصوت مش مكتوم وإن مستوى الصوت مرفوع.';
    HX.toast(msg);
    const live = document.getElementById('hxLive'); if (live) live.textContent = msg;
  }
  // تنبيه لو الجهاز مفيهوش أصوات بعد التحميل
  if (canSpeak) setTimeout(() => { if (!speechSynthesis.getVoices().length && P().soundWarn !== false) { /* الأصوات بتتحمل متأخر على بعض الأجهزة */ setTimeout(() => { if (!speechSynthesis.getVoices().length) root.dataset.noVoices = 'true'; }, 2500); } }, 500);
  // لو اتضغط تشغيل والمستوى صفر
  document.addEventListener('click', e => {
    if (!e.target.closest('#playPause')) return;
    const vol = window.hikmaReader?.settings?.volume ?? null;
    if (vol === 0) warnSound('silent');
    else setTimeout(() => { if (isOpen('readerOverlay') && canSpeak && !speechSynthesis.speaking && !document.querySelector('audio')?.currentTime && root.dataset.noVoices === 'true') warnSound('no-tts'); }, 2500);
  }, true);

  // ---------- زر عائم: اقرأ لي الصفحة ----------
  const fab = document.createElement('button');
  fab.id = 'hxReadPage'; fab.type = 'button'; fab.className = 'hx-fab';
  fab.innerHTML = '<span aria-hidden="true">🔊</span><b>اقرأ لي الصفحة</b>';
  fab.setAttribute('aria-label', 'اقرأ لي الصفحة');
  document.body.appendChild(fab);
  const live = document.createElement('div'); live.id = 'hxLive'; live.className = 'hx-sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
  function pageText() {
    const open = [...document.querySelectorAll('.overlay.open')];
    const scope = open.length ? open[open.length - 1] : document.querySelector('.shell') || document.body;
    const clone = scope.cloneNode(true);
    clone.querySelectorAll('script,style,svg,[hidden],[aria-hidden="true"],.hx-sr,.mascot,canvas,audio').forEach(n => n.remove());
    const parts = [];
    clone.querySelectorAll('h1,h2,h3,p,li,label,button,[role=button],figcaption,.card-title').forEach(n => {
      const t = (n.getAttribute('aria-label') || n.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && t.length < 400 && !parts.includes(t)) parts.push(t);
    });
    return parts.join('. ');
  }
  let reading = false;
  function stopReadPage() { reading = false; fab.classList.remove('on'); fab.querySelector('b').textContent = 'اقرأ لي الصفحة'; if (canSpeak) speechSynthesis.cancel(); }
  function readPage() {
    if (reading) { stopReadPage(); return; }
    const t = pageText();
    if (!t) { HX.toast('مفيش نص أقرأه هنا'); return; }
    reading = true; fab.classList.add('on'); fab.querySelector('b').textContent = 'إيقاف القراءة';
    const chunks = t.match(/[^.؟!]{1,220}[.؟!]?/g) || [t];
    let i = 0;
    const next = () => { if (!reading || i >= chunks.length) { stopReadPage(); return; } speak(chunks[i++], {onend: next, queue: false}); };
    next();
  }
  fab.addEventListener('click', readPage);
  document.addEventListener('keydown', e => { if (e.altKey && (e.key === 'r' || e.key === 'ر')) { e.preventDefault(); readPage(); } });

  // ---------- نص بديل لكل صورة وشخصية ----------
  const ALT = [[/owl|بومة|hikma/i, 'البومة حكمة بقبعة التخرج'], [/cat|قطة/i, 'قطة الفضاء'], [/bot|robot|روبوت/i, 'الروبوت الودود'], [/doraemon|دورايمون/i, 'دورايمون'], [/mickey|الأرنب|rabbit/i, 'الأرنب الأبيض'], [/zelda/i, 'شخصية زيلدا'], [/anbu|uchiha|naruto/i, 'شخصية أنمي']];
  function fixAlt() {
    document.querySelectorAll('img:not([alt])').forEach(img => {
      const hint = (img.src + ' ' + img.className + ' ' + (img.title || '')).toString();
      const hit = ALT.find(([re]) => re.test(hint));
      img.alt = hit ? hit[1] : (img.closest('figure')?.querySelector('figcaption')?.textContent || 'صورة توضيحية');
    });
    document.querySelectorAll('svg:not([aria-hidden]):not([role])').forEach(s => { if (!s.querySelector('title')) s.setAttribute('aria-hidden', 'true'); });
    document.querySelectorAll('.mascot, [class*="mascot"], .reader-owl, .owl').forEach(m => {
      if (!m.getAttribute('role') && !m.getAttribute('aria-hidden') && !m.getAttribute('aria-label') && !m.textContent.trim()) { m.setAttribute('role', 'img'); m.setAttribute('aria-label', 'البومة حكمة، مرافقة القراءة'); }
    });
  }
  new MutationObserver(() => { clearTimeout(fixAlt.t); fixAlt.t = setTimeout(fixAlt, 200); }).observe(document.body, {childList: true, subtree: true});
  fixAlt();

  // ---------- أوضاع الاستخدام ----------
  const MODES = {
    default: {name: 'عادي', icon: '🙂', sub: 'الشكل الافتراضي', prefs: {contrast: 'off', announce: false, autoRead: false, autoStory: false}},
    child: {name: 'طفل ٤-٨', icon: '🧒', sub: 'حروف أكبر وألوان مرحة', prefs: {dyslexia: false, contrast: 'off', announce: false, autoRead: false}},
    blind: {name: 'مكفوف', icon: '🦯', sub: 'صوت كامل وكيبورد وتباين', prefs: {announce: true, contrast: 'light', autoRead: true}},
    student: {name: 'طالب', icon: '🎓', sub: 'هادي وحروف أصغر وملاحظات', prefs: {contrast: 'off', announce: false, autoRead: false}},
    school: {name: 'مدرسة', icon: '🏫', sub: 'عرض كبير للفصل', prefs: {contrast: 'off', autoRead: false}}
  };
  function applyMode(initial) {
    const m = P().mode || 'default';
    root.dataset.hxMode = m;
    root.dataset.hxGray = P().gray ? 'on' : 'off';
    if (!initial) HX.applyAccess?.();
  }
  function chooseMode(id) {
    P().mode = id; Object.assign(P(), MODES[id].prefs); HX.save(); applyMode();
    HX.toast('وضع ' + MODES[id].name + ' شغّال');
    if (id === 'blind') { P().autoRead = true; HX.save(); setTimeout(() => voiceTour(), 400); }
    document.getElementById('hxLive').textContent = 'تم اختيار وضع ' + MODES[id].name;
  }
  function openModes() {
    const cur = P().mode || 'default';
    HX.dialog('hxModes', 'اختار طريقة الاستخدام', `<p class="voice-note" style="margin-top:0">كل وضع بيغيّر شكل الموقع وإعداداته كلها مرة واحدة. تقدر ترجع لـ«عادي» أي وقت.</p>
      <div class="hx-grid">${Object.entries(MODES).map(([id, m]) => `<button class="hx-tile" data-hx-mode="${id}" type="button" aria-pressed="${id === cur}"><span class="hx-tile-ico" aria-hidden="true">${m.icon}</span><span class="hx-tile-name">${m.name}</span><span class="hx-tile-sub">${m.sub}</span></button>`).join('')}</div>
      <div class="hx-switches" style="margin-top:12px"><label class="hx-switch"><input type="checkbox" id="hxGray" ${P().gray ? 'checked' : ''}><span><strong>أبيض وأسود</strong><em>بنفس شخصيات حكمة لكن بدون ألوان. مريح لكبار السن.</em></span></label>
      <label class="hx-switch"><input type="checkbox" id="hxAutoRead" ${P().autoRead ? 'checked' : ''}><span><strong>اقرأ كل نافذة أول ما تتفتح</strong><em>بيقرأ العنوان والمحتوى تلقائيا. تقدر توقفه من هنا.</em></span></label>
      <label class="hx-switch"><input type="checkbox" id="hxAutoStories" ${P().autoStory ? 'checked' : ''}><span><strong>ابدأ القصة بالقراءة تلقائيا</strong><em>أول ما تفتح قصة، القراءة تبدأ لوحدها.</em></span></label></div>`);
    HX.open('hxModes');
  }
  document.addEventListener('click', e => { const t = e.target.closest('button[data-hx-mode]'); if (t) { chooseMode(t.dataset.hxMode); openModes(); } });
  document.addEventListener('change', e => {
    if (e.target.id === 'hxGray') { P().gray = e.target.checked; HX.save(); applyMode(); }
    else if (e.target.id === 'hxAutoRead') { P().autoRead = e.target.checked; HX.save(); }
    else if (e.target.id === 'hxAutoStories') { P().autoStory = e.target.checked; HX.save(); }
  });
  HX.features.push({id: 'modes', icon: '🧭', name: 'طريقة الاستخدام', sub: 'طفل، مكفوف، طالب، مدرسة', order: 1, open: openModes});

  // قراءة تلقائية للنوافذ لما تتفتح (اختياري)
  const seen = new WeakSet();
  new MutationObserver(muts => {
    if (!P().autoRead) return;
    for (const m of muts) {
      const el = m.target;
      if (!(el instanceof HTMLElement) || !el.classList.contains('overlay') || !el.classList.contains('open') || seen.has(el) && el.dataset.hxRead === el.id + el.querySelector('h2')?.textContent) continue;
      if (el.id === 'readerOverlay') continue;
      seen.add(el); el.dataset.hxRead = el.id + el.querySelector('h2')?.textContent;
      setTimeout(() => { reading = false; readPage(); }, 350);
    }
  }).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class']});
  HX.on('barmounted', () => { if (P().autoStory) setTimeout(() => document.querySelector('#playPause')?.click(), 600); });

  // ---------- ديمو صوتي للمكفوف: تعليمات كاملة في البداية ----------
  const TOUR = [
    'أهلا بيك في حكمة. أنا هشرحلك الموقع بالصوت.',
    'الموقع كله بيشتغل بالكيبورد. زر Tab بينقلك بين الأزرار، وEnter بيفتح الزر.',
    'اضغط Alt مع R في أي وقت وأنا أقرأ لك الصفحة. وفيه زر عائم تحت اسمه اقرأ لي الصفحة.',
    'في المكتبة، كل قصة ليها زر اقرأ القصة. افتح قصة وبعدها المسافة بتشغل وتوقف، والأسهم بتنقلك بين الجمل.',
    'زر علامة الاستفهام بيقرأ لك كل الاختصارات. وزر حكمة بلس فيه كل الأدوات.',
    'لو عايز تسمع الشرح تاني، افتح حكمة بلس واختار طريقة الاستخدام. بالتوفيق.'
  ];
  let touring = false;
  function voiceTour() {
    if (touring) { touring = false; speechSynthesis.cancel(); return; }
    touring = true; let i = 0;
    const next = () => { if (!touring || i >= TOUR.length) { touring = false; return; } speak(TOUR[i++], {onend: next}); };
    next();
  }
  HX.features.push({id: 'voicetour', icon: '🗣️', name: 'ديمو صوتي', sub: 'شرح كامل بالصوت', order: 2, open: voiceTour});

  // ---------- اختصارات الكيبورد ----------
  const KEYS = [['Space', 'تشغيل / إيقاف القراءة'], ['← →', 'الجملة السابقة / التالية'], ['+ / -', 'زيادة / تقليل السرعة'], ['R', 'إعادة الجملة الحالية'], ['Alt + R', 'قراءة الصفحة كلها'], ['?', 'عرض الاختصارات'], ['Esc', 'إغلاق النافذة'], ['Tab', 'التنقل بين الأزرار']];
  function openKeys() {
    HX.dialog('hxKeys', 'اختصارات الكيبورد', `<table class="hx-keys"><caption class="hx-sr">قائمة اختصارات لوحة المفاتيح</caption><tbody>${KEYS.map(([k, d]) => `<tr><th scope="row"><kbd>${esc(k)}</kbd></th><td>${esc(d)}</td></tr>`).join('')}</tbody></table><div class="hx-row"><button class="button secondary" id="hxKeysPrint" type="button">🖨️ اطبع صفحة الاختصارات</button></div>`);
    HX.open('hxKeys');
  }
  document.addEventListener('click', e => { if (e.target.closest('#hxKeysPrint')) { document.body.classList.add('hx-print-keys'); window.print(); setTimeout(() => document.body.classList.remove('hx-print-keys'), 500); } });
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select,[contenteditable=true]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '?' || e.key === '؟') { e.preventDefault(); openKeys(); return; }
    if (!isOpen('readerOverlay')) return;
    if (e.key === '+' || e.key === '=' || e.key === '-') {
      const r = document.getElementById('readerRate');
      if (!r) return;
      const step = Number(r.step) || 0.1, v = Math.max(Number(r.min) || 0.5, Math.min(Number(r.max) || 2, Number(r.value) + (e.key === '-' ? -step : step)));
      r.value = String(Math.round(v * 100) / 100); r.dispatchEvent(new Event('input', {bubbles: true})); r.dispatchEvent(new Event('change', {bubbles: true}));
      HX.toast('السرعة ' + r.value + 'x');
    } else if (e.key === 'r' || e.key === 'R' || e.key === 'ر') { HX.setIndex(HX.lineIndex()); document.querySelector('#playPause')?.click(); }
  });
  HX.features.push({id: 'keys', icon: '⌨️', name: 'اختصارات الكيبورد', sub: 'صفحة واحدة تقدر تطبعها', order: 6, open: openKeys});
})();
