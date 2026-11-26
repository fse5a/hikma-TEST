// ============================================================
// جرّب القلم، اختبار سرعة القراءة، بحث، تقييم، مراجع الطلاب، لعبة "أي كلمة سمعت؟"، صفحة المشروع
// ============================================================
(() => {
  'use strict';
  const HX = window.HX;
  const esc = HX.escapeHtml;
  const P = () => HX.prefs;
  const norm = s => HX.strip(String(s || '')).toLowerCase();
  const wordsOf = t => HX.tokens(t);

  // ---------- جرّب القلم بنفسك: اسحب على الكلمة فتنطق ----------
  const SAMPLE = 'القلم الذكي بيقرأ أي كتاب ورقي بصوت عالٍ. حرّك القلم على الكلمة وهي تتنطق، وتتلوّن وهي بتتقرأ.';
  let penLast = null, penTimer = null;
  function openPen() {
    const html = SAMPLE.split(/(\s+)/).map(w => /\S/.test(w) ? `<span class="hx-pen-w" tabindex="0" role="button" data-w="${esc(w)}">${esc(w)}</span>` : w).join('');
    HX.dialog('hxPen', 'جرّب القلم بنفسك', `<p class="voice-note" style="margin-top:0">القلم الحقيقي بيتحرك على الكتاب. هنا حرّك الماوس أو صباعك على الكلمة وهتسمعها. بالكيبورد: Tab بين الكلمات وEnter للنطق.</p>
      <div class="hx-pen-page" id="hxPenPage" lang="ar" dir="rtl">${html}</div>
      <div class="hx-row"><button class="button primary" id="hxPenAll" type="button">▶️ اقرأ الفقرة كلها</button><label class="hx-field-inline">النص بتاعك <input id="hxPenText" type="text" placeholder="اكتب جملة وجرّب القلم عليها" aria-label="اكتب جملة للتجربة"></label></div>`);
    HX.open('hxPen');
  }
  function penSay(el) {
    if (!el || el === penLast) return;
    penLast = el;
    document.querySelectorAll('.hx-pen-w.on').forEach(x => x.classList.remove('on'));
    el.classList.add('on');
    clearTimeout(penTimer);
    penTimer = setTimeout(() => HX.speak(el.dataset.w, {rate: 0.9}), 90);
  }
  document.addEventListener('pointermove', e => {
    if (!document.getElementById('hxPen')?.classList.contains('open')) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.hx-pen-w');
    if (el) penSay(el); else penLast = null;
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('hx-pen-w')) { e.preventDefault(); penLast = null; penSay(e.target); } });
  document.addEventListener('focusin', e => { if (e.target.classList?.contains('hx-pen-w') && P().announce) penSay(e.target); });
  document.addEventListener('click', e => {
    if (e.target.closest('#hxPenAll')) { const ws = [...document.querySelectorAll('.hx-pen-w')]; let i = 0; const next = () => { document.querySelectorAll('.hx-pen-w.on').forEach(x => x.classList.remove('on')); if (i >= ws.length) return; ws[i].classList.add('on'); HX.speak(ws[i++].dataset.w, {onend: next}); }; next(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id !== 'hxPenText') return;
    const t = e.target.value.trim().slice(0, 300);
    document.getElementById('hxPenPage').innerHTML = (t || SAMPLE).split(/(\s+)/).map(w => /\S/.test(w) ? `<span class="hx-pen-w" tabindex="0" role="button" data-w="${esc(w)}">${esc(w)}</span>` : w).join('');
  });
  HX.features.push({id: 'pen', icon: '🖊️', name: 'جرّب القلم', sub: 'حرّك على الكلمة تتنطق', order: 0, open: openPen});

  // ---------- اختبار سرعة القراءة (كلمة في الدقيقة) ----------
  const WPM_TEXT = 'في صباح هادئ خرج الأطفال إلى الحديقة. كان الهواء نظيفا والشمس دافئة. جلست سلمى تحت الشجرة وقرأت كتابا عن النجوم. تعلمت أن الشمس نجمة كبيرة، وأن القمر يدور حول الأرض كل شهر. ثم أغلقت الكتاب وابتسمت لأنها عرفت شيئا جديدا.';
  let wpmStart = 0;
  function openWpm() {
    const hist = (HX.profile.wpm || []).slice(-5);
    HX.dialog('hxWpm', 'سرعة القراءة', `<p class="voice-note" style="margin-top:0">اضغط «ابدأ»، اقرأ الفقرة بصوتك العادي بصمت، واضغط «خلصت». هنحسب كام كلمة في الدقيقة.</p>
      <div class="hx-pen-page hx-wpm" id="hxWpmText" hidden dir="rtl">${esc(WPM_TEXT)}</div>
      <p id="hxWpmRes" class="hx-feedback" role="status"></p>
      <div class="hx-row"><button class="button primary" id="hxWpmGo" type="button">ابدأ</button><button class="button secondary" id="hxWpmStop" type="button" hidden>خلصت</button></div>
      ${hist.length ? `<h3 class="hx-h3">آخر مرات</h3><ul class="hx-cards">${hist.map(h => `<li>${esc(h.day)}: <b>${h.wpm}</b> كلمة/دقيقة</li>`).join('')}</ul>` : ''}`);
    HX.open('hxWpm');
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#hxWpmGo')) { wpmStart = Date.now(); document.getElementById('hxWpmText').hidden = false; document.getElementById('hxWpmStop').hidden = false; e.target.closest('#hxWpmGo').hidden = true; document.getElementById('hxWpmRes').textContent = ''; }
    if (e.target.closest('#hxWpmStop')) {
      const sec = Math.max(3, (Date.now() - wpmStart) / 1000), n = wordsOf(WPM_TEXT).length, wpm = Math.round(n / sec * 60);
      (HX.profile.wpm = HX.profile.wpm || []).push({day: HX.today(), wpm}); HX.save();
      document.getElementById('hxWpmRes').textContent = `قرأت ${n} كلمة في ${Math.round(sec)} ثانية: ${wpm} كلمة في الدقيقة.`;
      document.getElementById('hxWpmStop').hidden = true; document.getElementById('hxWpmGo').hidden = false; document.getElementById('hxWpmGo').textContent = 'جرّب تاني';
    }
  });
  HX.features.push({id: 'wpm', icon: '⏱️', name: 'سرعة القراءة', sub: 'كلمة في الدقيقة', order: 55, open: openWpm});

  // ---------- بحث داخل القصص ----------
  function openSearch() {
    HX.dialog('hxSearch', 'ابحث في القصص', `<label class="hx-field"><span>كلمة أو جزء من جملة</span><input id="hxSearchQ" type="search" autocomplete="off" aria-label="ابحث في القصص" placeholder="مثلا: أرنب"></label><ul class="hx-cards" id="hxSearchRes" role="list" aria-live="polite"></ul>`);
    HX.open('hxSearch'); setTimeout(() => document.getElementById('hxSearchQ')?.focus(), 100);
  }
  document.addEventListener('input', e => {
    if (e.target.id !== 'hxSearchQ') return;
    const q = norm(e.target.value);
    const out = document.getElementById('hxSearchRes');
    if (q.length < 2) { out.innerHTML = ''; return; }
    const hits = state.stories.map(s => { const t = norm(s.text), i = t.indexOf(q); return (norm(s.title).includes(q) || i >= 0) ? {s, snippet: i >= 0 ? s.text.slice(Math.max(0, i - 25), i + 55) : ''} : null; }).filter(Boolean).slice(0, 12);
    out.innerHTML = hits.length ? hits.map(h => `<li><button class="hx-card-btn" data-hx-open-story="${esc(h.s.id)}" type="button"><strong>${esc(h.s.title)}</strong><span>${esc(h.snippet)}…</span></button></li>`).join('') : '<li class="hx-muted">مفيش نتائج.</li>';
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hx-open-story]');
    if (!b) return;
    HX.close('hxSearch'); document.querySelector(`[data-open="${CSS.escape(b.dataset.hxOpenStory)}"]`)?.click();
  });
  HX.features.push({id: 'search', icon: '🔎', name: 'بحث في القصص', sub: 'في العناوين والنص', order: 56, open: openSearch});

  // ---------- تقييم القصة بإيموجي ----------
  function openRate() {
    const s = window.hikmaReader?.story; if (!s) return;
    const cur = (HX.X.ratings || {})[s.id];
    HX.dialog('hxRate', 'عجبتك القصة؟', `<div class="hx-rate" role="group" aria-label="تقييم القصة">${[['😍', 'جميلة جدا'], ['🙂', 'حلوة'], ['😐', 'عادية'], ['😕', 'مش عجباني']].map(([e, n]) => `<button class="hx-option" data-hx-rate="${e}" type="button" aria-pressed="${cur === e}"><span aria-hidden="true" style="font-size:30px">${e}</span><br>${n}</button>`).join('')}</div><p class="hx-feedback" id="hxRateMsg" role="status"></p>`);
    HX.open('hxRate');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hx-rate]'); const s = window.hikmaReader?.story;
    if (!b || !s) return;
    (HX.X.ratings = HX.X.ratings || {})[s.id] = b.dataset.hxRate; HX.save();
    document.querySelectorAll('[data-hx-rate]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.getElementById('hxRateMsg').textContent = 'شكرا! التقييم اتحفظ على جهازك فقط.';
  });
  HX.addReaderTool({id: 'rate', icon: '😊', label: 'قيّم', order: 42, onClick: openRate});

  // ---------- مراجع الطلاب: نصوص بصياغتنا ----------
  const REFS = [
    {id: 'ref-photo', icon: '🌿', title: 'البناء الضوئي', text: 'البناء الضوئي هو العملية التي تصنع بها النباتات غذاءها. تمتص الورقة ضوء الشمس بمادة خضراء اسمها الكلوروفيل. وتأخذ النبتة الماء من الجذور وغاز ثاني أكسيد الكربون من الهواء. من هذه المواد تصنع سكرا تستعمله في النمو، وتطلق الأكسجين الذي نتنفسه.'},
    {id: 'ref-water', icon: '💧', title: 'دورة الماء', text: 'تسخن الشمس مياه البحار والأنهار فيتبخر جزء منها. يرتفع البخار إلى السماء ويبرد فيتحول إلى قطرات صغيرة تكون السحاب. وعندما تكبر القطرات تسقط مطرا. يصب المطر في الأنهار والبحار أو يدخل في الأرض، وتبدأ الدورة من جديد.'},
    {id: 'ref-nile', icon: '🌊', title: 'نهر النيل', text: 'نهر النيل من أطول أنهار العالم، ويمر بعدة دول قبل أن يصل إلى مصر. اعتمد المصريون على مياهه في الزراعة وفي الشرب منذ آلاف السنين. تقام على ضفافه المدن والمزارع، ويصب في البحر المتوسط عند الدلتا.'},
    {id: 'ref-sound', icon: '🔊', title: 'كيف نسمع الصوت', text: 'الصوت اهتزازات تنتقل في الهواء مثل موجات صغيرة. تدخل هذه الموجات إلى الأذن فتهتز طبلة الأذن. ثم تنتقل الاهتزازات إلى الأذن الداخلية، وتتحول إلى إشارات يفهمها المخ. هكذا نعرف أن ما سمعناه كلام أو موسيقى أو جرس.'},
    {id: 'ref-eng', icon: '🌍', title: 'Climate and weather', text: 'Weather is what the sky and air are like today. It can be sunny, rainy or windy. Climate is the usual weather of a place over many years. For example, a desert has a hot and dry climate, even if one day brings a little rain.', lang: 'en'}
  ];
  function openRefs() {
    HX.dialog('hxRefs', 'مراجع للطلاب', `<p class="voice-note" style="margin-top:0">فقرات علمية قصيرة بصياغتنا. أضفها لمكتبتك واسمعها، واضغط على أي كلمة لمعناها. تقدر كمان تلصق فقرة من كتابك من «حكمة+ ← استيراد».</p><ul class="hx-cards">${REFS.map(r => `<li><button class="hx-card-btn" data-hx-ref="${r.id}" type="button"><strong><span aria-hidden="true">${r.icon}</span> ${esc(r.title)}</strong><span>${esc(r.text.slice(0, 70))}…</span></button></li>`).join('')}</ul>`);
    HX.open('hxRefs');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hx-ref]'); if (!b) return;
    const r = REFS.find(x => x.id === b.dataset.hxRef); if (!r) return;
    if (!HX.storyById(r.id)) HX.addStory({id: r.id, title: r.title, text: r.text, lang: r.lang || 'ar', icon: r.icon});
    HX.close('hxRefs'); HX.toast('اتضافت للمكتبة');
  });
  HX.features.push({id: 'refs', icon: '📚', name: 'مراجع للطلاب', sub: 'فقرات علمية قصيرة', order: 11, open: openRefs});

  // ---------- أي كلمة سمعت؟ ----------
  const GAME = ['شمس', 'قمر', 'نجمة', 'شجرة', 'نهر', 'سحابة', 'بومة', 'كتاب', 'قلم', 'مدرسة', 'زهرة', 'جبل'];
  let target = null;
  function round() {
    const pool = GAME.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    target = pool[Math.floor(Math.random() * 3)];
    HX.dialog('hxHear', 'أي كلمة سمعت؟', `<p class="voice-note" style="margin-top:0">اسمع الكلمة واختار الصح.</p><div class="hx-row"><button class="button primary" id="hxHearPlay" type="button">🔊 اسمع</button></div><div class="hx-options" role="group" aria-label="الاختيارات">${pool.map(w => `<button class="hx-option" data-hx-hear="${w}" type="button">${w}</button>`).join('')}</div><p class="hx-feedback" id="hxHearMsg" role="status"></p>`);
    HX.open('hxHear'); setTimeout(() => HX.speak(target), 300);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#hxHearPlay')) { HX.speak(target); return; }
    const b = e.target.closest('[data-hx-hear]'); if (!b) return;
    const msg = document.getElementById('hxHearMsg');
    if (b.dataset.hxHear === target) { msg.textContent = 'أحسنت! ✅'; HX.award?.(1, 'hear'); setTimeout(round, 1200); } else { msg.textContent = 'جرّب تاني، اسمع الكلمة مرة كمان.'; HX.speak(target); }
  });
  HX.features.push({id: 'hear', icon: '👂', name: 'أي كلمة سمعت؟', sub: 'لعبة سمع بسيطة', order: 70, open: round});

  // ---------- صفحة المشروع ----------
  function openAbout() {
    HX.dialog('hxAbout', 'عن مشروع حكمة', `<div class="hx-about">
      <p><strong>حكمة</strong> قلم ذكي بيقرأ الكتب الورقية بصوت عالٍ، والموقع ده نموذج تجريبي بيحاكي القلم.</p>
      <h3 class="hx-h3">لمين؟</h3><ul><li>أطفال من ٤ لـ ٨ سنين بيتعلموا القراءة.</li><li>مكفوفون وذوو إعاقات في القراءة أو الحركة.</li><li>طلاب من ١٦ لـ ٣٠ سنة بيذاكروا من كتب مرجعية.</li></ul>
      <h3 class="hx-h3">إزاي بيشتغل؟</h3><ol><li>القلم بيلمس الكلمة أو السطر في الكتاب.</li><li>بيتعرف على النص ويقرأه بصوت واضح.</li><li>الموقع بيحفظ الإعدادات ويعرض الكلمة المنطوقة ملوّنة.</li></ol>
      <h3 class="hx-h3">الإتاحة أولا</h3><p>عسر القراءة، مسطرة التركيز، زر واحد، تباين عالي، قارئ شاشة، كيبورد كامل، وصوت بسرعة تتحكم فيها.</p>
      <h3 class="hx-h3">الميدالية «وجدتها»</h3><p>فكرة مكمّلة للقلم لمساعدة الناس على إيجاد أغراضهم. لسه في مرحلة التصميم.</p>
      <p class="hx-muted">كل بياناتك محفوظة على جهازك فقط. الموقع بيشتغل بدون إنترنت بعد أول تحميل.</p></div>`);
    HX.open('hxAbout');
  }
  HX.features.push({id: 'about', icon: 'ℹ️', name: 'عن المشروع', sub: 'القلم والميدالية والإتاحة', order: 90, open: openAbout});
})();
