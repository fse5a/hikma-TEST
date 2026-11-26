// Interactive mascot: a small companion on every screen, hero mascot that follows the pointer,
// skin mascot in the reader header, reactions to reading and finishing a story.
(() => {
  const FILES = ['hikma', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom'];
  const root = document.documentElement;
  const skin = () => root.dataset.skin || 'hikma';
  const reduced = () => root.dataset.reducedMotion === 'true';
  const pool = () => (window.HikmaSkins?.lines?.[skin()]) || window.HikmaSkins?.lines?.hikma || ['أهلاً!'];
  const react = {
    reading: ['أنا سامعك، كمّل!', 'قراءة حلوة!', 'ركز معايا، إحنا في الأحداث.'],
    done: ['أحسنت! خلصت القصة!', 'برافو عليك! قصة جديدة؟', 'شاطر! نقرأ واحدة تانية؟'],
    hello: ['أهلاً بيك! نقرأ سوا؟', 'وحشتني! اختار قصة.']
  };
  const buddy = document.createElement('div');
  buddy.id = 'mascotBuddy';
  buddy.innerHTML = '<div class="buddy-bubble" role="status" aria-live="polite" hidden></div><img class="buddy-img" alt="" draggable="false" tabindex="0" role="button" aria-label="الشخصية">';
  const img = buddy.querySelector('img');
  const bubble = buddy.querySelector('.buddy-bubble');
  let timer = 0, turn = 0;
  function sync() {
    const s = skin();
    const ok = FILES.includes(s);
    buddy.style.display = ok ? '' : 'none';
    if (ok && img.dataset.s !== s) { img.src = `assets/mascots/${s}.webp`; img.dataset.s = s; }
    document.querySelectorAll('.reader-owl').forEach(el => {
      if (ok && el.dataset.s !== s) { el.innerHTML = `<img src="assets/mascots/${s}.webp" alt="" draggable="false">`; el.dataset.s = s; }
    });
  }
  function speak(text, talk) {
    bubble.textContent = text; bubble.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { bubble.hidden = true; }, 5200);
    if (window.HikmaMascotLines) window.HikmaMascotLines.pose([img, ...document.querySelectorAll('.reader-owl img')]);
    else { img.classList.remove('jump'); void img.offsetWidth; img.classList.add('jump'); }
    if (talk && 'speechSynthesis' in window && !document.body.classList.contains('hikma-reading')) {
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ar-EG'; speechSynthesis.speak(u); } catch {}
    }
  }
  const next = list => list[(turn++) % list.length];
  // سطور متنوعة لكل شخصية (x-mascot.js) مع رجوع للسطور القديمة لو مش موجودة
  const line = (cat, fallback) => window.HikmaMascotLines?.pick(skin(), cat) || next(fallback || pool());
  img.addEventListener('click', () => speak(line('click'), true));
  img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(line('click'), true); } });
  bubble.addEventListener('click', () => { bubble.hidden = true; });
  // eyes follow the pointer: mascots lean toward the cursor
  let raf = 0, px = 0, py = 0;
  function lean() {
    raf = 0;
    if (reduced()) return;
    document.querySelectorAll('.welcome img.owl, #mascotBuddy .buddy-img').forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
      const dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / 400));
      const dy = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / 400));
      el.style.translate = `${(dx * 8).toFixed(1)}px ${(dy * 5).toFixed(1)}px`;
      el.style.rotate = `${(dx * 5).toFixed(1)}deg`;
    });
  }
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(lean); }, {passive: true});
  // reactions
  addEventListener('hikma:finished', () => speak(line('done', react.done), true));
  let wasReading = false;
  new MutationObserver(() => {
    const r = document.body.classList.contains('hikma-reading');
    if (r && !wasReading) speak(line('reading', react.reading), false);
    wasReading = r;
  }).observe(document.body, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('click', e => {
    if (e.target.closest?.('[data-open]')) setTimeout(sync, 400);
  });
  // idle chatter, quiet and without voice
  setInterval(() => { if (!document.hidden && bubble.hidden && Math.random() < .5) speak(line('idle'), false); }, 45000);
  function start() {
    document.body.appendChild(buddy);
    sync();
    new MutationObserver(sync).observe(root, {attributes: true, attributeFilter: ['data-skin']});
    new MutationObserver(sync).observe(document.body, {childList: true, subtree: true});
    setTimeout(() => speak(line('hello', react.hello), false), 2500);
  }
  window.HikmaBuddy = {speak, line};
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
