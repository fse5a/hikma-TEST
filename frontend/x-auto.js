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
