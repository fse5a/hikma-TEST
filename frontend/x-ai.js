// ============================================================
// دفعة ٧: ذكاء على الجهاز (من غير سيرفر ولا فلوس) وبيشتغل على أي نص:
//  أسئلة فهم (إيه حصل الأول؟ وأي جملة مش من القصة؟) - أهم الكلمات - مستوى النص
// كله قواعد بسيطة على النص نفسه، يعني مش بيفهم زي إنسان، لكنه بيشتغل أوفلاين.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  const feat = (id, icon, name, sub, order, open) => HX.features.push({id, icon, name, sub, order, open});
  const norm = s => String(s).replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').toLowerCase();
  const STOP = new Set(('في من على الى إلى عن مع هذا هذه ذلك التي الذي كان كانت ثم لكن او أو قد لا ما هو هي هم انه انها كل بعد قبل عند حتى اذا إذا ولكن وكان the a an and or but of to in on at is are was were be it its this that with for as by from he she they we you i his her their not had has have so if then when'
    ).split(/\s+/).map(norm));
  const split = t => (HX.splitSentences ? HX.splitSentences(String(t || '')) : String(t || '').split(/(?<=[.!؟?])\s+|\n+/)).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 3);
  const words = t => String(t || '').split(/[\s.,،!؟?:؛"«»()\-–]+/).map(norm).filter(w => w.length > 2);
  const shuffle = (a, rnd = Math.random) => a.map(x => [rnd(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const curText = () => { const l = HX.lines ? HX.lines() : []; return l.length ? l.join(' ') : (state.stories[0]?.text || ''); };
  const curId = () => window.hikmaReader?.story?.id || state.stories[0]?.id;

  // أهم الكلمات: الأكتر تكرارًا بعد شيل كلمات الربط
  HX.keywords = (text, n = 8) => {
    const f = new Map(); words(text).filter(w => !STOP.has(w) && !/^\d+$/.test(w)).forEach(w => f.set(w, (f.get(w) || 0) + 1));
    const raw = new Map(); String(text).split(/[\s.,،!؟?:؛"«»()\-–]+/).forEach(w => { const k = norm(w); if (!raw.has(k)) raw.set(k, w); });
    return [...f.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, n).map(([k, c]) => ({word: raw.get(k) || k, count: c}));
  };

  // مستوى النص: طول الجملة وطول الكلمة وكلمات نادرة
  HX.textLevel = text => {
    const s = split(text), w = String(text || '').split(/\s+/).filter(Boolean);
    if (!s.length || w.length < 5) return null;
    const avgS = w.length / s.length, avgW = w.join('').length / w.length;
    const ws = words(text), uniq = new Set(ws).size / Math.max(1, ws.length);
    const score = avgS * 0.5 + avgW * 1.5 + uniq * 2;
    const lvl = score < 12.5 ? {key: 'easy', name: 'سهل', who: 'مناسب للأطفال والمبتدئين'} : score < 16.5 ? {key: 'mid', name: 'متوسط', who: 'مناسب لطلاب المدرسة'} : {key: 'hard', name: 'صعب', who: 'محتاج قارئ متمرّن'};
    return {...lvl, sentences: s.length, words: w.length, avgSentence: +avgS.toFixed(1), score: +score.toFixed(1)};
  };

  // أسئلة الفهم
  HX.makeQuiz = (text, pool = [], rnd = Math.random) => {
    const s = split(text), qs = [];
    if (s.length >= 3) {
      const i = Math.floor(rnd() * (s.length - 2));
      const trio = [s[i], s[i + 1], s[i + 2]];
      qs.push({kind: 'order', q: 'إيه اللي حصل الأول في القصة؟', options: shuffle(trio, rnd), answer: trio[0]});
    }
    const other = pool.flatMap(split).filter(x => !s.includes(x));
    if (s.length >= 3 && other.length) {
      const three = shuffle(s, rnd).slice(0, 3), odd = other[Math.floor(rnd() * other.length)];
      qs.push({kind: 'odd', q: 'أي جملة من دول مش من القصة دي؟', options: shuffle([...three, odd], rnd), answer: odd});
    }
    return qs;
  };
  let quiz = null, qi = 0, right = 0;
  function showQ() {
    const q = quiz[qi];
    HX.dialog('hxAiQ', 'أسئلة عن القصة', q ? `<p class="hx-muted">سؤال ${qi + 1} من ${quiz.length}</p><p class="hx-moral-text" role="status">${esc(q.q)}</p><div class="hx-col">${q.options.map((o, i) => `<button type="button" class="button secondary" data-hx-aiq="${i}" style="text-align:start;margin:4px 0">${esc(o)}</button>`).join('')}</div><p id="hxAiMsg" class="hx-muted" role="status"></p>`
      : `<p class="hx-moral-text" role="status">خلصت! جاوبت ${right} من ${quiz.length} صح.</p><button type="button" class="button primary" id="hxAiAgain">جرّب تاني</button>`);
    HX.open('hxAiQ');
  }
  function openQuiz() {
    const id = curId(), pool = state.stories.filter(x => x.id !== id).map(x => x.text);
    quiz = HX.makeQuiz(curText(), pool); qi = 0; right = 0;
    if (!quiz.length) { HX.dialog('hxAiQ', 'أسئلة عن القصة', '<p class="hx-muted">النص قصير. محتاج على الأقل ٣ جمل علشان أسألك.</p>'); HX.open('hxAiQ'); return; }
    showQ();
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#hxAiAgain')) return openQuiz();
    const b = e.target.closest('button[data-hx-aiq]'); if (!b || !quiz?.[qi]) return;
    const q = quiz[qi], ok = q.options[Number(b.dataset.hxAiq)] === q.answer;
    HX.emit('quiz', {ok});
    document.getElementById('hxAiMsg').textContent = ok ? 'صح! برافو.' : 'مش دي. الصح: ' + q.answer;
    if (ok) { right++; HX.award(1, 'aiquiz'); }
    document.querySelectorAll('button[data-hx-aiq]').forEach(x => x.disabled = true);
    setTimeout(() => { qi++; showQ(); }, ok ? 900 : 2200);
  });
  feat('aiquiz', '❓', 'أسئلة عن القصة', 'إيه حصل الأول؟', 24, openQuiz);

  function openKeys() {
    const k = HX.keywords(curText());
    HX.dialog('hxAiKeys', 'أهم الكلمات', k.length ? `<p class="hx-muted">الكلمات اللي اتكررت أكتر في النص ده:</p><ul class="hx-list" style="list-style:none;padding:0">${k.map(x => `<li><button type="button" class="button secondary" data-hx-say="${esc(x.word)}">🔊 ${esc(x.word)}</button> <span class="hx-muted">× ${x.count}</span></li>`).join('')}</ul>` : '<p class="hx-muted">النص قصير جدًا.</p>');
    HX.open('hxAiKeys');
  }
  document.addEventListener('click', e => { const b = e.target.closest('button[data-hx-say]'); if (b) try { HX.say(b.dataset.hxSay, /[a-z]/i.test(b.dataset.hxSay) ? 'en' : 'ar'); } catch {} });
  feat('aikeys', '🔑', 'أهم الكلمات', 'إيه أهم كلمات النص', 25, openKeys);

  function openLevel() {
    const r = HX.textLevel(curText());
    HX.dialog('hxAiLvl', 'مستوى النص', r ? `<p class="hx-moral-text" role="status">مستوى النص: ${esc(r.name)}</p><p class="hx-muted">${esc(r.who)}</p><p class="hx-muted">${r.sentences} جملة، ${r.words} كلمة، متوسط الجملة ${r.avgSentence} كلمة.</p>` : '<p class="hx-muted">النص قصير جدًا للتقدير.</p>');
    HX.open('hxAiLvl');
  }
  feat('ailevel', '📏', 'مستوى النص', 'سهل ولا صعب؟', 26, openLevel);
})();
