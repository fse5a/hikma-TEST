// التحديث التلقائي: مسؤول عن تسجيل الـService Worker وفحص النسخة الجديدة وتطبيقها بأمان.
// Auto-update: registers the service worker, checks for a new version on load, on tab focus,
// when back online and every 30 minutes, and applies it at a safe moment (never mid-reading or mid-recording).
(() => {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  let hadController = Boolean(navigator.serviceWorker.controller);
  let updateReady = false;
  let reloading = false;
  let banner = null;

  // مسؤول عن معرفة هل المستخدم مشغول (نافذة مفتوحة أو قراءة أو كتابة) فلا نقطع عليه
  // Busy means the user is in the middle of something: a dialog is open, reading is active, or text is being typed.
  function isBusy() {
    if (document.querySelector('.overlay.open')) return true;
    if (document.body.classList.contains('hikma-reading')) return true;
    if (window.speechSynthesis?.speaking) return true;
    if (document.querySelector('#storyText')?.value.trim()) return true;
    return Array.from(document.querySelectorAll('audio')).some(audio => !audio.paused);
  }

  // مسؤول عن إعادة تحميل الصفحة للنسخة الجديدة
  function reloadNow() {
    if (reloading) return;
    reloading = true;
    location.reload();
  }

  // مسؤول عن شريط «تحديث جديد، اضغط للتحديث»
  // Small banner: shown only when an update is ready but the user is busy.
  function showBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.setAttribute('role', 'status');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'تحديث جديد، اضغط للتحديث';
    button.addEventListener('click', reloadNow);
    banner.appendChild(button);
    document.body.appendChild(banner);
  }

  // مسؤول عن تطبيق التحديث في أول وقت آمن
  // Reload at the first safe moment; until then keep the banner visible.
  function applyWhenSafe() {
    if (!updateReady || reloading) return;
    if (!isBusy()) { reloadNow(); return; }
    showBanner();
    setTimeout(applyWhenSafe, 3000);
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; } // first install, nothing to refresh
    updateReady = true;
    applyWhenSafe();
  });

  navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'}).then(registration => {
    const check = () => registration.update().catch(() => {});
    if (registration.waiting) registration.waiting.postMessage('SKIP_WAITING');
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) worker.postMessage('SKIP_WAITING');
      });
    });
    check();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    window.addEventListener('focus', check);
    window.addEventListener('online', check);
    setInterval(check, 30 * 60 * 1000);
  }).catch(() => {});
})();
