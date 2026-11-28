// ============================================================
// القراءة والفهم: شريط أدوات القارئ، أسئلة بعد القصة، العبرة، «كرر ورايا»، بطاقات الكلمات، مستويات الصعوبة
// ============================================================
(() => {
  'use strict';
  const HX = window.HX, esc = HX.escapeHtml, D = window.HXData;

  // ---------- شريط أدوات القارئ (بيستقبل أدوات من باقي الملفات) ----------
  const tools = [];
  HX.addReaderTool = tool => { tools.push(tool); mountBar(); };
  function mountBar() {
    const content = document.getElementById('readerContent');
    const main = content?.querySelector('.reader-main');
    if (!main || main.querySelector('.hx-bar')) return;
    const anchor = main.querySelector('.reader-controls');
    if (!anchor) return;
    const bar = document.createElement('div');
    bar.className = 'hx-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'أدوات إضافية للقصة');
    anchor.insertAdjacentElement('afterend', bar);
    tools.slice().sort((a, b) => (a.order || 50) - (b.order || 50)).forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hx-tool';
      b.dataset.hxTool = t.id;
      b.innerHTML = `<span aria-hidden="true">${t.icon}</span><span>${esc(typeof t.label === 'function' ? t.label() : t.label)}</span>`;
      b.addEventListener('click', () => t.onClick(window.hikmaReader?.story, b));
      bar.appendChild(b);
    });
    HX.emit('barmounted', {bar});
  }
  new MutationObserver(mountBar).observe(document.getElementById('readerContent'), {childList: true});
  HX.refreshBar = () => { document.querySelector('#readerContent .hx-bar')?.remove(); mountBar(); };

  // ---------- أدوات النص العربي ----------
  const strip = s => String(s || '').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  const tokens = s => (String(s).match(/[\u0600-\u06FF]+|[A-Za-z']+/g) || []);
  const STOP = new Set(['في', 'من', 'على', 'الى', 'عن', 'ثم', 'قد', 'كان', 'كانت', 'هذا', 'هذه', 'التي', 'الذي', 'لكن', 'كل', 'ان', 'ما', 'لا', 'هل', 'مع', 'او', 'بعد', 'قبل', 'عند', 'حتى', 'the', 'and', 'was', 'were', 'that', 'with', 'for', 'from', 'his', 'her', 'she', 'they', 'then', 'had', 'has']);
  const hashStr = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const seeded = seed => { let x = seed || 1; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; };
  const splitSentences = t => (String(t).match(/[^.!؟?\n]+[.!؟?]*/g) || []).map(s => s.trim()).filter(Boolean);
  const say = (text, language = 'ar') => {
    window.HikmaSpeak.speak(text, {lang: language === 'ar' ? 'ar' : 'en', rate: 0.95});
  };
  HX.say = say; HX.strip = strip; HX.splitSentences = splitSentences; HX.tokens = tokens;

  // ---------- 1) أسئلة بعد القصة ----------
  // أسئلة جاهزة للقصة لو موجودة، وإلا بنولّد أسئلة «أكمل الجملة» من نص القصة نفسه
  function quizFor(s) {
    if (Array.isArray(s.quiz) && s.quiz.length) return s.quiz;
    const seed = D.seedExtras[s.id];
    if (seed?.quiz) return seed.quiz;
    const her = D.heritage.find(h => h.id === s.id);
    if (her?.quiz) return her.quiz;
    const sents = splitSentences(s.text).filter(x => tokens(x).length >= 5);
    const pool = [...new Set(tokens(s.text).filter(w => strip(w).length >= 4 && !STOP.has(strip(w).toLowerCase())))];
    if (sents.length < 2 || pool.length < 4) return [];
    const rnd = seeded(hashStr(s.id + s.title));
    const picks = sents.map((x, i) => ({x, i, r: rnd()})).sort((a, b) => a.r - b.r).slice(0, 3).sort((a, b) => a.i - b.i);
    const isAr = /[\u0600-\u06FF]/.test(s.text);
    return picks.map(({x}) => {
      const cand = tokens(x).filter(w => pool.includes(w));
      if (!cand.length) return null;
      const answer = cand.sort((a, b) => b.length - a.length)[0];
      const others = pool.filter(w => w !== answer && strip(w) !== strip(answer)).sort(() => rnd() - 0.5).slice(0, 2);
      if (others.length < 2) return null;
      const options = [answer, ...others].map(v => ({v, r: rnd()})).sort((a, b) => a.r - b.r).map(o => o.v);
      return {q: (isAr ? 'أكمل الجملة: ' : 'Complete: ') + x.replace(answer, '＿＿＿＿'), o: options, a: options.indexOf(answer)};
    }).filter(Boolean);
  }
  HX.quizFor = quizFor;
  function moralFor(s) {
    return s.moral || D.seedExtras[s.id]?.moral || D.heritage.find(h => h.id === s.id)?.moral || '';
  }
  HX.moralFor = moralFor;

  let quizState = null;
  function openQuiz(s) {
    if (!s) return;
    const qs = quizFor(s);
    if (!qs.length) { HX.toast('القصة دي قصيرة على الأسئلة. جرب قصة أطول.'); return; }
    quizState = {story: s, qs, i: 0, score: 0, answered: false};
    renderQuiz();
    HX.open('hxQuiz');
  }
  function renderQuiz() {
    const {story: s, qs, i} = quizState;
    if (i >= qs.length) {
      const stars = quizState.score;
      HX.emit('quizdone', {score: quizState.score, total: qs.length});
      if (stars > 0) HX.award(Math.min(3, stars), 'quiz');
      HX.profile.quizzes = (HX.profile.quizzes || 0) + 1;
      if (quizState.score === qs.length) HX.badge('quizmaster', 'عبقري الأسئلة');
      HX.save();
      const moral = moralFor(s);
      HX.dialog('hxQuiz', 'أسئلة القصة', `<div class="hx-result"><div class="hx-big">${quizState.score === qs.length ? '🏆' : '🌟'}</div><h3>جاوبت ${quizState.score} من ${qs.length}</h3><p>${quizState.score === qs.length ? 'ممتاز! كلها صح.' : 'برافو! جرب تقرا القصة تاني وتحاول.'}</p>${moral ? `<div class="hx-moral"><strong>💡 العبرة</strong><p>${esc(moral)}</p></div>` : ''}<div class="modal-actions"><button class="button secondary" id="hxQuizAgain" type="button">من الأول</button><button class="button primary" data-close="hxQuiz" type="button">تمام</button></div></div>`);
      return;
    }
    const q = qs[i];
    const dir = /[\u0600-\u06FF]/.test(q.q) ? 'rtl' : 'ltr';
    HX.dialog('hxQuiz', 'أسئلة القصة', `<p class="hx-step">سؤال ${i + 1} من ${qs.length}</p><h3 class="hx-q" dir="${dir}">${esc(q.q)}</h3><div class="hx-options" role="group" aria-label="الاختيارات">${q.o.map((o, k) => `<button class="hx-option" data-hx-answer="${k}" type="button" dir="${/[\u0600-\u06FF]/.test(o) ? 'rtl' : 'ltr'}">${esc(o)}</button>`).join('')}</div><p class="hx-feedback" id="hxQuizFeedback" role="status"></p><div class="modal-actions"><button class="button primary" id="hxQuizNext" type="button" hidden>${i + 1 >= qs.length ? 'النتيجة' : 'التالي'}</button></div>`);
  }
  document.addEventListener('click', e => {
    const ans = e.target.closest('[data-hx-answer]');
    if (ans && quizState && !quizState.answered) {
      quizState.answered = true;
      const q = quizState.qs[quizState.i], pick = Number(ans.dataset.hxAnswer);
      const ok = pick === q.a;
      HX.emit('quiz', {ok});
      if (ok) quizState.score++;
      document.querySelectorAll('#hxQuiz [data-hx-answer]').forEach(b => {
        b.disabled = true;
        if (Number(b.dataset.hxAnswer) === q.a) b.classList.add('right');
        else if (b === ans) b.classList.add('wrong');
      });
      document.getElementById('hxQuizFeedback').textContent = ok ? '✅ صح! برافو.' : '❌ مش دي. الصح متعلّم بالأخضر.';
      document.getElementById('hxQuizNext').hidden = false;
      document.getElementById('hxQuizNext').focus();
      return;
    }
    if (e.target.closest('#hxQuizNext')) { quizState.i++; quizState.answered = false; renderQuiz(); return; }
    if (e.target.closest('#hxQuizAgain')) { openQuiz(quizState.story); }
  });

  // ---------- 5) بطاقة العبرة ----------
  function openMoral(s) {
    if (!s) return;
    const m = moralFor(s);
    const auto = !m && HX.autoMoral ? HX.autoMoral(s.text) : '';
    const isSeedOrHeritage = Boolean(D.seedExtras[s.id] || D.heritage.find(h => h.id === s.id));
    HX.dialog('hxMoral', 'العبرة من القصة', `<div class="hx-moral big"><div class="hx-big" aria-hidden="true">💡</div><h3>${esc(s.title)}</h3>${m ? `<p class="hx-moral-text">${esc(m)}</p>` : (auto ? `<p class="hx-moral-text">${esc(auto)}</p><p class="hx-muted">عبرة تقديرية اتولّدت تلقائيًا من نص القصة. تقدر تعدّلها بكلامك:</p>` : '<p class="hx-muted">لسه مفيش عبرة للقصة دي. اكتب العبرة بكلامك:</p>')}${isSeedOrHeritage ? '' : `<label class="sr-only" for="hxMoralInput">العبرة</label><textarea id="hxMoralInput" rows="2" maxlength="140" placeholder="مثلًا: الصدق دايمًا أحسن">${esc(s.moral || '')}</textarea><div class="modal-actions"><button class="button primary" id="hxMoralSave" type="button">حفظ العبرة</button></div>`}</div>`);
    HX.open('hxMoral');
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('#hxMoralSave')) return;
    const s = window.hikmaReader?.story;
    const v = document.getElementById('hxMoralInput').value.trim();
    if (s) { s.moral = v; save(); HX.toast(v ? 'اتحفظت العبرة' : 'اتمسحت العبرة'); openMoral(s); }
  });

  // ---------- 2) كرر ورايا (التعرف على الكلام من المتصفح، مجاني) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rep = {i: 0, rec: null};
  const norm = s => tokens(strip(s)).map(w => w.toLowerCase());
  // نسبة الكلمات اللي اتنطقت صح من الجملة
  function matchScore(target, heard) {
    const t = norm(target), h = norm(heard);
    if (!t.length) return 0;
    const pool = [...h];
    let hit = 0;
    t.forEach(w => {
      const k = pool.findIndex(x => x === w || (w.length > 3 && x.length > 3 && (x.startsWith(w.slice(0, -1)) || w.startsWith(x.slice(0, -1)))));
      if (k >= 0) { hit++; pool.splice(k, 1); }
    });
    return hit / t.length;
  }
  HX.matchScore = matchScore;
  function openRepeat(s) {
    if (!s) return;
    rep.i = Math.min(window.hikmaReader?.index || 0, (HX.lines().length || 1) - 1);
    renderRepeat();
    HX.open('hxRepeat');
  }
  function renderRepeat(result) {
    const r = window.hikmaReader, line = HX.lines()[rep.i] || '';
    const supported = Boolean(SR);
    const lang = r?.story?.lang === 'en' ? 'en' : 'ar';
    HX.dialog('hxRepeat', 'كرر ورايا', `<p class="hx-step">جملة ${rep.i + 1} من ${HX.lines().length || 1}</p><p class="hx-target" lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${esc(line)}</p><div class="hx-row"><button class="button secondary" id="hxRepeatListen" type="button">🔊 اسمع الجملة</button><button class="button primary" id="hxRepeatMic" type="button" ${supported ? '' : 'disabled'}>🎤 اتكلم</button></div><p class="hx-feedback" id="hxRepeatOut" role="status">${supported ? (result || 'اسمع الجملة ثم اضغط اتكلم وكررها.') : 'متصفحك مش بيدعم التعرف على الكلام. جرّب Chrome على الموبايل أو الكمبيوتر.'}</p><div class="hx-row"><button class="button secondary" id="hxRepeatPrev" type="button" ${rep.i === 0 ? 'disabled' : ''}>‹ السابقة</button><button class="button secondary" id="hxRepeatNext" type="button" ${rep.i + 1 >= (HX.lines().length || 1) ? 'disabled' : ''}>التالية ›</button></div><p class="voice-note">الصوت بيتعالج في المتصفح نفسه حسب خدمة الجهاز. مبنخزنش أي تسجيل.</p>`);
  }
  function listenOnce() {
    if (!SR) return;
    const r = window.hikmaReader, line = HX.lines()[rep.i], lang = r.story.lang === 'en' ? 'en-US' : 'ar-EG';
    const out = document.getElementById('hxRepeatOut');
    try { rep.rec?.abort(); } catch {}
    const rec = rep.rec = new SR();
    rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 3;
    out.textContent = '🎧 بسمعك…';
    rec.onresult = ev => {
      const alts = Array.from(ev.results[0]).map(a => a.transcript);
      const best = Math.max(...alts.map(a => matchScore(line, a)));
      const pct = Math.round(best * 100);
      const msg = best >= 0.8 ? `🌟 ممتاز! ${pct}%` : best >= 0.5 ? `👍 قريب! ${pct}%. جرب تاني.` : `🙂 جرب تاني ببطء (${pct}%).`;
      if (best >= 0.8) {
        const key = `${r.story.id}:${rep.i}:${HX.today()}`;
        HX.profile.repeated = HX.profile.repeated || [];
        if (!HX.profile.repeated.includes(key)) { HX.profile.repeated.push(key); HX.profile.repeated = HX.profile.repeated.slice(-200); HX.award(1, 'repeat'); }
      }
      renderRepeat(`${msg}\nسمعتك: «${alts[0]}»`);
    };
    rec.onerror = ev => { out.textContent = ev.error === 'not-allowed' ? 'اسمح للمتصفح باستخدام الميكروفون وجرب تاني.' : 'مسمعتش حاجة. جرب تاني.'; };
    rec.onend = () => { rep.rec = null; };
    rec.start();
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#hxRepeatMic')) listenOnce();
    else if (e.target.closest('#hxRepeatListen')) { const r = window.hikmaReader; say(HX.lines()[rep.i], r.story.lang); }
    else if (e.target.closest('#hxRepeatPrev')) { rep.i = Math.max(0, rep.i - 1); renderRepeat(); }
    else if (e.target.closest('#hxRepeatNext')) { rep.i = Math.min(HX.lines().length - 1, rep.i + 1); renderRepeat(); }
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-close="hxRepeat"]') || e.target.id === 'hxRepeat') { try { rep.rec?.abort(); } catch {} } });

  // ---------- 3) بطاقات الكلمات (تكرار متباعد) ----------
  const INTERVALS = [0, 1, 2, 4, 8, 16];
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return HX.today(d); };
  function saveWord(word, meaning) {
    const w = word.trim();
    if (!w) return false;
    const p = HX.profile;
    const existing = p.cards.find(c => strip(c.w) === strip(w));
    if (existing) { if (meaning && !existing.m) existing.m = meaning; HX.save(); return 'exists'; }
    const r = window.hikmaReader;
    const ctx = HX.lines()?.find(l => l.includes(w)) || '';
    p.cards.push({w, m: meaning || '', ctx, story: r?.story?.title || '', box: 0, due: HX.today(), lang: r?.story?.lang || 'ar'});
    HX.save();
    return true;
  }
  HX.saveWord = saveWord;
  // زر «احفظ الكلمة» جوه فقاعة المعنى
  new MutationObserver(list => {
    list.forEach(m => m.addedNodes.forEach(n => {
      if (!(n instanceof HTMLElement) || !n.classList.contains('word-pop') || n.querySelector('.hx-save-word')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hx-save-word'; b.textContent = '＋ احفظ';
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        const word = n.querySelector('.word-pop-word')?.textContent || '';
        let meaning = n.querySelector('.word-pop-meaning')?.textContent || '';
        if (meaning === '…' || meaning === '—' || meaning.startsWith('تعذر')) meaning = '';
        const res = saveWord(word, meaning);
        b.textContent = res === 'exists' ? '✔ محفوظة' : '✔ اتحفظت';
        b.disabled = true;
      });
      n.appendChild(b);
    }));
  }).observe(document.body, {childList: true});
  document.addEventListener('click', e => { if (e.target.closest('.hx-save-word')) e.stopImmediatePropagation(); }, true);

  let review = {queue: [], shown: false};
  function dueCards() { return HX.profile.cards.filter(c => c.due <= HX.today()); }
  function openCards() { renderCards(); HX.open('hxCards'); }
  function renderCards() {
    const p = HX.profile, due = dueCards();
    const rows = p.cards.slice().reverse().map((c, i) => `<li><span><bdi>${esc(c.w)}</bdi>${c.m ? ` <em>${esc(c.m)}</em>` : ''}</span><button class="icon-button" data-hx-card-del="${esc(c.w)}" aria-label="احذف ${esc(c.w)}" type="button">🗑</button></li>`).join('');
    HX.dialog('hxCards', 'كلماتي', `<div class="hx-hero small"><div><strong>${p.cards.length} كلمة محفوظة</strong><span>${due.length ? `🔔 ${due.length} كلمة لازم تراجعها النهاردة` : '🎉 مفيش مراجعة النهاردة'}</span></div><button class="button primary" id="hxReviewStart" type="button" ${due.length ? '' : 'disabled'}>ابدأ المراجعة</button></div><form class="hx-add-word" id="hxAddWordForm"><label class="sr-only" for="hxWordIn">الكلمة</label><input id="hxWordIn" placeholder="كلمة جديدة" maxlength="40" required><label class="sr-only" for="hxMeanIn">المعنى</label><input id="hxMeanIn" placeholder="معناها (اختياري)" maxlength="80"><button class="button secondary" type="submit">إضافة</button></form>${p.cards.length ? `<ul class="hx-list">${rows}</ul>` : '<p class="hx-muted">اضغط على أي كلمة أثناء القراءة ثم «احفظ» وهتظهر هنا.</p>'}`, {wide: true});
  }
  function nextReview() {
    const body = document.querySelector('#hxCards .dialog-body');
    const c = review.queue[0];
    if (!c) { HX.award(1, 'review'); HX.badge('words', 'جامع الكلمات'); renderCards(); HX.toast('خلصت المراجعة! ⭐'); return; }
    review.shown = false;
    body.innerHTML = `<p class="hx-step">باقي ${review.queue.length}</p><div class="hx-flash"><bdi class="hx-flash-word">${esc(c.w)}</bdi>${c.ctx ? `<p class="hx-flash-ctx">«${esc(c.ctx)}»</p>` : ''}<div class="hx-flash-back" id="hxFlashBack" hidden>${esc(c.m || 'اكتب المعنى بنفسك وانت بتراجع')}</div></div><div class="hx-row"><button class="button secondary" id="hxFlashSay" type="button">🔊 اسمعها</button><button class="button primary" id="hxFlashShow" type="button">اعرض المعنى</button></div><div class="hx-row" id="hxFlashGrade" hidden><button class="button secondary" data-hx-grade="0" type="button">❌ لسه</button><button class="button primary" data-hx-grade="1" type="button">✅ عرفتها</button></div>`;
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#hxReviewStart')) { review.queue = dueCards().slice(0, 10); nextReview(); return; }
    if (e.target.closest('#hxFlashShow')) { document.getElementById('hxFlashBack').hidden = false; document.getElementById('hxFlashGrade').hidden = false; e.target.closest('#hxFlashShow').hidden = true; return; }
    if (e.target.closest('#hxFlashSay')) { const c = review.queue[0]; say(c.w, c.lang); return; }
    const g = e.target.closest('[data-hx-grade]');
    if (g) {
      const c = review.queue.shift();
      c.box = g.dataset.hxGrade === '1' ? Math.min(INTERVALS.length - 1, c.box + 1) : 0;
      c.due = addDays(INTERVALS[c.box]);
      HX.save();
      nextReview();
      return;
    }
    const del = e.target.closest('[data-hx-card-del]');
    if (del) { HX.profile.cards = HX.profile.cards.filter(c => c.w !== del.dataset.hxCardDel); HX.save(); renderCards(); return; }
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'hxAddWordForm') return;
    e.preventDefault();
    saveWord(document.getElementById('hxWordIn').value, document.getElementById('hxMeanIn').value.trim());
    renderCards();
  });

  // ---------- 4) ثلاث مستويات للقصة ----------
  const LEVELS = [{id: 'easy', name: 'سهل'}, {id: 'normal', name: 'عادي'}, {id: 'hard', name: 'متقدم'}];
  const level = () => HX.prefs.level || 'normal';
  // بيقسّم الجمل الطويلة للسهل، وبيربط الجمل القصيرة للمتقدم
  function levelText(text, lv) {
    if (lv === 'normal' || !text) return text;
    const sents = splitSentences(text);
    if (lv === 'easy') {
      return sents.map(s => {
        const words = s.split(/\s+/);
        if (words.length <= 7) return s;
        const end = /[.!؟?]$/.test(s) ? s.slice(-1) : '.';
        let out = s, cut = 0;
        // نقطع عند أول فاصلة أو «ثم» بعد ٣ كلمات على الأقل
        for (let i = 3; i < words.length - 2; i++) {
          if (/[،,]$/.test(words[i]) || words[i + 1] === 'ثم' || words[i + 1] === 'and') { cut = i; break; }
        }
        if (cut) out = words.slice(0, cut + 1).join(' ').replace(/[،,]$/, '') + '. ' + words.slice(cut + 1).join(' ').replace(/^(ثم|and)\s+/, '');
        return out.endsWith(end) ? out : out + end;
      }).join(' ');
    }
    return sents.map((s, i) => (i % 2 === 0 && i + 1 < sents.length && s.split(/\s+/).length < 8) ? s.replace(/[.!؟?]$/, '') + '،' : s).join(' ');
  }
  HX.levelText = levelText;
  const prevGet = () => window.hikmaGetReaderText;
  const original = prevGet();
  window.hikmaGetReaderText = target => {
    const base = original ? original(target) : (typeof currentTextBase === 'function' ? currentTextBase(target) : '');
    return levelText(base, level());
  };
  function applyLevel() {
    document.documentElement.dataset.level = level();
    const s = window.hikmaReader?.story;
    if (s && document.getElementById('readerOverlay').classList.contains('open')) { renderReader(); HX.refreshBar(); }
  }
  document.documentElement.dataset.level = level();

  // ---------- تسجيل الأدوات ----------
  HX.addReaderTool({id: 'quiz', icon: '🧠', label: 'أسئلة', order: 10, onClick: openQuiz});
  HX.addReaderTool({id: 'repeat', icon: '🎤', label: 'كرر ورايا', order: 11, onClick: openRepeat});
  HX.addReaderTool({id: 'words', icon: '🃏', label: 'كلماتي', order: 12, onClick: openCards});
  HX.addReaderTool({id: 'moral', icon: '💡', label: 'العبرة', order: 13, onClick: openMoral});
  HX.addReaderTool({id: 'level', icon: '🎚️', label: () => 'المستوى: ' + LEVELS.find(l => l.id === level()).name, order: 14, onClick: () => {
    const next = LEVELS[(LEVELS.findIndex(l => l.id === level()) + 1) % LEVELS.length];
    HX.prefs.level = next.id; HX.save(); applyLevel();
    HX.toast('مستوى القصة: ' + next.name);
  }});
  HX.features.push({id: 'cards', icon: '🃏', name: 'كلماتي', sub: 'مراجعة كلمات القصص', order: 20, open: openCards});

  // بانر بعد نهاية القصة
  HX.on('finished', () => {
    const s = window.hikmaReader?.story;
    const main = document.querySelector('#readerContent .reader-main');
    if (!s || !main || main.querySelector('.hx-after')) return;
    const has = quizFor(s).length > 0;
    const box = document.createElement('div');
    box.className = 'hx-after';
    box.innerHTML = `<strong>🎉 أحسنت! خلّصت القصة.</strong>${has ? '<button class="button primary" id="hxAfterQuiz" type="button">🧠 جاوب على الأسئلة</button>' : ''}<button class="button secondary" id="hxAfterMoral" type="button">💡 العبرة</button>`;
    main.querySelector('.hx-bar')?.insertAdjacentElement('afterend', box);
    box.querySelector('#hxAfterQuiz')?.addEventListener('click', () => openQuiz(s));
    box.querySelector('#hxAfterMoral').addEventListener('click', () => openMoral(s));
  });
})();
