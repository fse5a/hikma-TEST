// الثيم يتبع الجهاز (حي) طول ما المستخدم ما غيّرهوش بإيده.
(() => {
  const KEY = 'hikma-theme-manual';
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  if (!mq) return;
  const manual = () => localStorage.getItem(KEY) === '1';
  let applying = false;
  const apply = () => {
    if (manual()) return;
    const want = mq.matches ? 'dark' : 'light';
    if (document.documentElement.dataset.theme === want) return;
    const b = document.querySelector(`[data-theme-choice="${want}"]`); if (!b) return;
    applying = true; b.click(); applying = false;
  };
  document.addEventListener('click', e => { if (!applying && e.target.closest?.('[data-theme-choice]')) localStorage.setItem(KEY, '1'); }, true);
  mq.addEventListener?.('change', apply);
  window.HikmaAutoTheme = {apply, manual, reset: () => localStorage.removeItem(KEY)};
  setTimeout(apply, 600);
})();

// الشخصية المساعدة: تقعد في المساحة الفاضية في آخر الشريط الجانبي، فوق زر «اقرأ لي الصفحة»، ومبتغطيش أي زرار. لو مفيش مكان تستخبى.
(() => {
  const b = document.getElementById('mascotBuddy'); if (!b) return;
  const css = document.createElement('style');
  css.textContent = `#mascotBuddy[data-nospace]{visibility:hidden!important}
  #mascotBuddy .buddy-bubble{position:absolute!important;bottom:100%;inset-inline-start:calc(100% + 8px);width:max-content;max-width:min(220px,40vw)!important}`;
  document.head.appendChild(css);
  const visible = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  function place() {
    if (innerWidth <= 760) return;
    const tb = document.querySelector('.topbar'); if (!tb) return;
    const t = tb.getBoundingClientRect();
    if (t.width > 340) { b.dataset.nospace = '1'; return; } // مفيش شريط جانبي: مفيش مكان آمن
    let top = t.top;
    document.querySelectorAll('.topbar button, .topbar a, .topbar [role=button], .a11y, .topbar .brand').forEach(e => { if (visible(e)) top = Math.max(top, e.getBoundingClientRect().bottom); });
    const fab = document.getElementById('hxReadPage');
    const floor = fab && visible(fab) ? fab.getBoundingClientRect().top : innerHeight - 12;
    const room = floor - 10 - (top + 10);
    const size = Math.min(74, Math.floor(room));
    if (size < 44) { b.dataset.nospace = '1'; return; }
    delete b.dataset.nospace;
    const img = b.querySelector('.buddy-img');
    b.style.setProperty('inset-inline-start', 'auto', 'important'); b.style.setProperty('right', 'auto', 'important');
    b.style.setProperty('left', Math.round(t.left + (t.width - size) / 2) + 'px', 'important');
    b.style.setProperty('bottom', Math.round(innerHeight - floor + 10) + 'px', 'important');
    img.style.setProperty('width', size + 'px', 'important'); img.style.setProperty('height', size + 'px', 'important');
  }
  let q = 0; const sched = () => { cancelAnimationFrame(q); q = requestAnimationFrame(place); };
  addEventListener('resize', sched); document.addEventListener('hikma:languagechange', sched);
  new MutationObserver(sched).observe(document.documentElement, {attributes: true, attributeFilter: ['data-skin', 'data-theme', 'lang']});
  new MutationObserver(sched).observe(document.querySelector('.topbar') || document.body, {childList: true, subtree: true});
  setInterval(place, 1500); setTimeout(place, 300);
  window.HikmaBuddyPlace = place;
})();
