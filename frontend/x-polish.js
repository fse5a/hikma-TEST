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
