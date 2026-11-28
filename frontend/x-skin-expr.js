// تعبيرات الشخصيات: لما حاجة بتحصل (خلّصت قصة، إجابة صح أو غلط، تفكير)، صورة الشخصية بتتبدّل لتعبير مرسوم لحظات وبعدين ترجع.
// البومة ليها تعبيراتها في x-owl.js. أي شخصية من غير صور تعبيرات (دووم وفيليكس) بتفضل بصورتها العادية.
(() => {
  const SKINS = ['cat', 'bot', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda'];
  const root = document.documentElement;
  const skin = () => root.dataset.skin || 'hikma';
  const url = (s, e) => `assets/mascots/expr/${s}-${e}.webp`;
  const base = s => `assets/mascots/${s}.webp`;
  const targets = () => [...document.querySelectorAll('#mascotBuddy .buddy-img, .welcome img.owl, .reader-owl img')];
  let timer = 0, current = '';
  function restore() {
    const s = skin();
    targets().forEach(el => { if (/\/expr\//.test(el.getAttribute('src') || '')) el.src = base(s); });
    current = '';
  }
  function show(expr, ms) {
    const s = skin();
    if (!SKINS.includes(s)) return;
    targets().forEach(el => { el.src = url(s, expr); });
    current = expr; clearTimeout(timer); timer = setTimeout(restore, ms);
  }
  const preload = () => { const s = skin(); if (!SKINS.includes(s)) return; ['happy', 'thinking', 'tryagain', 'celebrate'].forEach(e => { const i = new Image(); i.src = url(s, e); }); };
  setTimeout(preload, 3000);
  new MutationObserver(preload).observe(root, {attributes: true, attributeFilter: ['data-skin']});
  addEventListener('hikma:finished', () => show('celebrate', 4500));
  addEventListener('hikma:wrong', () => show('tryagain', 2800));
  addEventListener('hikma:thinking', () => show('thinking', 2500));
  if (window.HX?.on) {
    HX.on('quiz', e => show(e.detail?.ok ? 'happy' : 'tryagain', 2800));
    HX.on('quizdone', e => show(e.detail?.score === e.detail?.total ? 'celebrate' : 'happy', 3500));
    HX.on('stars', () => show('happy', 2500));
  }
  document.addEventListener('click', e => { if (e.target.closest?.('#mascotBuddy .buddy-img, .welcome img.owl, .reader-owl')) show('happy', 2200); });
  window.HikmaSkinExpr = {show, restore, skins: SKINS, get current() { return current; }};
})();
