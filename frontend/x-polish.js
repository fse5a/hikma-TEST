// ============================================================
// لمسات صغيرة: البومة بتهز راسها مع كل جملة وبتنعس لو القارئ ساكت
// ============================================================
(() => {
  'use strict';
  const HX = window.HX;
  const owls = () => document.querySelectorAll('.reader-owl, .welcome .owl');
  let last = -1, idleTimer = null;
  const wake = () => { clearTimeout(idleTimer); document.body.classList.remove('hx-drowsy'); idleTimer = setTimeout(() => { if (document.getElementById('readerOverlay').classList.contains('open')) document.body.classList.add('hx-drowsy'); }, 60000); };
  new MutationObserver(() => {
    const a = document.querySelector('#readingText .active');
    if (!a) return;
    const i = Number(a.dataset.line);
    if (i === last) return;
    last = i;
    wake();
    owls().forEach(o => { o.classList.remove('hx-nod'); void o.offsetWidth; o.classList.add('hx-nod'); });
  }).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class']});
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, wake, true));
  HX.on('finished', () => document.body.classList.remove('hx-drowsy'));
})();

// زر "إعدادات القراءة": يخفي/يظهر لوحة الصوت الجانبية علشان النص ياخد مساحته (افتراضي: مقفول لو الشاشة قصيرة)
(() => {
  const root = document.getElementById('readerContent');
  if (!root) return;
  const KEY = 'hikma-reader-panel';
  const pref = () => { const v = localStorage.getItem(KEY); return v ? v === 'open' : innerHeight >= 760 && innerWidth >= 1000; };
  const apply = grid => {
    const open = pref();
    grid.classList.toggle('panel-closed', !open);
    const b = grid.querySelector('.reader-panel-toggle');
    if (b) { b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'إخفاء إعدادات القراءة' : 'إعدادات القراءة'; }
  };
  const inject = () => {
    const grid = root.querySelector('.reader-grid');
    if (!grid || grid.querySelector('.reader-panel-toggle') || innerWidth < 900) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'button secondary reader-panel-toggle';
    b.addEventListener('click', () => { localStorage.setItem(KEY, pref() ? 'closed' : 'open'); apply(grid); });
    grid.querySelector('.reader-main')?.prepend(b);
    apply(grid);
  };
  new MutationObserver(inject).observe(root, {childList: true, subtree: false});
  inject();
})();
