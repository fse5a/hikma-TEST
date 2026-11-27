// ============================================================
// نواة المزايا الجديدة: التخزين، ملفات الأطفال، النوافذ، النجوم، قائمة «حكمة+»
// كل البيانات هنا محلية على الجهاز (localStorage) ومفيش أي خدمة مدفوعة.
// ============================================================
(() => {
  'use strict';
  const KEY = 'hikma-extras-v1';
  const today = (d = new Date()) => {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  // ملف طفل جديد بكل بياناته
  function newProfile(name = 'أنا', emoji = '🦉') {
    return {id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, emoji, interest: 'animals', stars: 0, days: [], seconds: {}, finished: [], goal: {type: 'stories', target: 1}, cards: [], badges: [], weekly: {}, plants: []};
  }
  function load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
    if (!data || !Array.isArray(data.profiles) || !data.profiles.length) {
      const first = newProfile();
      data = {profiles: [first], active: first.id, prefs: {}, pronounce: {}, art: {}};
    }
    data.prefs = data.prefs || {};
    data.pronounce = data.pronounce || {};
    if (!data.profiles.some(p => p.id === data.active)) data.active = data.profiles[0].id;
    return data;
  }
  const X = load();
  const HX = window.HX = {
    X, today, escapeHtml, newProfile,
    get profile() { return X.profiles.find(p => p.id === X.active) || X.profiles[0]; },
    get prefs() { return X.prefs; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(X)); } catch { /* التخزين ممتلئ */ } },
    toast(text) { if (typeof toast === 'function') toast(text); },
    events: new EventTarget(),
    emit(name, detail) { HX.events.dispatchEvent(new CustomEvent(name, {detail})); },
    on(name, fn) { HX.events.addEventListener(name, fn); },
    // بيعمل نافذة منبثقة بنفس شكل نوافذ التطبيق
    dialog(id, title, html, {wide = false} = {}) {
      let overlay = document.getElementById(id);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = id;
        overlay.innerHTML = `<section class="dialog${wide ? '' : ' narrow'}" role="dialog" aria-modal="true" aria-labelledby="${id}Title"><header class="dialog-head"><h2 id="${id}Title"></h2><button class="icon-button close" data-close="${id}" aria-label="إغلاق" type="button">×</button></header><div class="dialog-body"></div></section>`;
        document.body.appendChild(overlay);
      }
      overlay.querySelector('h2').textContent = title;
      overlay.querySelector('.dialog-body').innerHTML = html;
      return overlay;
    },
    open(id) { openModal(id); },
    close(id) { closeModal(id); },
    // بيضيف نجوم للطفل الحالي
    award(n, reason) {
      HX.profile.stars = (HX.profile.stars || 0) + n;
      HX.save();
      HX.emit('stars', {n, reason});
      refreshChip();
    },
    badge(id, title) {
      if (HX.profile.badges.some(b => b.id === id)) return false;
      HX.profile.badges.push({id, title, day: today()});
      HX.save();
      HX.toast(`🏅 شارة جديدة: ${title}`);
      return true;
    },
    secondsToday() { return HX.profile.seconds[today()] || 0; },
    streak() {
      const days = new Set(HX.profile.days);
      const c = new Date(); c.setHours(12, 0, 0, 0);
      if (!days.has(today(c))) c.setDate(c.getDate() - 1);
      let n = 0;
      while (days.has(today(c))) { n++; c.setDate(c.getDate() - 1); }
      return n;
    },
    finishedOn(day) { return HX.profile.finished.filter(f => f.day === day); },
    // أسبوع السبت للجمعة (الأسبوع المصري)
    weekStart(d = new Date()) {
      const c = new Date(d); c.setHours(12, 0, 0, 0);
      c.setDate(c.getDate() - ((c.getDay() + 1) % 7));
      return c;
    },
    weekDays(d = new Date()) {
      const s = HX.weekStart(d);
      return Array.from({length: 7}, (_, i) => { const c = new Date(s); c.setDate(s.getDate() + i); return today(c); });
    },
    // أداة لإضافة قصة للمكتبة
    addStory(s) {
      const item = {id: s.id || 'story-' + Date.now() + Math.random().toString(36).slice(2, 4), title: s.title, text: s.text, lang: s.lang || (arabic(s.text) ? 'ar' : 'en'), translation: '', progress: 0, icon: s.icon || '📖', ...(s.extra || {})};
      state.stories.unshift(item);
      save();
      renderLibrary();
      return item;
    },
    // بنات الجمل الحالية من متغيرات القارئ الأساسية (hikmaReader.lines فيه تعارض أسماء في الكود القديم)
    lines() { return lines; },
    lineIndex() { return lineIndex; },
    setIndex(i) { lineIndex = Math.max(0, Math.min(lines.length - 1, i)); renderLines(); saveProgress(); },
    storyById(id) { return state.stories.find(s => s.id === id); },
    features: [] // قائمة المزايا في نافذة «حكمة+»
  };

  // ---------- زر المزايا في الأعلى ----------
  const chip = document.createElement('button');
  chip.className = 'button secondary hx-chip';
  chip.id = 'hxOpen';
  chip.type = 'button';
  chip.title = 'مميزات حكمة';
  document.querySelector('.top-actions')?.prepend(chip);
  function refreshChip() {
    chip.innerHTML = `<span aria-hidden="true">🌟</span> حكمة+ <b class="hx-chip-n">${HX.profile.stars || 0}</b>`;
  }
  refreshChip();

  function renderHub() {
    const p = HX.profile;
    const tiles = HX.features.filter(f => !(f.hidden && f.hidden())).sort((a, b) => (a.order || 99) - (b.order || 99)).map(f => `<button class="hx-tile" data-hx-feature="${f.id}" type="button"><span class="hx-tile-ico" aria-hidden="true">${f.icon}</span><span class="hx-tile-name">${escapeHtml(f.name)}</span><span class="hx-tile-sub">${escapeHtml(f.sub || '')}</span></button>`).join('');
    const profiles = X.profiles.map(q => `<button class="hx-prof${q.id === p.id ? ' on' : ''}" data-hx-profile="${q.id}" type="button" aria-pressed="${q.id === p.id}">${escapeHtml(q.emoji)} ${escapeHtml(q.name)}</button>`).join('');
    HX.dialog('hxHub', 'حكمة+', `<div class="hx-hero"><div><strong>${escapeHtml(p.emoji)} ${escapeHtml(p.name)}</strong><span>⭐ ${p.stars || 0} نجمة · 🔥 ${HX.streak()} يوم</span></div><div class="hx-profs">${profiles}<button class="hx-prof" id="hxAddProfile" type="button">＋ مستخدم</button></div></div><div class="hx-grid">${tiles}</div>`, {wide: true});
  }
  function openHub() { renderHub(); openModal('hxHub'); }
  HX.openHub = openHub;
  HX.refreshHub = () => { if (document.getElementById('hxHub')?.classList.contains('open')) renderHub(); };
  chip.addEventListener('click', openHub);

  document.addEventListener('click', e => {
    const tile = e.target.closest('[data-hx-feature]');
    if (tile) {
      const f = HX.features.find(x => x.id === tile.dataset.hxFeature);
      if (f) { closeModal('hxHub'); f.open(); }
      return;
    }
    const prof = e.target.closest('[data-hx-profile]');
    if (prof) { X.active = prof.dataset.hxProfile; HX.save(); refreshChip(); renderHub(); HX.emit('profile'); return; }
    if (e.target.closest('#hxAddProfile')) {
      const name = (prompt('اسم المستخدم؟') || '').trim().slice(0, 20);
      if (!name) return;
      const emojis = ['🐱', '🦊', '🐻', '🐼', '🦁', '🐸', '🐧', '🦄'];
      const p = newProfile(name, emojis[X.profiles.length % emojis.length]);
      X.profiles.push(p); X.active = p.id; HX.save(); refreshChip(); renderHub(); HX.emit('profile');
    }
  });

  // ---------- تسجيل القراءة: النهاية والوقت ----------
  window.addEventListener('hikma:finished', () => {
    const s = window.hikmaReader?.story;
    if (!s) return;
    const p = HX.profile, day = today();
    if (!p.days.includes(day)) p.days.push(day);
    p.days = p.days.slice(-120);
    p.finished.push({id: s.id, title: s.title, day, ts: Date.now()});
    p.finished = p.finished.slice(-400);
    const firstTimeToday = HX.finishedOn(day).length === 1;
    HX.award(1 + (firstTimeToday ? 1 : 0), 'finish');
    p.plants.push({id: s.id, day, kind: p.plants.length % 6});
    if (p.finished.length === 1) HX.badge('first', 'أول قصة');
    if (p.finished.length >= 10) HX.badge('ten', '١٠ قصص');
    if (HX.streak() >= 3) HX.badge('streak3', '٣ أيام متتالية');
    if (HX.streak() >= 7) HX.badge('streak7', 'أسبوع كامل');
    HX.save();
    HX.emit('finished', {story: s});
  });
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now(), dt = Math.min(10, (now - lastTick) / 1000);
    lastTick = now;
    const open = document.getElementById('readerOverlay')?.classList.contains('open');
    if (!open || document.hidden) return;
    const day = today();
    HX.profile.seconds[day] = (HX.profile.seconds[day] || 0) + dt;
    const keys = Object.keys(HX.profile.seconds).sort();
    while (keys.length > 60) delete HX.profile.seconds[keys.shift()];
    HX.save();
    HX.emit('tick');
  }, 2000);
})();
