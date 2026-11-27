// بومة حكمة الحقيقية: تعابير، رمشة، وتنفّس. كل الصور من رسم المستخدم نفسه.
(() => {
  const P = n => `assets/owl/${n}.webp`;
  const POSES = ['neutral', 'blink', 'excited', 'surprised', 'suspicious', 'stern', 'sleepy', 'sleepy2', 'wink', 'hero', 'closed', 'happy', 'listening', 'thinking', 'thinking2', 'reading', 'reading2', 'encourage', 'curious', 'sad', 'proud', 'sneaky', 'thoughtful', 'anxious', 'laughing', 'celebrating'];
  const root = document.documentElement;
  const reduced = () => root.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const st = document.createElement('style');
  st.textContent = `
  img[data-owl]{object-fit:contain;object-position:50% 100%;transform-origin:50% 100%}
  @keyframes hx-breathe{0%,100%{scale:1 1}50%{scale:1.018 1.03}}
  html:not([data-reduced-motion="true"]) img[data-owl]{animation:hx-breathe 4.2s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){img[data-owl]{animation:none!important}}`;
  document.head.appendChild(st);
  let pose = 'neutral', hold = 0, blinkT = 0, sleepT = 0;
  const isOwl = el => el.tagName === 'IMG' && (el.dataset.owl || /mascots\/hikma\.webp/.test(el.getAttribute('src') || ''));
  const owls = () => [...document.querySelectorAll('img')].filter(isOwl);
  function paint(name) {
    owls().forEach(el => {
      if (!el.dataset.owl) { el.dataset.owl = '1'; el.dataset.box = ''; }
      if (el.dataset.pose !== name) { el.src = P(name); el.dataset.pose = name; }
    });
  }
  function set(name, ms) {
    if (!POSES.includes(name)) return;
    pose = name; paint(name); clearTimeout(hold);
    if (ms) hold = setTimeout(() => set('neutral'), ms);
    clearTimeout(sleepT);
    if (name === 'neutral') sleepT = setTimeout(() => set('sleepy', 0), 90000);
  }
  function blink() {
    clearTimeout(blinkT);
    blinkT = setTimeout(() => {
      if (!document.hidden && !reduced() && pose === 'neutral') {
        paint('blink'); setTimeout(() => { if (pose === 'neutral') paint('neutral'); }, 140);
      }
      blink();
    }, 2800 + Math.random() * 3200);
  }
  POSES.forEach(n => { const i = new Image(); i.src = P(n); });
  const skinIsHikma = () => (root.dataset.skin || 'hikma') === 'hikma';
  new MutationObserver(() => { if (skinIsHikma()) paint(pose); }).observe(document.documentElement, {childList: true, subtree: true});
  const HXon = (n, f) => window.HX?.on ? window.HX.on(n, f) : null;
  addEventListener('hikma:finished', () => set('celebrating', 4500));
  addEventListener('hikma:wrong', () => set('encourage', 2800));
  addEventListener('hikma:thinking', () => set('thinking', 2500));
  addEventListener('hikma:listening', () => set('listening', 4000));
  HXon('quiz', e => set(e.detail?.ok ? 'happy' : 'encourage', 2800));
  HXon('stars', () => set('proud', 2500));
  document.addEventListener('click', e => {
    if (e.target.closest?.('#mascotBuddy .buddy-img, .welcome img.owl, .reader-owl')) set(['laughing', 'wink', 'excited', 'curious'][Math.random() * 4 | 0], 2200);
    else if (pose === 'sleepy') set('neutral');
  });
  new MutationObserver(() => {
    if (document.body.classList.contains('hikma-reading')) set('reading'); else if (pose === 'reading') set('neutral');
  }).observe(document.body, {attributes: true, attributeFilter: ['class']});
  // لو الصفحة ساكتة فترة، البومة تنام. الصور اللي عينها مقفولة: closed للراحة
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pose === 'sleepy') set('neutral'); });
  window.HikmaOwl = {set, POSES};
  set('neutral'); blink();
})();
