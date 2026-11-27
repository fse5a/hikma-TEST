// ============================================================
// دفعة التحفيز والألعاب: كلها على الجهاز ومجانية وبتشتغل على أي نص:
//  مستويات - لوحة صدارة محلية بإذن الأهل - لعبة الكلمة الناقصة - مؤقت قراءة ١٠ دقايق
//  - خريطة المغامرة - مجموعة الشارات - تشجيع لو غاب أيام - تحدي العيلة الأسبوعي
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  const KEY = 'hikma-games-v1';
  const prefs = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } })();
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };
  const speak = t => { try { HX.say(t, 'ar'); } catch {} };
  const feat = (id, icon, name, sub, order, open) => HX.features.push({id, icon, name, sub, order, open});

  // ---------- مستويات ----------
  const LV = [[0, 'مبتدئ', '🌱'], [10, 'قارئ', '📗'], [40, 'قارئ شاطر', '📘'], [100, 'بطل الكتب', '🏆']];
  HX.levelOf = stars => { let l = LV[0]; for (const x of LV) if ((stars || 0) >= x[0]) l = x; const i = LV.indexOf(l); const nx = LV[i + 1]; return {name: l[1], icon: l[2], next: nx ? nx[0] - (stars || 0) : 0, nextName: nx ? nx[1] : ''}; };
  HX.on('stars', () => {
    const lv = HX.levelOf(HX.profile.stars).name;
    if (HX.profile.level && HX.profile.level !== lv) { HX.toast('🎉 مستوى جديد: ' + lv); HX.emit('levelup', {level: lv}); }
    HX.profile.level = lv;
  });

  // ---------- لوحة الصدارة (محلية، بإذن الأهل) ----------
  HX.leaderboard = () => HX.X.profiles.map(p => ({name: p.name, emoji: p.emoji, stars: p.stars || 0, stories: (p.finished || []).length})).sort((a, b) => b.stars - a.stars);
  function openBoard() {
    const allowed = !!prefs.board;
    const rows = allowed ? HX.leaderboard().map((r, i) => `<li>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${esc(r.emoji || '')} ${esc(r.name)}: ${r.stars} نجمة، ${r.stories} قصة</li>`).join('') : '';
    HX.dialog('hxBoard', 'لوحة الصدارة', `<p class="hx-muted">بتظهر الأسماء والنجوم اللي على الجهاز ده بس (مفيش حاجة بتتبعت لأي حد). الأهل هم اللي يفتحوها.</p><label><input type="checkbox" style="width:24px;height:24px;min-height:0;vertical-align:middle;margin-inline-end:8px" id="hxBoardOk"${allowed ? ' checked' : ''}> الأهل موافقين على إظهار اللوحة</label><ol class="hx-list" style="list-style:none;padding:0">${rows || '<li>فعّل الموافقة عشان تظهر.</li>'}</ol>`);
    HX.open('hxBoard');
  }
  document.addEventListener('change', e => { if (e.target.id === 'hxBoardOk') { prefs.board = e.target.checked; store(); openBoard(); } });
  feat('board', '🏅', 'لوحة الصدارة', 'مين أكتر نجوم', 33, openBoard);

  // ---------- لعبة الكلمة الناقصة (على أي نص) ----------
  const norm = s => String(s).replace(/[\u064B-\u0652]/g, '');
  HX.makeCloze = (text, rnd = Math.random) => {
    const sents = (HX.splitSentences ? HX.splitSentences(String(text || '')) : String(text || '').split(/[.!؟?\n]+/)).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 4);
    if (!sents.length) return null;
    const words = [...new Set(String(text).split(/[\s.,،!؟?:؛"«»()]+/).map(norm).filter(w => w.length > 2))];
    const sent = sents[Math.floor(rnd() * sents.length)];
    const toks = sent.split(/\s+/);
    const cand = toks.map((w, i) => [norm(w.replace(/[.,،!؟?:؛"«»()]/g, '')), i]).filter(x => x[0].length > 3);
    if (!cand.length || words.length < 3) return null;
    const [answer, idx] = cand[Math.floor(rnd() * cand.length)];
    const opts = words.filter(w => w !== answer).sort(() => rnd() - .5).slice(0, 2);
    const shown = toks.map((w, i) => i === idx ? '_____' : w).join(' ');
    return {sentence: shown, answer, options: [...opts, answer].sort(() => rnd() - .5)};
  };
  let cloze = null;
  function srcText() { const l = HX.lines ? HX.lines() : []; return l.length ? l.join('. ') : (state.stories[0]?.text || ''); }
  function openCloze(text) {
    cloze = HX.makeCloze(text || srcText());
    HX.dialog('hxCloze', 'الكلمة الناقصة', cloze ? `<p class="hx-moral-text" style="font-size:1.3em" role="status">${esc(cloze.sentence)}</p><div class="hx-row" style="flex-wrap:wrap">${cloze.options.map(o => `<button class="button" data-hx-cl="${esc(o)}" type="button">${esc(o)}</button>`).join('')}</div><p id="hxClMsg" role="status"></p>` : '<p>افتح قصة أو الصق نص أطول شوية وجرّب تاني.</p>');
    HX.open('hxCloze');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-hx-cl]'); if (!b || !cloze) return;
    const ok = b.dataset.hxCl === cloze.answer;
    document.getElementById('hxClMsg').textContent = ok ? 'صح! برافو.' : 'قريب! حاول تاني.';
    HX.emit('quiz', {ok});
    if (ok) { HX.award(1, 'cloze'); setTimeout(() => openCloze(), 900); }
  });
  feat('cloze', '🧩', 'الكلمة الناقصة', 'كمّل الجملة', 21, () => openCloze());

  // ---------- مؤقت القراءة ١٠ دقايق ----------
  let tm = 0, tleft = 0;
  function openTimer() {
    HX.dialog('hxTimer', 'مؤقت القراءة', `<p class="hx-muted">اقرأ ١٠ دقايق من غير ما تقفل وخد نجمة.</p><p id="hxTmShow" class="hx-moral-text" style="font-size:2em;text-align:center" role="timer">${fmt(tleft || 600)}</p><div class="modal-actions"><button class="button primary" id="hxTmGo" type="button">ابدأ</button><button class="button" id="hxTmStop" type="button">وقّف</button></div>`);
    HX.open('hxTimer');
  }
  const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  document.addEventListener('click', e => {
    if (e.target.closest('#hxTmGo')) {
      clearInterval(tm); tleft = HX.timerSeconds || 600;
      tm = setInterval(() => { tleft--; const el = document.getElementById('hxTmShow'); if (el) el.textContent = fmt(tleft); if (tleft <= 0) { clearInterval(tm); HX.award(1, 'timer'); HX.toast('⏱ خلصت ١٠ دقايق قراءة! خدت نجمة'); speak('برافو! خلصت عشر دقايق قراءة'); HX.emit('timerdone'); } }, 1000);
    }
    if (e.target.closest('#hxTmStop')) { clearInterval(tm); tleft = 0; const el = document.getElementById('hxTmShow'); if (el) el.textContent = fmt(600); }
  });
  feat('timer', '⏱', 'مؤقت ١٠ دقايق', 'اقرأ وخد نجمة', 22, openTimer);

  // ---------- خريطة المغامرة ----------
  HX.adventure = () => { const done = new Set((HX.profile.finished || []).map(f => f.id)); return state.stories.map(s => ({id: s.id, title: s.title, done: done.has(s.id)})); };
  function openMap() {
    const m = HX.adventure(), n = m.filter(x => x.done).length;
    HX.dialog('hxMap', 'خريطة المغامرة', `<p class="hx-muted">كل قصة بتخلصها بتفتح مكان جديد. فتحت ${n} من ${m.length}.</p><ol class="hx-list" style="list-style:none;padding:0">${m.map((x, i) => `<li>${x.done ? '🏝️' : '🔒'} ${i + 1}. ${esc(x.title)}</li>`).join('')}</ol>`);
    HX.open('hxMap');
  }
  feat('map', '🗺️', 'خريطة المغامرة', 'كل قصة مكان جديد', 23, openMap);

  // ---------- مجموعة الشارات ----------
  const ALL_BADGES = [['first', 'أول قصة'], ['ten', '١٠ قصص'], ['streak3', '٣ أيام متتالية'], ['streak7', 'أسبوع كامل'], ['goal', 'حققت هدف اليوم'], ['quizmaster', 'عبقري الأسئلة'], ['words', 'جامع الكلمات']];
  function openBadges() {
    const have = new Set((HX.profile.badges || []).map(b => b.id));
    HX.dialog('hxBadges', 'شاراتي', `<p class="hx-muted">معاك ${[...have].length} من ${ALL_BADGES.length}.</p><ul class="hx-list" style="list-style:none;padding:0">${ALL_BADGES.map(b => `<li>${have.has(b[0]) ? '🏅' : '⚪'} ${esc(b[1])}</li>`).join('')}</ul>`);
    HX.open('hxBadges');
  }
  feat('badges', '🎖️', 'شاراتي', 'مجموعة الشارات', 34, openBadges);

  // ---------- تحدي العيلة الأسبوعي ----------
  HX.familyWeek = () => {
    const days = new Set(HX.weekDays());
    const total = HX.X.profiles.reduce((a, p) => a + (p.finished || []).filter(f => days.has(f.day)).length, 0);
    return {total, goal: 5, done: total >= 5};
  };
  function openFamily() {
    const f = HX.familyWeek();
    HX.dialog('hxFam', 'تحدي العيلة', `<p class="hx-moral-text" role="status">الأسبوع ده العيلة خلّصت ${f.total} من ${f.goal} قصص.</p><progress max="${f.goal}" value="${Math.min(f.total, f.goal)}" style="width:100%"></progress><p>${f.done ? '🎉 كسبتوا التحدي!' : 'كمّلوا سوا.'}</p>`);
    HX.open('hxFam');
  }
  feat('family', '👨‍👩‍👧', 'تحدي العيلة', 'قصص الأسبوع كلها سوا', 35, openFamily);

  // ---------- تشجيع لو غاب أيام ----------
  HX.daysAway = () => { const d = HX.profile.days || []; if (!d.length) return 0; const last = new Date(d[d.length - 1] + 'T12:00:00'); return Math.floor((Date.now() - last) / 86400000); };
  setTimeout(() => { const a = HX.daysAway(); if (a >= 3) { HX.toast(`وحشتنا! بقالك ${a} أيام. تعالى نقرأ قصة صغيرة.`); window.dispatchEvent(new CustomEvent('hikma:comeback', {detail: {days: a}})); } }, 4000);
})();
