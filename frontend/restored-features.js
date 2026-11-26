// ============================================================
// الملف الأكبر: المزايا الإضافية (الدخول، السكنز، الإعدادات، لوحة القراءة، الصوت الطبيعي، الترجمة، الكلمات، عدم الاتصال). مقسّم لأقسام مرقّمة؛ ابحث بكلمة «القسم».
// ============================================================
(() => {
  // ============================================================
  // القسم 1: البدايات (اللغة، الإعدادات الأولية، اتصال الخادم)
  // ============================================================
  const settings = state.settings;
  const api = window.HikmaApi;
  let cloudStatusState = {message: '', isError: false};
  const firstRun = !Object.prototype.hasOwnProperty.call(settings, 'activated');
  const detectedUiLanguage = settings.uiLanguage || window.HikmaI18n.detectLanguage();
  const autoUiLanguage = settings.uiLanguageAuto ?? !settings.uiLanguage;

  // بيفحص حالة السيرفر وتحديث رسالة الخدمات السحابية
  async function refreshBackendHealth() {
    try {
      const health = await api.health();
      window.hikmaBackendHealth = health;
      if (settings.uiLanguageAuto && window.HikmaI18n.languages.includes(health.recommendedLanguage)) {
        settings.uiLanguage = window.HikmaI18n.setLanguage(health.recommendedLanguage);
        save();
      }
      const status = document.querySelector('#voiceStatus');
      if (status) status.textContent = health?.mode === 'demo'
        ? 'الخدمات الخلفية في الوضع التجريبي؛ الترجمة والتشكيل السحابيان غير مهيأين.'
        : 'اتصال الخدمات الخلفية جاهز.';
      loadVoiceChoices();
    } catch (error) {
      const status = document.querySelector('#voiceStatus');
      if (status) status.textContent = api.toFriendlyMessage(error);
    }
  }
  // ده بتاع ضبط القيم الافتراضية للإعدادات
  Object.assign(settings, {
    activated: settings.activated === true,
    uiLanguage: detectedUiLanguage,
    uiLanguageAuto: autoUiLanguage,
    age: firstRun ? null : (settings.age || null),
    a11y: firstRun ? null : (settings.a11y ?? null),
    skin: settings.skin || 'hikma',
    voiceSource: settings.voiceSource || 'device',
    stars: Number(settings.stars || 0),
    theme: settings.theme === 'dark' || (!Object.prototype.hasOwnProperty.call(settings, 'theme') && (settings.skin === 'cat' || window.matchMedia?.('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light'
  });
  window.HikmaI18n.setLanguage(settings.uiLanguage);
  // ده بتاع تجهيز سجل النشاط
  state.activity = {...{completed: 0, opened: 0, recent: [], days: []}, ...(state.activity || {})};
  state.stories = state.stories.map(item => {
    const translationLang = item.translationLang || (item.lang === 'ar' ? 'en' : 'ar');
    const translations = {...(item.translations || {})};
    if (item.translation && !translations[translationLang]) translations[translationLang] = item.translation;
    return {...item, favorite: !!item.favorite, translations};
  });

  // ============================================================
  // القسم 2: بناء عناصر الواجهة الإضافية (رابط التخطي، بوابة الدخول، اللوحة، نافذة الإعدادات)
  // ============================================================
  const {skins, palettes, catArt, botArt, patterns, art, lines} = window.HikmaSkins;
  const shell = document.querySelector('.shell');
  const helperButton = document.querySelector('#a11yToggle');
  helperButton.innerHTML = '<span aria-hidden="true">♿</span>';
  helperButton.setAttribute('aria-label', 'إمكانية الوصول');
  helperButton.style.setProperty('display', 'grid');
  helperButton.style.setProperty('place-items', 'center');
  helperButton.style.setProperty('font-size', '0');
  const originalMascot = document.querySelector('.welcome .owl').outerHTML;
  const brandMark = document.querySelector('.brand-mark');
  const originalBrandMark = brandMark ? brandMark.innerHTML : '';
  window.originalMascotSvg = originalMascot;
  // ده بتاع رابط «انتقل إلى المحتوى» لقارئي الشاشة
  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#mainContent';
  skipLink.textContent = 'انتقل إلى المحتوى الرئيسي';
  document.body.prepend(skipLink);
  const mainContent = document.querySelector('.shell main');
  if (mainContent) {
    mainContent.id = 'mainContent';
    mainContent.tabIndex = -1;
  }
  // ده بتاع حاوية بوابة الدخول والتهيئة الأولى
  const gate = document.createElement('main');
  gate.id = 'onboarding';
  gate.className = 'onboarding';
  document.body.insertBefore(gate, shell);
  // ده بتاع لوحة الإحصائيات
  const dashboard = document.createElement('section');
  dashboard.id = 'readingDashboard';
  dashboard.className = 'reading-dashboard';
  document.querySelector('.welcome').insertAdjacentElement('afterend', dashboard);

  document.querySelector('.topbar').appendChild(helperButton);

  // ده بتاع بناء نافذة إعدادات التطبيق
  const settingsOverlay = document.createElement('div');
  settingsOverlay.id = 'appSettingsOverlay';
  settingsOverlay.className = 'overlay';
  settingsOverlay.innerHTML = `<section class="dialog narrow" role="dialog" aria-modal="true" aria-labelledby="appSettingsTitle"><header class="dialog-head"><h2 id="appSettingsTitle">إعدادات حكمة</h2><button class="icon-button" data-close="appSettingsOverlay" aria-label="إغلاق">×</button></header><div class="dialog-body feature-settings"><div class="feature-setting-block"><h3>العمر والواجهة</h3><div class="feature-setting-row"><button class="button secondary" data-age-choice="u16">وضع الأطفال</button><button class="button secondary" data-age-choice="o16">16 سنة أو أكثر</button></div></div><div class="feature-setting-block"><h3>المساعدة وإمكانية الوصول</h3><button class="button secondary" id="settingsA11y"></button></div><div class="feature-setting-block"><h3>شخصية القلم</h3><div class="skin-choices" id="settingsSkins"></div><form id="skinCodeForm" class="skin-code-form"><label for="skinCode">كود سكن جديد (مع القلم)</label><input id="skinCode" type="text" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX"><button class="button secondary" type="submit">فتح السكن</button><p class="gate-error" id="skinCodeMsg" role="status"></p></form></div><div class="feature-setting-block"><button class="button secondary" id="changePin">رقم الأهل السري</button><a class="button secondary" href="/privacy.html" target="_blank" rel="noopener">سياسة الخصوصية (مسودة)</a><a class="button secondary" href="/terms.html" target="_blank" rel="noopener">شروط الاستخدام (مسودة)</a></div><div class="feature-setting-block"><button class="button secondary" id="resetApp">إعادة ضبط التطبيق</button></div></div></section>`;
  settingsOverlay.querySelector('.feature-settings').insertAdjacentHTML('afterbegin', `<div class="feature-setting-block"><label for="uiLanguage">لغة التطبيق</label><select id="uiLanguage">${window.HikmaI18n.languages.map(language => `<option value="${language}">${window.HikmaI18n.languageNames[language]}</option>`).join('')}</select></div>`);
  settingsOverlay.querySelector('.feature-settings').insertAdjacentHTML('afterbegin', '<div class="feature-setting-block"><h3>المظهر</h3><div class="feature-setting-row theme-choices" role="group" aria-label="اختيار المظهر"><button class="button secondary" data-theme-choice="light">☀️ فاتح</button><button class="button secondary" data-theme-choice="dark">🌙 داكن</button></div></div>');
  settingsOverlay.querySelector('#settingsA11y').closest('.feature-setting-block').insertAdjacentHTML('afterend', '<div class="feature-setting-block" id="accessibilityOptions"><h3>خيارات إمكانية الوصول</h3><label for="a11yTextScale">حجم النص <output id="a11yTextScaleValue">100%</output></label><input id="a11yTextScale" type="range" min="100" max="200" step="10"><label for="a11yLineSpacing">تباعد الأسطر</label><select id="a11yLineSpacing"><option value="1.6">مضغوط</option><option value="2">مريح</option><option value="2.4">واسع</option></select><label><input id="a11yHighContrast" type="checkbox"> تباين عالٍ</label><label><input id="a11yDyslexiaFont" type="checkbox"> خط ميسّر للقراءة</label><label><input id="a11yReducedMotion" type="checkbox"> تقليل الحركة</label><label><input id="a11yVoiceGuidance" type="checkbox"> إرشاد صوتي</label><label for="a11yAnnouncementRate">سرعة الإعلانات الصوتية <output id="a11yAnnouncementRateValue">1x</output></label><input id="a11yAnnouncementRate" type="range" min="0.5" max="2" step="0.05"><label><input id="a11ySimpleMode" type="checkbox"> الوضع المبسّط</label><label><input id="a11yHaptics" type="checkbox"> اهتزاز عند التفاعل</label><label for="a11yHighlightStyle">نمط تمييز الجملة</label><select id="a11yHighlightStyle"><option value="yellow">أصفر</option><option value="underline">تسطير</option><option value="outline">إطار</option></select></div>');
  settingsOverlay.querySelector('.feature-settings').insertAdjacentHTML('beforeend', '<div class="feature-setting-block" id="accountSettings"><h3>حساب اختياري</h3><p class="voice-note">يمكنك بدء القراءة دون بريد إلكتروني. الترقية تحتاج إعداد Supabase Auth.</p><label for="accountEmail">البريد الإلكتروني</label><input id="accountEmail" type="email" autocomplete="email"><label for="accountPassword">كلمة المرور</label><input id="accountPassword" type="password" minlength="8" autocomplete="new-password"><button class="button secondary" id="upgradeAccount" type="button">ترقية الحساب</button><p id="accountStatus" class="status" role="status" aria-live="polite"></p></div>');
  settingsOverlay.querySelector('#upgradeAccount').addEventListener('click', async () => {
    const email = settingsOverlay.querySelector('#accountEmail').value.trim();
    const password = settingsOverlay.querySelector('#accountPassword').value;
    const status = settingsOverlay.querySelector('#accountStatus');
    status.textContent = 'جارٍ ترقية الحساب...';
    try {
      const result = await api.upgradeAccount(email, password);
      status.textContent = result.confirmationRequired ? 'تم ربط البريد. افتح رسالة التأكيد لإكمال الترقية.' : 'تمت ترقية الحساب.';
      settingsOverlay.querySelector('#accountPassword').value = '';
    } catch (error) {
      status.textContent = api.toFriendlyMessage(error);
    }
  });
  document.body.appendChild(settingsOverlay);
  const mobileNav = document.querySelector('.mobile-nav');
  // بيخفي وإظهار الشريط السفلي في الموبايل حسب النوافذ المفتوحة
  function syncResponsiveControls() {
    const activeDialogHead = document.querySelector('.overlay.open .dialog-head');
    if (activeDialogHead) activeDialogHead.appendChild(helperButton);
    else if (!settings.activated) gate.querySelector('.gate-brand')?.appendChild(helperButton);
    else document.querySelector('.topbar').appendChild(helperButton);
    mobileNav.hidden = !settings.activated || Boolean(activeDialogHead);
  }
  const overlayObserver = new MutationObserver(syncResponsiveControls);
  document.querySelectorAll('.overlay').forEach(overlay => overlayObserver.observe(overlay, {attributes: true, attributeFilter: ['class']}));
  // خاص بـقسم النسخة الاحتياطية في الإعدادات
  const backupBlock = document.createElement('div');
  backupBlock.className = 'feature-setting-block data-tools';
  backupBlock.innerHTML = '<h3>نسخة احتياطية</h3><button class="button secondary" id="exportLibrary" type="button">تصدير المكتبة والإعدادات</button><label class="button secondary" for="importLibrary">استيراد نسخة احتياطية</label><input id="importLibrary" type="file" accept="application/json,.json"><p class="data-note">النسخة تشمل القصص والملاحظات والإعدادات. التسجيلات الصوتية تبقى على هذا الجهاز ولا تُصدّر.</p><p class="status" id="backupStatus" role="status"></p>';
  settingsOverlay.querySelector('#resetApp').closest('.feature-setting-block').before(backupBlock);
  // خاص بـقسم العمل دون اتصال في الإعدادات
  const offlineBlock = document.createElement('div');
  offlineBlock.className = 'feature-setting-block';
  offlineBlock.innerHTML = '<h3>العمل دون اتصال</h3><p class="voice-note" id="offlineInfo">جارٍ حساب المحتوى المحفوظ على هذا الجهاز...</p>';
  settingsOverlay.querySelector('#resetApp').closest('.feature-setting-block').before(offlineBlock);
  // ده بتاع خيار مصدر الصوت
  const voiceSourceField = document.createElement('div');
  voiceSourceField.className = 'field';
  voiceSourceField.innerHTML = '<label for="voiceSource">مصدر الصوت</label><select id="voiceSource"><option value="device">صوت الجهاز (جودة أقل)</option></select><p class="voice-note">الصوت السحابي الطبيعي يتاح تلقائيًا عند تهيئة الخدمة الخلفية.</p>';
  document.querySelector('#settingsOverlay .dialog-body').prepend(voiceSourceField);
  // ده بتاع زر مسح الصوت المحفوظ على الجهاز
  const clearSpeechCacheButton = document.createElement('button');
  clearSpeechCacheButton.className = 'button secondary';
  clearSpeechCacheButton.id = 'clearSpeechCache';
  clearSpeechCacheButton.type = 'button';
  clearSpeechCacheButton.textContent = 'مسح الصوت المحفوظ على هذا الجهاز';
  document.querySelector('#settingsOverlay .dialog-body').append(clearSpeechCacheButton);
  clearSpeechCacheButton.addEventListener('click', async () => {
    try {
      const database = await db();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction('speechCache', 'readwrite');
        transaction.objectStore('speechCache').clear();
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      cloudCache.clear();
      $('#voiceStatus').textContent = 'تم مسح الصوت المحفوظ على هذا الجهاز.';
    } catch {
      $('#voiceStatus').textContent = 'تعذر مسح الصوت المحفوظ.';
    }
  });

  // ============================================================
  // القسم 3: التصفح والتأثيرات الصوتية (النطق والنغمات)
  // ============================================================
  // بينطق جملة قصيرة للمستخدم بصوت الجهاز
  function say(text, language = 'ar-EG') {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = SPEECH_SETTINGS.clampRate(settings.announcementRate);
    utterance.pitch = Math.pow(2, SPEECH_SETTINGS.clampPitch(settings.pitch) / 12);
    const voices = speechSynthesis.getVoices();
    const preferred = language.startsWith('en') ? settings.enVoice : settings.arVoice;
    const voice = voices.find(item => item.name === preferred) || voices.find(item => item.lang.toLowerCase().startsWith(language.slice(0, 2)));
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }

  // نغمة قصيرة مميزة لكل سكن
  function playChime() {
    try {
      const notes = {hikma: [523, 659, 784], cat: [392, 587, 880], bot: [220, 330, 220]}[settings.skin];
      const context = new (window.AudioContext || window.webkitAudioContext)();
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = settings.skin === 'bot' ? 'square' : 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.07;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + index * 0.13);
        oscillator.stop(context.currentTime + index * 0.13 + 0.11);
      });
    } catch {}
  }

  // هنا: شريط الملف الشخصي وأزرار الإعدادات والثيم في الأعلى
  function updateProfile() {
    const actions = document.querySelector('.top-actions');
    let chip = document.querySelector('#profileChip');
    if (!chip) {
      chip = document.createElement('span');
      chip.id = 'profileChip';
      chip.className = 'profile-chip';
      actions.appendChild(chip);
    }
    chip.classList.toggle('star-chip', settings.age === 'u16');
    chip.textContent = settings.age === 'u16' ? `⭐ ${settings.stars} نجوم` : `${skins[settings.skin].icon} ${skins[settings.skin].name}`;
    if (!document.querySelector('#settingsOpen')) {
      const button = document.createElement('button');
      button.id = 'settingsOpen';
      button.className = 'button secondary';
      button.type = 'button';
      button.textContent = '⚙ الإعدادات';
        button.setAttribute('aria-label', 'الإعدادات');
        button.title = 'الإعدادات';
      button.addEventListener('click', openAppSettings);
      actions.insertBefore(button, actions.firstChild);
    }
    const addButton = document.querySelector('#addOpen');
    if (addButton) {
      addButton.setAttribute('aria-label', 'إضافة قصة جديدة');
      addButton.title = 'إضافة قصة جديدة';
    }
    let themeButton = document.querySelector('#themeToggle');
    if (!themeButton) {
      themeButton = document.createElement('button');
      themeButton.id = 'themeToggle';
      themeButton.className = 'icon-button theme-toggle';
      themeButton.type = 'button';
      themeButton.addEventListener('click', () => setTheme(settings.theme === 'dark' ? 'light' : 'dark'));
      actions.insertBefore(themeButton, document.querySelector('#settingsOpen').nextSibling);
    }
    const sunIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>';
    const moonIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z"/></svg>';
    themeButton.innerHTML = settings.theme === 'dark' ? sunIcon : moonIcon;
    themeButton.title = settings.theme === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن';
    themeButton.setAttribute('aria-label', themeButton.title);
  }

  // ============================================================
  // القسم 4: لوحة الإحصائيات والمكتبة المحسّنة
  // ============================================================
  // بيرسم لوحة الإحصائيات
  function renderDashboard() {
    const activity = state.activity;
    const favoriteCount = state.stories.filter(item => item.favorite).length;
    const completed = Number(activity.completed || 0);
    const days = new Set(activity.days || []);
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    const latest = (activity.recent || []).map(id => state.stories.find(item => item.id === id)).find(Boolean);
    dashboard.innerHTML = `<div class="dashboard-stat"><strong>${completed}</strong><span>قصص مكتملة</span></div><div class="dashboard-stat"><strong>${streak}</strong><span>أيام متتالية</span></div><div class="dashboard-stat"><strong>${favoriteCount}</strong><span>قصص مفضلة</span></div><div class="dashboard-continue"><span>${latest ? `آخر قراءة: ${esc(latest.title)}` : 'ابدأ أول حكاية لك'}</span>${latest ? `<button class="button secondary" data-open="${esc(latest.id)}">متابعة القراءة</button>` : '<span>اختر حكاية من مكتبتك</span>'}</div>`;
  }

  // ده بتاع تسجيل يوم القراءة للأيام المتتالية
  function markReadingDay() {
    const days = new Set(state.activity.days || []);
    days.add(new Date().toISOString().slice(0, 10));
    state.activity.days = [...days].sort().slice(-90);
  }

  // بيسجّل فتح قصة
  function recordStoryOpened(id) {
    if (!state.stories.some(item => item.id === id)) return;
    state.activity.opened = Number(state.activity.opened || 0) + 1;
    state.activity.recent = [id, ...(state.activity.recent || []).filter(previous => previous !== id)].slice(0, 10);
    state.activity.lastOpened = new Date().toISOString();
    markReadingDay();
    save();
    renderDashboard();
  }

  // بيحسّن بطاقات المكتبة
  function enhanceLibrary() {
    const library = document.querySelector('#library');
    const filter = document.querySelector('#filter');
    if (!filter.querySelector('[value="favorites"]')) filter.add(new Option('المفضلة', 'favorites'));
    const favoriteFilter = filter.value === 'favorites';
    const cards = [...library.querySelectorAll('.story-card')];
    for (const card of cards) {
      const openButton = card.querySelector('[data-open]');
      const item = state.stories.find(candidate => candidate.id === openButton?.dataset.open);
      if (!item) continue;
      let button = card.querySelector('[data-favorite]');
      if (!button) {
        button = document.createElement('button');
        button.className = 'favorite-toggle';
        button.type = 'button';
        button.dataset.favorite = item.id;
        card.querySelector('.story-top').insertBefore(button, card.querySelector('.story-tag'));
      }
      button.textContent = item.favorite ? '★' : '☆';
      button.setAttribute('aria-pressed', String(item.favorite));
      button.setAttribute('aria-label', item.favorite ? `إزالة ${item.title} من المفضلة` : `إضافة ${item.title} للمفضلة`);
      button.title = button.getAttribute('aria-label');
      card.hidden = favoriteFilter && !item.favorite;
    }
    let empty = library.querySelector('#favoriteEmpty');
    const visibleCards = cards.filter(card => !card.hidden).length;
    if (favoriteFilter && visibleCards === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.id = 'favoriteEmpty';
        empty.className = 'empty';
        empty.innerHTML = '<strong>قائمة المفضلة فارغة</strong>اضغط على النجمة في أي قصة لإضافتها هنا.';
        library.appendChild(empty);
      }
      empty.hidden = false;
    } else if (empty) {
      empty.remove();
    }
    if (favoriteFilter) $('#libraryCount').textContent = `${visibleCards} قصة مفضلة`;
  }

  // بيستبدل دالة رسم المكتبة بنسخة محسّنة
  const baseRenderLibrary = window.renderLibrary;
  window.renderLibrary = function renderEnhancedLibrary() {
    const filter = document.querySelector('#filter');
    const favoritesOnly = filter.value === 'favorites';
    if (favoritesOnly) filter.value = 'all';
    baseRenderLibrary();
    if (favoritesOnly) filter.value = 'favorites';
    enhanceLibrary();
    renderDashboard();
  };
  // ده بتاع تحديث المكتبة عند تغيير الفلتر
  document.querySelector('#filter').addEventListener('change', () => window.renderLibrary());
  // زر المفضلة والنقر على بطاقات المكتبة
  document.addEventListener('click', event => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const item = state.stories.find(candidate => candidate.id === favorite.dataset.favorite);
      if (!item) return;
      item.favorite = !item.favorite;
      save();
      window.renderLibrary();
      return;
    }
    const open = event.target.closest('[data-open]');
    if (open && open.closest('#library, .dashboard-continue')) recordStoryOpened(open.dataset.open);
  }, true);

      // ============================================================
      // القسم 5: السكنز والثيم (فاتح وداكن)
      // ============================================================
      // بيطبّق السكن والألوان والثيم على الصفحة كلها
      function applySkin() {
    if (settings.age === 'u16' && !settings.skinPicked) settings.skin = 'cat';
    // سكن مقفول من غير كود مفتوح؟ نرجع للبومة
    if (skins[settings.skin]?.locked && !(settings.unlockedSkins || []).includes(settings.skin)) settings.skin = 'hikma';
    const skin = skins[settings.skin] || skins.hikma;
    const palette = palettes[settings.skin]?.[settings.theme] || palettes.hikma.light;
    const root = document.documentElement;
    root.dataset.mode = settings.age === 'u16' ? 'kids' : 'standard';
    root.dataset.a11y = settings.a11y ? 'on' : 'off';
    root.dataset.theme = settings.theme;
    const paper = palette.paper;
    root.dataset.skin = settings.skin;
    for (const [name, value] of Object.entries({'--green': palette.green, '--green-dark': palette.dark, '--mint': palette.mint, '--paper': paper, '--surface': palette.surface, '--ink': palette.ink, '--muted': palette.muted, '--line': palette.line, '--on-accent': palette.on})) root.style.setProperty(name, value);
    const systemContrast = window.matchMedia?.('(prefers-contrast: more)').matches;
    const highContrast = settings.highContrast ?? systemContrast;
    if (settings.a11y || highContrast) {
      for (const [name, value] of Object.entries({'--paper': '#000', '--surface': '#111', '--ink': '#fff', '--muted': '#f1f1f1', '--green': '#ffd23f', '--green-dark': '#ffd23f', '--mint': '#222', '--line': '#fff', '--on-accent': '#000'})) root.style.setProperty(name, value);
      root.style.colorScheme = 'dark';
      root.dataset.hc = 'on';
    } else {
      root.dataset.hc = 'off';
      root.style.setProperty('--surface', `color-mix(in srgb, ${palette.surface} 90%, transparent)`);
      root.style.colorScheme = settings.theme;
    }
    root.style.fontSize = `${Math.max(100, Math.min(200, Number(settings.textScale || (settings.a11y ? 150 : 100))))}%`;
    root.style.setProperty('--reading-line-height', String(settings.lineSpacing || 2.1));
    root.style.fontFamily = settings.dyslexiaFont ? 'OpenDyslexic, Verdana, sans-serif' : '';
    root.dataset.reducedMotion = String(settings.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    root.dataset.simpleMode = String(!!settings.simpleMode);
    root.dataset.highlightStyle = settings.highlightStyle || 'yellow';
    document.body.style.background = settings.a11y ? 'var(--paper)' : patterns[settings.skin] ? `${patterns[settings.skin]},var(--paper)` : 'var(--paper)';
    const mascot = document.querySelector('.welcome .owl');
    if (mascot) mascot.outerHTML = settings.skin === 'hikma' ? originalMascot : (art[settings.skin] || botArt);
    // شعار الهيدر الصغير كمان بيتحوّل مع السكنز المقفولة
    if (brandMark) brandMark.innerHTML = skin.locked && art[settings.skin] ? art[settings.skin].replace('class="owl" ', 'aria-hidden="true" ').replace(/role="img" aria-label="[^"]*"/, '') : originalBrandMark;
    const liveMascot = document.querySelector('.welcome .owl');
    if (liveMascot) { liveMascot.setAttribute('tabindex', '0'); liveMascot.setAttribute('role', 'button'); liveMascot.setAttribute('aria-label', `${skin.name}، المسه ليتكلم`); }
    const welcome = document.querySelector('.welcome h1');
    if (welcome) welcome.textContent = settings.age === 'u16' ? `أهلاً يا بطل! ${skin.icon}` : 'كل قصة، عالم جديد.';
    const subtitle = document.querySelector('.brand-sub');
    if (subtitle) subtitle.textContent = skin.name;
    helperButton.hidden = false;
    helperButton.setAttribute('aria-pressed', String(!!settings.a11y));
    helperButton.setAttribute('aria-label', settings.a11y ? 'إيقاف وضع المساعدة' : 'تشغيل وضع المساعدة');
    updateProfile();
  }

  // بيعبّي نافذة الإعدادات بالقيم الحالية
  function renderSettings() {
    $('#uiLanguage').value = settings.uiLanguage;
    settingsOverlay.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(settings.theme === button.dataset.themeChoice));
      button.classList.toggle('primary', settings.theme === button.dataset.themeChoice);
    });
    settingsOverlay.querySelectorAll('[data-age-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(settings.age === button.dataset.ageChoice));
      button.classList.toggle('primary', settings.age === button.dataset.ageChoice);
    });
    $('#settingsSkins').innerHTML = Object.entries(skins).filter(([key, skin]) => !skin.locked || (settings.unlockedSkins || []).includes(key)).map(([key, skin]) => `<button class="skin-choice" type="button" data-skin="${key}" aria-pressed="${settings.skin === key}"><span class="skin-swatch" style="--swatch:${skin.green}"></span><span>${skin.icon} ${skin.name}</span></button>`).join('');
    $('#settingsA11y').textContent = settings.a11y ? 'المساعدة مفعّلة، اضغط للإيقاف' : 'المساعدة متوقفة، اضغط للتفعيل';
    $('#settingsA11y').setAttribute('aria-pressed', String(!!settings.a11y));
    $('#a11yTextScale').value = Math.max(100, Math.min(200, Number(settings.textScale || 100)));
    $('#a11yTextScaleValue').value = `${$('#a11yTextScale').value}%`;
    $('#a11yLineSpacing').value = String(settings.lineSpacing || 2.1);
    $('#a11yHighContrast').checked = !!settings.highContrast;
    $('#a11yDyslexiaFont').checked = !!settings.dyslexiaFont;
    $('#a11yReducedMotion').checked = !!settings.reducedMotion;
    $('#a11yVoiceGuidance').checked = settings.voiceGuidance !== false;
    $('#a11yAnnouncementRate').value = SPEECH_SETTINGS.clampRate(settings.announcementRate);
    $('#a11yAnnouncementRateValue').value = `${settings.announcementRate || 1}x`;
    $('#a11ySimpleMode').checked = !!settings.simpleMode;
    $('#a11yHaptics').checked = !!settings.haptics;
    $('#a11yHighlightStyle').value = settings.highlightStyle || 'yellow';
  }

  // ده بتاع فتح نافذة الإعدادات
  async function openAppSettings() {
    if (settings.age === 'u16' && settings.parentPinHash && !(await askParentPin())) return;
    renderSettings();
    updateOfflineUI();
    openModal('appSettingsOverlay');
  }

  // بيبدّل بين الوضع الفاتح والداكن
  function setTheme(theme) {
    settings.theme = theme === 'dark' ? 'dark' : 'light';
    save();
    applySkin();
    renderSettings();
  }

  // ============================================================
  // القسم 6: النسخ الاحتياطي واستعادة البيانات
  // ============================================================
  // بينزّل نسخة احتياطية من المكتبة والإعدادات
  function downloadBackup() {
    const backup = {
      format: 'hikma-reading-library',
      version: 1,
      exportedAt: new Date().toISOString(),
      stories: state.stories.map(({audio, ...item}) => ({...item})),
      settings: (({parentPinHash, parentPinSalt, ...rest}) => rest)(settings),
      activity: state.activity
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `hikma-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('#backupStatus').textContent = 'تم تنزيل نسخة المكتبة والإعدادات.';
  }

  // بيرجّع نسخة احتياطية من ملف
  async function importBackup(file) {
    const status = $('#backupStatus');
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      status.textContent = 'حجم النسخة أكبر من 8 ميجابايت.';
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      if (backup.format !== 'hikma-reading-library' || backup.version !== 1 || !Array.isArray(backup.stories) || backup.stories.length > 300) throw new Error('ملف النسخة الاحتياطية غير صالح.');
      const imported = backup.stories.map((item, index) => {
        const title = typeof item.title === 'string' ? item.title.trim().slice(0, 120) : '';
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        if (!title || !text || text.length > 20000 || !['ar', 'en'].includes(item.lang)) throw new Error(`بيانات القصة رقم ${index + 1} غير صالحة.`);
        const id = typeof item.id === 'string' && /^[\w-]{1,100}$/.test(item.id) ? item.id : `story-import-${Date.now()}-${index}`;
        const bookmarkIndex = Number.isInteger(item.bookmark?.index) && item.bookmark.index >= 0 ? item.bookmark.index : null;
        return {
          id,
          title,
          text,
          lang: item.lang,
          translation: typeof item.translation === 'string' ? item.translation.slice(0, 20000) : '',
          icon: typeof item.icon === 'string' ? item.icon.slice(0, 8) : '📖',
          progress: Number.isInteger(item.progress) ? Math.max(0, Math.min(item.progress, 5000)) : 0,
          favorite: !!item.favorite,
          note: typeof item.note === 'string' ? item.note.slice(0, 2000) : '',
          bookmark: bookmarkIndex === null ? null : {index: bookmarkIndex, lang: item.bookmark.lang === 'en' ? 'en' : 'ar'},
          audio: false
        };
      });
      if (!confirm('سيتم استبدال قصصك الشخصية بالنسخة المستوردة. القصص المدمجة ستبقى. هل تريد المتابعة؟')) return;
      const importedBuiltins = new Map(imported.filter(item => item.id.startsWith('seed-')).map(item => [item.id, item]));
      const builtins = state.stories.filter(item => item.id.startsWith('seed-')).map(item => {
        const importedItem = importedBuiltins.get(item.id);
        return importedItem ? {...item, progress: importedItem.progress, favorite: importedItem.favorite, note: importedItem.note, bookmark: importedItem.bookmark} : item;
      });
      const custom = imported.filter(item => !item.id.startsWith('seed-'));
      state.stories = [...builtins, ...custom];
      if (backup.settings && typeof backup.settings === 'object') {
        const restored = backup.settings;
        Object.assign(settings, {
          activated: true,
          age: ['u16', 'o16'].includes(restored.age) ? restored.age : settings.age,
          a11y: typeof restored.a11y === 'boolean' ? restored.a11y : settings.a11y,
          skin: Object.hasOwn(skins, restored.skin) ? restored.skin : settings.skin,
          theme: restored.theme === 'dark' ? 'dark' : 'light',
          stars: Number.isInteger(restored.stars) ? Math.max(0, restored.stars) : settings.stars,
          rate: SPEECH_SETTINGS.clampRate(restored.rate),
          pitch: Number.isFinite(restored.pitch) ? (backup.settings.schemaVersion === 1 ? SPEECH_SETTINGS.clampPitch(restored.pitch) : SPEECH_SETTINGS.clampPitch(12 * Math.log2(Math.max(.01, restored.pitch)))) : settings.pitch,
          arVoice: typeof restored.arVoice === 'string' ? restored.arVoice.slice(0, 200) : settings.arVoice,
          enVoice: typeof restored.enVoice === 'string' ? restored.enVoice.slice(0, 200) : settings.enVoice
        });
      }
      if (backup.activity && typeof backup.activity === 'object') {
        state.activity = {
          completed: Number.isInteger(backup.activity.completed) ? Math.max(0, backup.activity.completed) : 0,
          opened: Number.isInteger(backup.activity.opened) ? Math.max(0, backup.activity.opened) : 0,
          recent: Array.isArray(backup.activity.recent) ? backup.activity.recent.filter(id => state.stories.some(item => item.id === id)).slice(0, 10) : [],
          days: Array.isArray(backup.activity.days) ? backup.activity.days.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)).slice(-90) : []
        };
      }
      save();
      applySkin();
      renderSettings();
      window.renderLibrary();
      status.textContent = `تم استيراد ${custom.length} قصة شخصية. التسجيلات الصوتية لا تنتقل بين الأجهزة.`;
    } catch (error) {
      status.textContent = error.message || 'تعذر قراءة ملف النسخة الاحتياطية.';
    } finally {
      document.querySelector('#importLibrary').value = '';
    }
  }

  // ============================================================
  // رقم الأهل السري (وضع الأطفال): بيقفل الإعدادات. التخزين محلي على الجهاز، يعني ده رادع للأطفال مش حماية قوية.
  // ============================================================
  // بيعمل هاش للرقم مع salt
  async function pinHash(pin, salt) {
    const bytes = new TextEncoder().encode(`${salt}:${pin}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // بيفتح شباك صغير يطلب الرقم، ويرجّع الأرقام اللي اتكتبت أو null لو لغى
  function pinDialog({title, text, confirmField = false, cancellable = true, error = ''}) {
    return new Promise(resolve => {
      const box = document.createElement('div');
      box.className = 'pin-overlay';
      box.innerHTML = `<form class="pin-dialog" role="dialog" aria-modal="true" aria-labelledby="pinTitle"><h2 id="pinTitle">${title}</h2><p>${text}</p><label for="pinInput">الرقم السري (4 إلى 6 أرقام)</label><input id="pinInput" type="password" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" autocomplete="off" required>${confirmField ? '<label for="pinInput2">اكتبه تاني للتأكيد</label><input id="pinInput2" type="password" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" autocomplete="off" required>' : ''}<p class="gate-error" id="pinError" role="alert">${error}</p><div class="gate-actions"><button class="button primary" type="submit">تمام</button>${cancellable ? '<button class="button secondary" type="button" data-pin-cancel>إلغاء</button>' : ''}</div></form>`;
      document.body.appendChild(box);
      const input = box.querySelector('#pinInput');
      input.focus();
      const finish = value => { document.removeEventListener('keydown', onKey, true); box.remove(); resolve(value); };
      const onKey = event => { if (event.key === 'Escape' && cancellable) { event.stopPropagation(); finish(null); } };
      document.addEventListener('keydown', onKey, true);
      box.querySelector('[data-pin-cancel]')?.addEventListener('click', () => finish(null));
      box.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const pin = input.value.trim();
        if (!/^[0-9]{4,6}$/.test(pin)) { box.querySelector('#pinError').textContent = 'الرقم لازم يكون من 4 إلى 6 أرقام.'; return; }
        if (confirmField && box.querySelector('#pinInput2').value.trim() !== pin) { box.querySelector('#pinError').textContent = 'الرقمين مش زي بعض.'; return; }
        finish(pin);
      });
    });
  }
  // بيطلب رقم الأهل ويتأكد منه (بعد 5 محاولات غلط بيقفل دقيقة). بيرجّع true لو صح
  let pinFailures = 0;
  let pinLockedUntil = 0;
  async function askParentPin() {
    if (!settings.parentPinHash) return true;
    let pinError = '';
    for (;;) {
      const wait = Math.ceil((pinLockedUntil - Date.now()) / 1000);
      const pin = await pinDialog({title: 'رقم الأهل', text: wait > 0 ? `محاولات كتير غلط. استنى ${wait} ثانية.` : 'اكتب الرقم السري اللي حطّه الأهل عشان تفتح الإعدادات.', error: pinError});
      if (pin === null) return false;
      if (Date.now() < pinLockedUntil) continue;
      if (await pinHash(pin, settings.parentPinSalt) === settings.parentPinHash) { pinFailures = 0; return true; }
      pinFailures += 1;
      if (pinFailures >= 5) { pinFailures = 0; pinLockedUntil = Date.now() + 60000; }
      // التنبيه جوه النافذة نفسها: التوست بيظهر تحت طبقة الرقم السري ومايبانش.
      pinError = 'الرقم غلط. حاول تاني.';
    }
  }
  // بيخلّي الأهل يحطّوا رقم سري جديد. بيرجّع true لو اتحفظ. (changing=true يطلب الرقم القديم الأول)
  async function setParentPin(changing = false) {
    if (changing && !(await askParentPin())) return false;
    const pin = await pinDialog({title: changing ? 'رقم سري جديد' : 'رقم الأهل', text: 'وضع الأطفال بيقفل الإعدادات برقم سري. حطّ رقم من 4 إلى 6 أرقام وماتنساهوش، مفيش طريقة لاسترجاعه غير إعادة ضبط التطبيق.', confirmField: true, cancellable: changing || Boolean(settings.age)});
    if (pin === null) return false;
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    settings.parentPinSalt = salt;
    settings.parentPinHash = await pinHash(pin, salt);
    save();
    return true;
  }

  // ============================================================
  // القسم 7: بوابة الدخول والتهيئة الأولى (العمر، إمكانية الوصول، كود الدخول)
  // ============================================================
  // ده بتاع رسم شاشات البوابة
  function renderGate() {
    const step = !settings.activated ? 'activate' : !settings.age ? 'age' : settings.a11y === null ? 'access' : null;
    const ready = !step;
    gate.hidden = ready;
    shell.hidden = !ready;
    helperButton.hidden = false;
    if (ready) {
      applySkin();
      syncResponsiveControls();
      return;
    }
    const heading = step === 'activate' ? 'أهلاً بيك في حكمة' : step === 'age' ? 'هل عمرك 16 سنة أو أكثر؟' : 'تحب نفعّل وضع المساعدة؟';
    let content;
    if (step === 'activate') {
      content = `<p>اكتب كود التفعيل اللي معاك للدخول.</p><form id="demoLoginForm"><label for="penCode">كود التفعيل</label><input id="penCode" type="text" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="HKMA-XXXX-XXXX-XXXX" required><p class="gate-error" id="gateError" role="alert"></p><div class="gate-actions"><button class="button primary" type="submit">دخول</button></div></form><p class="voice-note"><a href="/privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a> · <a href="/terms.html" target="_blank" rel="noopener">شروط الاستخدام</a> (مسودة)</p>`;
    } else if (step === 'age') {
      content = `<p>نضبط شكل القراءة والمكافآت على حسب العمر.</p><div class="gate-actions"><button class="button primary" data-age="u16">أقل من 16 سنة</button><button class="button secondary" data-age="o16">16 سنة أو أكثر</button></div>`;
    } else {
      content = `<p>خط أكبر وتباين أوضح وقراءة صوتية لعناصر التطبيق.</p><div class="gate-actions"><button class="button primary" data-a11y="on"><span aria-hidden="true">♿</span> أحتاج مساعدة</button><button class="button secondary" data-a11y="off"><span aria-hidden="true">▶</span> ابدأ بشكل عادي</button></div>`;
    }
    gate.innerHTML = `<section class="gate-panel"><div class="gate-brand"><span>${skins[settings.skin]?.icon || '🦉'}</span>حِكمة</div><h1>${heading}</h1>${content}</section>`;
    syncResponsiveControls();
  }

  // الدخول بكود التفعيل: الفحص كله على السيرفر (/api/activate)، مفيش كود جوه الصفحة
  gate.addEventListener('submit', async event => {
    if (event.target.id !== 'demoLoginForm') return;
    event.preventDefault();
    const code = $('#penCode').value.trim();
    const errorBox = $('#gateError');
    const submit = event.target.querySelector('button[type=submit]');
    submit.disabled = true;
    errorBox.textContent = 'ثانية واحدة...';
    try {
      await api.activate(code);
    } catch (error) {
      errorBox.textContent = error.status === 401 ? 'الكود غلط أو منتهي. اتأكد منه وجرّب تاني.' : (error.message || 'حصلت مشكلة. جرّب تاني.');
      submit.disabled = false;
      return;
    }
    Object.assign(settings, {activated: true, age: null, a11y: null});
    save();
    window.location.href = '/index.html';
  });
  // اختيارات البوابة: العمر وإمكانية الوصول والسكن
  gate.addEventListener('click', async event => {
    const ageChoice = event.target.closest('[data-age]');
    const accessChoice = event.target.closest('[data-a11y]');
    if (ageChoice) {
      if (ageChoice.dataset.age === 'u16' && !settings.parentPinHash) {
        if (!(await setParentPin())) return;
      }
      settings.age = ageChoice.dataset.age;
      save();
      renderGate();
    } else if (accessChoice) {
      settings.a11y = accessChoice.dataset.a11y === 'on';
      save();
      renderGate();
      if (settings.a11y) say('تم تفعيل وضع المساعدة.');
    }
  });

  // ده بتاع أزرار الشريط السفلي في الموبايل
  document.querySelector('.mobile-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-target]');
    if (!button) return;
    const target = button.dataset.target;
    if (target === 'library') document.querySelector('#mainContent').scrollIntoView({behavior: 'smooth'});
    else if (target === 'addOverlay') openModal(target);
    else if (target === 'settingsOverlay') { populateVoices(); openModal(target); }
    else if (target === 'appSettingsOverlay') openAppSettings();
  });

  // أزرار نافذة الإعدادات
  settingsOverlay.addEventListener('click', async event => {
    if (event.target.closest('#exportLibrary')) {
      downloadBackup();
      return;
    }
    const themeButton = event.target.closest('[data-theme-choice]');
    const skinButton = event.target.closest('[data-skin]:not(html)');
    const ageButton = event.target.closest('[data-age-choice]');
    if (themeButton) {
      setTheme(themeButton.dataset.themeChoice);
    } else if (skinButton) {
      settings.skin = skinButton.dataset.skin;
      settings.skinPicked = true;
      save();
      applySkin();
      renderSettings();
      playChime();
    } else if (event.target.closest('#changePin')) {
      if (await setParentPin(true)) say('اتغيّر الرقم السري.');
    } else if (ageButton) {
      if (ageButton.dataset.ageChoice === 'u16' && !settings.parentPinHash && !(await setParentPin())) return;
      settings.age = ageButton.dataset.ageChoice;
      save();
      applySkin();
      renderSettings();
    } else if (event.target.closest('#settingsA11y')) {
      settings.a11y = !settings.a11y;
      save();
      applySkin();
      renderSettings();
    } else if (event.target.closest('#resetApp')) {
      if (!confirm('إعادة ضبط التطبيق وحذف القصص والإعدادات المحفوظة؟')) return;
      speechSynthesis?.cancel();
      state.stories = SEED.map(item => ({...item, progress: 0}));
      Object.assign(settings, {parentPinHash: '', parentPinSalt: '', activated: false, age: null, a11y: null, skin: 'hikma', theme: 'light', stars: 0, arVoice: '', enVoice: '', ...SPEECH_SETTINGS.defaults});
      try { localStorage.removeItem(KEY); } catch {}
      save();
      closeModal('appSettingsOverlay');
      renderLibrary();
      renderGate();
    }
  });
  // بيختار ملف النسخة الاحتياطية
  document.querySelector('#importLibrary').addEventListener('change', event => importBackup(event.target.files?.[0]));

  // ============================================================
  // القسم 8: الصوت الطبيعي والقراءة (تشغيل الصوت، الإيقاف، الاحتفال بنهاية القصة)
  // ============================================================
  // حالة تشغيل الصوت الحالي
  let activeAudio = null;
  let activeAudioUrl = null;
  let audioTimes = [];
  let pendingAudioLine = null;
  let completionHandled = false;
  // ده بتاع واجهة التحكم في القارئ لباقي الملفات
  window.hikmaReader = {
    get story() { return story; },
    get lines() { return lines; },
    get index() { return lineIndex; },
    setIndex(index) {
      lineIndex = Math.max(0, Math.min(lines.length - 1, index));
      renderLines();
      if (story) {
        story.progressByLang = story.progressByLang || {};
        story.progressByLang[lang] = lineIndex;
        story.progress = lineIndex;
        save();
      }
    },
    stop() { stopSpeech(); stopAudio(); },
    playBlob(blob) { return playRecordedStory(blob); }
  };
  // أزرار التحكم في الإشعارات وشاشة القفل
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (activeAudio?.paused) activeAudio.play().catch(() => {});
        else if (settings.voiceSource === 'device') window.startSpeech();
        else speakNaturally();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (activeAudio && !activeAudio.paused) activeAudio.pause();
        else if (speaking) window.toggleSpeech();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    } catch {}
  }

  // ده بتاع تغيير حالة الصفحة أثناء القراءة
  function setReadingState(active) {
    document.body.classList.toggle('hikma-reading', !!active);
  }

  // ده بتاع الاحتفال بنهاية القصة
  function celebrateStory() {
    document.body.classList.remove('hikma-celebrate');
    void document.body.offsetWidth;
    document.body.classList.add('hikma-celebrate');
    setTimeout(() => document.body.classList.remove('hikma-celebrate'), 2600);
    if (settings.reducedMotion) return;
    const burst = document.createElement('div');
    burst.className = 'celebrate-stars';
    burst.setAttribute('aria-hidden', 'true');
    const glyphs = settings.age === 'u16' ? ['⭐', '🌟', '✨', '🎈', '⭐', '✨'] : ['✦', '✧', '✦', '✧'];
    glyphs.forEach((glyph, index) => {
      const star = document.createElement('span');
      star.textContent = glyph;
      const angle = (index / glyphs.length) * Math.PI * 2;
      star.style.transform = `translate(${Math.cos(angle) * 90}px, ${Math.sin(angle) * 60}px)`;
      star.style.animationDelay = `${index * 90}ms`;
      burst.appendChild(star);
    });
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 2400);
  }
  // بيحتفل عند إنهاء قصة
  window.addEventListener('hikma:finished', celebrateStory);

  // ده بتاع إيقاف الصوت الجاري
  function stopAudio() {
    setReadingState(false);
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.src = '';
      activeAudio = null;
    }
    if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
    audioTimes = [];
    pendingAudioLine = null;
  }

  // ده بتاع تشغيل التسجيل البشري المحفوظ
  async function playRecordedStory(blobOverride = null) {
    if (!story) return;
    stopSpeech();
    stopAudio();
    const blob = blobOverride || await getAudio(story.id).catch(() => null);
    if (!blob) {
      toast('التسجيل غير متاح على هذا الجهاز');
      return;
    }
    if (lineIndex >= lines.length - 1) window.hikmaReader.setIndex(0);
    activeAudioUrl = URL.createObjectURL(blob);
    const audio = new Audio(activeAudioUrl);
    activeAudio = audio;
    audio.playbackRate = SPEECH_SETTINGS.clampRate(state.settings.rate);
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.addEventListener('loadedmetadata', () => {
      if (activeAudio !== audio) return;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const weights = lines.map(sentence => sentence.length + 8);
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let elapsed = 0;
        audioTimes = weights.map(weight => {
          const start = audio.duration * elapsed / total;
          elapsed += weight;
          return start;
        });
        audio.currentTime = audioTimes[lineIndex] || 0;
      }
      audio.play().catch(() => {
        if (activeAudio === audio) {
          stopAudio();
          toast('تعذر تشغيل التسجيل');
        }
      });
    }, {once: true});
    audio.ontimeupdate = () => {
      if (activeAudio !== audio || !audioTimes.length) return;
      if (pendingAudioLine !== null) {
        const target = pendingAudioLine;
        pendingAudioLine = null;
        window.hikmaReader.setIndex(target);
        return;
      }
      let index = 0;
      while (index + 1 < audioTimes.length && audioTimes[index + 1] <= audio.currentTime) index++;
      if (index !== lineIndex) window.hikmaReader.setIndex(index);
    };
    audio.onplay = () => {
      $('#playIcon').textContent = 'Ⅱ';
      $('#playPause').setAttribute('aria-label', 'إيقاف مؤقت');
      $('#readerMessage').textContent = 'يُشغّل التسجيل الصوتي.';
    };
    audio.onpause = () => {
      if (activeAudio !== audio || audio.ended) return;
      if (audioTimes.length) audio.currentTime = audioTimes[lineIndex] || 0;
      $('#playIcon').textContent = '▶';
      $('#playPause').setAttribute('aria-label', 'متابعة التسجيل');
      $('#readerMessage').textContent = 'توقفت القراءة عند بداية الجملة الحالية.';
    };
    audio.onended = () => {
      if (activeAudio !== audio) return;
      story.progress = 0;
      save();
      $('#readerMessage').textContent = 'أحسنت! وصلت لنهاية القصة.';
      $('#playIcon').textContent = '↻';
      $('#playPause').setAttribute('aria-label', 'إعادة التسجيل');
      activeAudio = null;
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    };
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('#recordPlay, #playPause, [data-step], #readingText [data-line], [data-close="readerOverlay"]');
    if (!target) return;
    if (target.matches('[data-close="readerOverlay"]')) {
      stopAudio();
      return;
    }
    if (target.id === 'recordPlay') {
      event.preventDefault();
      event.stopImmediatePropagation();
      playRecordedStory();
      return;
    }
    if (!activeAudio) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (target.id === 'playPause') {
      if (activeAudio.paused) activeAudio.play().catch(() => toast('تعذر استئناف التسجيل'));
      else activeAudio.pause();
      return;
    }
    const wasPlaying = !activeAudio.paused;
    const requested = target.matches('[data-step]') ? lineIndex + Number(target.dataset.step) : Number(target.dataset.line);
    if (audioTimes.length) {
      pendingAudioLine = Math.max(0, Math.min(lines.length - 1, requested));
      activeAudio.currentTime = audioTimes[pendingAudioLine] || 0;
    }
    window.hikmaReader.setIndex(requested);
    if (wasPlaying) activeAudio.play().catch(() => toast('تعذر تشغيل التسجيل'));
  }, true);

  // بيغيّر سرعة الصوت أثناء التشغيل
  document.addEventListener('input', event => {
    if (['readerRate', 'globalRate'].includes(event.target.id) && activeAudio) activeAudio.playbackRate = SPEECH_SETTINGS.clampRate(event.target.value);
  });

  // الاهتزاز الخفيف عند الضغط على الأزرار
  document.addEventListener('click', event => {
    if (settings.haptics && event.target.closest('button') && navigator.vibrate) navigator.vibrate(12);
  });
  // بيغيّر نبرة الصوت أثناء التشغيل
  document.addEventListener('change', event => {
    if (!['readerPitch', 'globalPitch'].includes(event.target.id)) return;
    if (settings.voiceSource === 'device' && speaking) {
      stopSpeech();
      window.startSpeech();
    } else if (settings.voiceSource !== 'device' && activeAudio && !activeAudio.paused) {
      stopAudio();
      speakNaturally();
    }
  });

  // اختصارات لوحة المفاتيح في القارئ
  document.addEventListener('keydown', event => {
    if (!document.querySelector('#readerOverlay.open') || event.target.matches('input,textarea,select,[contenteditable=true]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      document.querySelector('#playPause')?.click();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      document.querySelector('[data-step="1"]')?.click();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      document.querySelector('[data-step="-1"]')?.click();
    }
  });

  // ده بتاع اكتشاف نهاية القصة وتسجيل الإنجاز
  new MutationObserver(() => {
    const message = document.querySelector('#readerMessage');
    if (!message || !message.textContent.includes('وصلت لنهاية القصة')) {
      completionHandled = false;
      return;
    }
    if (completionHandled) return;
    completionHandled = true;
    state.activity.completed = Number(state.activity.completed || 0) + 1;
    markReadingDay();
    if (story) {
      state.activity.recent = [story.id, ...(state.activity.recent || []).filter(id => id !== story.id)].slice(0, 10);
    }
    save();
    renderDashboard();
    if (settings.age === 'u16') {
      settings.stars++;
      save();
      updateProfile();
      message.textContent = '🎉 برافو! كسبت نجمة ⭐';
    } else {
      message.textContent = 'خلصت القراءة ✅';
    }
  }).observe(document.querySelector('#readerContent'), {childList: true, characterData: true, subtree: true});

  // زر إمكانية الوصول: تحديث الإعدادات
  document.addEventListener('click', event => {
    if (event.target.closest('#a11yToggle')) requestAnimationFrame(() => {
      settings.a11y = !!settings.a11y;
      save();
      applySkin();
    });
  });
  // بينطق اسم الزر عند التركيز عليه
  document.addEventListener('focusin', event => {
    if ((!settings.a11y && settings.voiceGuidance === false) || !event.target.matches('button,input,textarea,select,a')) return;
    if (document.querySelector('#readerOverlay.open') && speaking) return;
    if (activeAudio && !activeAudio.paused) return;
    const text = event.target.getAttribute('aria-label') || event.target.textContent || event.target.placeholder || '';
    say(text.replace(/\s+/g, ' ').trim());
  });
  // ============================================================
  // القسم 9ب: كود السكن + الشخصية بتتكلم لما تتلمس
  // ============================================================
  // بيفحص كود السكن على السيرفر ولو صح بيفتح السكن ويحوّل الموقع كله له
  settingsOverlay.addEventListener('submit', async event => {
    if (event.target.id !== 'skinCodeForm') return;
    event.preventDefault();
    const input = $('#skinCode');
    const message = $('#skinCodeMsg');
    const submit = event.target.querySelector('button[type=submit]');
    submit.disabled = true;
    message.textContent = 'ثانية واحدة...';
    try {
      const result = await api.redeemSkinCode(input.value.trim());
      if (!skins[result.skin]?.locked) throw new Error('سكن غير معروف.');
      settings.unlockedSkins = Array.from(new Set([...(settings.unlockedSkins || []), result.skin]));
      settings.skin = result.skin;
      settings.skinPicked = true;
      save();
      input.value = '';
      applySkin();
      renderSettings();
      playChime();
      message.textContent = `تم فتح سكن ${skins[result.skin].name}!`;
      say(lines[result.skin]?.[0] || '');
    } catch (error) {
      message.textContent = error.status === 401 ? 'الكود غلط. اتأكد منه وجرّب تاني.' : (error.message || 'حصلت مشكلة. جرّب تاني.');
    } finally {
      submit.disabled = false;
    }
  });
  // لمس الشخصية (أو Enter عليها): بتتحرك وتقول جملة من جمل السكن الحالي
  function mascotSpeak(event) {
    const target = event.target.closest?.('.welcome .owl');
    if (!target || (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    const pool = lines[settings.skin] || lines.hikma;
    settings.mascotTurn = ((settings.mascotTurn || 0) + 1) % pool.length;
    target.classList.remove('mascot-talk');
    void target.getBoundingClientRect();
    target.classList.add('mascot-talk');
    say(pool[settings.mascotTurn]);
  }
  document.addEventListener('click', mascotSpeak);
  document.addEventListener('keydown', mascotSpeak);
  document.addEventListener('pointerdown', announceFirstTouch, {once: true});
  document.addEventListener('keydown', announceFirstTouch, {once: true});
  // ============================================================
  // القسم 9: إمكانية الوصول والتوجيه الصوتي
  // ============================================================
  // بيرحّب الصوتي عند أول لمسة
  function announceFirstTouch() {
    if (!settings.a11y || settings.firstHint || !('speechSynthesis' in window)) return;
    settings.firstHint = true;
    save();
    say('مرحبًا، زر إمكانية الوصول في أسفل الشاشة. اضغطه لتكبير النص وتشغيل المساعدة الصوتية.');
  }

  // بيغيّر حجم الخط وسرعة التوجيه من الإعدادات
  settingsOverlay.addEventListener('input', event => {
    const fields = {
      a11yTextScale: ['textScale', value => Number(value)],
      a11yAnnouncementRate: ['announcementRate', value => SPEECH_SETTINGS.clampRate(value)]
    };
    const field = fields[event.target.id];
    if (!field) return;
    settings[field[0]] = field[1](event.target.value);
    if (event.target.id === 'a11yTextScale') $('#a11yTextScaleValue').value = `${settings.textScale}%`;
    if (event.target.id === 'a11yAnnouncementRate') $('#a11yAnnouncementRateValue').value = `${settings.announcementRate}x`;
    save();
    applySkin();
  });
  // بيغيّر لغة الواجهة والخيارات من الإعدادات
  settingsOverlay.addEventListener('change', event => {
    if (event.target.id === 'uiLanguage') {
      settings.uiLanguage = window.HikmaI18n.setLanguage(event.target.value);
      settings.uiLanguageAuto = false;
      save();
      if (story && window.hikmaSetLanguage && window.HikmaI18n.languages.includes(settings.uiLanguage)) {
        window.hikmaSetLanguage(settings.uiLanguage);
      }
      return;
    }
    const fields = {
      a11yLineSpacing: ['lineSpacing', Number],
      a11yHighContrast: ['highContrast', Boolean],
      a11yDyslexiaFont: ['dyslexiaFont', Boolean],
      a11yReducedMotion: ['reducedMotion', Boolean],
      a11yVoiceGuidance: ['voiceGuidance', Boolean],
      a11ySimpleMode: ['simpleMode', Boolean],
      a11yHaptics: ['haptics', Boolean],
      a11yHighlightStyle: ['highlightStyle', String]
    };
    const field = fields[event.target.id];
    if (!field) return;
    settings[field[0]] = field[1](event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    save();
    applySkin();
  });

  // بيرجّع التركيز لزر الإعدادات بعد إغلاق النافذة
  let dialogReturnFocus = null;
  settingsOverlay.addEventListener('click', event => {
    if (event.target.closest('#settingsOpen')) return;
    if (event.target.closest('[data-close="appSettingsOverlay"]')) {
      dialogReturnFocus?.focus();
      dialogReturnFocus = null;
    }
  });
  document.addEventListener('click', event => {
    if (event.target.closest('#settingsOpen')) dialogReturnFocus = event.target.closest('#settingsOpen');
  }, true);
  // بيحصر زر Tab داخل النافذة المفتوحة
  document.addEventListener('keydown', event => {
    const dialog = document.querySelector('.overlay.open [role="dialog"]');
    if (!dialog || event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(item => item.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // ============================================================
  // القسم 10: الصوت السحابي الطبيعي وتخزين الصوت على الجهاز
  // ============================================================
  // ذاكرة مؤقتة للصوت السحابي
  const cloudCache = new Map();
  let readerSleepTimer = null;

  // بيجيب صوت محفوظ مسبقًا على الجهاز
  async function getSpeechCache(key) {
    const database = await db();
    return new Promise(resolve => {
      const request = database.transaction('speechCache').objectStore('speechCache').get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  // بيحفظ الصوت المولّد على الجهاز مع حد أقصى للحجم
  async function saveSpeechCache(key, blob, words = null) {
    const database = await db();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction('speechCache', 'readwrite');
      transaction.objectStore('speechCache').put({blob, words, createdAt: Date.now()}, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    const entries = await new Promise(resolve => {
      const transaction = database.transaction('speechCache');
      const store = transaction.objectStore('speechCache');
      const valuesRequest = store.getAll();
      const keysRequest = store.getAllKeys();
      transaction.oncomplete = () => resolve(valuesRequest.result.map((item, index) => ({...item, key: keysRequest.result[index]})));
      valuesRequest.onerror = () => resolve([]);
      keysRequest.onerror = () => resolve([]);
    });
    let total = entries.reduce((sum, item) => sum + (item.blob?.size || 0), 0);
    const oldest = entries.sort((a, b) => a.createdAt - b.createdAt);
    while (total > 50 * 1024 * 1024 && oldest.length) {
      const item = oldest.shift();
      total -= item.blob?.size || 0;
      await new Promise(resolve => {
        const transaction = database.transaction('speechCache', 'readwrite');
        transaction.objectStore('speechCache').delete(item.key);
        transaction.oncomplete = resolve;
        transaction.onerror = resolve;
      });
    }
  }

  // ده بتاع تحميل قوائم الأصوات وجمل الاختبار
  async function loadStaticData() {
    updateCloudControls();
    loadVoiceChoices();
  }

  // بيملا قائمة الأصوات السحابية
  async function loadVoiceChoices() {
    const select = document.querySelector('#voiceSource');
    if (!select) return;
    try {
      const [voices, qualityCases] = await Promise.all([
        HikmaData.loadJson('voices.json'),
        HikmaData.loadJson('test-sentences.json')
      ]);
      window.hikmaPublicVoices = voices;
      window.hikmaQualityCases = qualityCases;
      addStaticQualityPreview(qualityCases);
      const consented = voices.filter(voice => voice.consent === true && voice.engineVoiceId);
      voiceSourceField.querySelector('.voice-note').textContent = consented.length
        ? 'تتطلب أصوات الأصدقاء مشغلًا آمنًا غير متاح في النسخة الثابتة.'
        : 'لا توجد أصوات أصدقاء مصرّح بها ومهيأة. الصوت المتاح هو صوت الجهاز.';
    } catch (error) {
      voiceSourceField.querySelector('.voice-note').textContent = `تعذر تحميل voices.json أو test-sentences.json: ${error.message}`;
    }
    const speechConfigured = window.hikmaBackendHealth?.integrations?.speech === 'configured';
    if (speechConfigured && !select.querySelector('option[value="cloud"]')) {
      select.add(new Option('صوت طبيعي عصبي (سحابي)', 'cloud'));
    }
    // One-time: make the natural voice the default for everyone, even if an earlier build pinned the device voice. The user can still switch back in settings.
    if (speechConfigured && !settings.neuralDefaultV2) {
      settings.neuralDefaultV2 = true;
      if (settings.voiceSource === 'device') { settings.voiceSource = 'cloud'; settings.voiceSourcePinned = false; }
    }
    if (speechConfigured && settings.voiceSource === 'device' && !settings.voiceSourcePinned) {
      settings.voiceSource = 'cloud';
    }
    if (!select.querySelector(`option[value="${settings.voiceSource}"]`)) settings.voiceSource = 'device';
    select.value = settings.voiceSource;
    save();
    updateCloudControls();
  }

  // بيجرّب جودة الصوت بجمل جاهزة
  function addStaticQualityPreview(cases) {
    const body = document.querySelector('#settingsOverlay .dialog-body');
    if (!body || body.querySelector('#staticQualityPreview')) return;
    const panel = document.createElement('details');
    panel.id = 'staticQualityPreview';
    panel.className = 'field';
    panel.innerHTML = '<summary>عينات اختبار النطق</summary><label for="qualityLanguage">اللغة</label><select id="qualityLanguage"><option value="ar">العربية</option><option value="en">English</option></select><label for="qualitySentence">الجملة</label><select id="qualitySentence"></select><button class="button secondary" id="playQualitySentence" type="button">استمع بصوت الجهاز</button><p class="voice-note">العينات محمّلة من test-sentences.json. جودة الصوت تعتمد على الجهاز.</p>';
    body.append(panel);
    const language = panel.querySelector('#qualityLanguage');
    const sentence = panel.querySelector('#qualitySentence');
    const populate = () => {
      sentence.replaceChildren(...cases[language.value].map((text, index) => new Option(`${index + 1}. ${text}`, String(index))));
    };
    language.addEventListener('change', populate);
    populate();
    panel.querySelector('#playQualitySentence').addEventListener('click', () => {
      const text = cases[language.value][Number(sentence.value)];
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language.value === 'ar' ? 'ar-EG' : 'en-US';
      utterance.rate = SPEECH_SETTINGS.clampRate(settings.rate);
      speechSynthesis.speak(utterance);
    });
  }
  // بيغيّر مصدر الصوت
  document.querySelector('#voiceSource').addEventListener('change', event => {
    settings.voiceSource = event.target.value;
    settings.voiceSourcePinned = true;
    save();
    updateCloudControls();
  });

  // ده بتاع رسالة حالة الخدمات السحابية
  function cloudStatus(message, isError = false) {
    cloudStatusState = {message, isError};
    const status = document.querySelector('#cloudStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  // بيظهر وإخفاء أدوات الصوت السحابي
  function updateCloudControls() {
    const translateButton = document.querySelector('#translateStory');
    const speechButton = document.querySelector('#neuralSpeech');
    const draftButton = document.querySelector('#translateDraft');
    const offline = !navigator.onLine;
    if (translateButton) {
      translateButton.disabled = offline;
      translateButton.title = offline ? 'الترجمة تحتاج اتصالًا بالإنترنت' : '';
    }
    if (draftButton) {
      draftButton.disabled = offline;
      draftButton.title = offline ? 'الترجمة تحتاج اتصالًا بالإنترنت' : '';
    }
    if (speechButton) speechButton.disabled = false;
    if (speechButton) {
      speechButton.textContent = settings.voiceSource === 'device'
        ? 'قراءة بصوت الجهاز (جودة أقل)'
        : settings.voiceSource.startsWith('friend:')
          ? 'قراءة بصوت الصديق المصرّح به'
          : 'قراءة بالصوت الطبيعي (جودة أعلى)';
    }
    if (!cloudStatusState.message) cloudStatusState.message = 'جارٍ التحقق من الخدمات الخلفية. الترجمة اليدوية وصوت الجهاز متاحان دائمًا.';
    cloudStatus(cloudStatusState.message, cloudStatusState.isError);
  }

  // ============================================================
  // القسم 11: العمل دون اتصال
  // ============================================================
  // بيحسب حجم الصوت المحفوظ
  async function countSpeechCache() {
    try {
      const database = await db();
      return await new Promise(resolve => {
        const request = database.transaction('speechCache').objectStore('speechCache').count();
        request.onsuccess = () => resolve(request.result || 0);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  let offlineBadge = null;
  // شارة «دون اتصال» ورسائل الحالة
  async function updateOfflineUI() {
    const offline = !navigator.onLine;
    document.body.classList.toggle('hikma-offline', offline);
    if (offline && !offlineBadge) {
      offlineBadge = document.createElement('div');
      offlineBadge.className = 'offline-badge';
      offlineBadge.setAttribute('role', 'status');
      offlineBadge.textContent = 'بلا اتصال — القصص المحفوظة والصوت المحفوظ يعملان';
      document.body.appendChild(offlineBadge);
    } else if (!offline && offlineBadge) {
      offlineBadge.remove();
      offlineBadge = null;
    }
    updateCloudControls();
    const offlineInfo = document.querySelector('#offlineInfo');
    if (offlineInfo) {
      const clips = await countSpeechCache();
      const saved = (state.stories || []).length;
      offlineInfo.textContent = offline
        ? `أنت بلا اتصال الآن. على هذا الجهاز: ${saved} قصة و${clips} مقطع صوتي محفوظ — كلها تعمل دون إنترنت.`
        : `على هذا الجهاز: ${saved} قصة و${clips} مقطع صوتي محفوظ. القصص المحفوظة والصوت المحفوظ يعملان دون إنترنت تلقائيًا.`;
    }
  }
  window.addEventListener('online', updateOfflineUI);
  window.addEventListener('offline', updateOfflineUI);

  // ============================================================
  // القسم 12: الترجمة والتشكيل
  // ============================================================
  // ده بتاع ترجمة القصة وحفظ الترجمة
  async function translateStory(to) {
    if (!story || !window.HikmaI18n.languages.includes(to)) return;
    if (to === story.lang) {
      stopSpeech();
      lang = story.lang;
      lineIndex = story.progressByLang?.[lang] || 0;
      window.renderReader();
      return;
    }
    const cached = story.translations?.[to] || (story.translationLang === to ? story.translation : '');
    if (cached) {
      stopSpeech();
      lang = to;
      lineIndex = story.progressByLang?.[lang] || 0;
      window.renderReader();
      cloudStatus('الترجمة المحفوظة لهذه اللغة جاهزة.');
      return;
    }
    cloudStatus('جارٍ طلب الترجمة...');
    try {
      const result = await api.translate(story.text, to);
      const translatedText = String(result.translatedText ?? result.text ?? '');
      if (result.mode === 'demo') {
        const languageSelect = document.querySelector('#readLang');
        if (languageSelect) languageSelect.value = lang === story.lang ? 'original' : lang;
        cloudStatus('الترجمة الخلفية في الوضع التجريبي ولم تُنتج ترجمة. أضفها من محرر الترجمة اليدوي.', true);
        return;
      }
      if (!translatedText.trim()) throw new Error('empty translation');
      story.translations = {...story.translations, [to]: translatedText};
      story.translation = translatedText;
      story.translationLang = to;
      story.translationSources = {...story.translationSources, [to]: 'api'};
      save();
      stopSpeech();
      lang = to;
      lineIndex = 0;
      renderReader();
      cloudStatus('تم تحميل الترجمة من الخدمة الخلفية.');
    } catch (error) {
      cloudStatus(api.toFriendlyMessage(error), true);
    }
  }
  // بيربط ترجمة القصة بالقارئ
  window.hikmaSetLanguage = translateStory;
  // بيجيب النص الأصلي أو المترجم المحفوظ
  function originalReaderText(targetLanguage) {
    if (!story) return '';
    if (targetLanguage === story.lang) return story.text;
    return story.translations?.[targetLanguage] || (story.translationLang === targetLanguage ? story.translation : '');
  }
  // ده بتاع اختيار النص المعروض
  window.hikmaGetReaderText = targetLanguage => {
    const originalText = originalReaderText(targetLanguage);
    const cached = story?.diacritics?.[targetLanguage];
    return story?.diacriticsEnabled && cached?.source === originalText ? cached.text : originalText;
  };

  // ============================================================
  // القسم 13: القراءة بالصوت الطبيعي (تقسيم، تخزين، تشغيل)
  // ============================================================
  // بيقسّم النص لأجزاء قصيرة للتحويل لصوت
  function splitSpeechChunks(text, maxLength = 200) {
    const chunks = [];
    let remaining = String(text).trim();
    while (remaining.length > maxLength) {
      let boundary = remaining.lastIndexOf(' ', maxLength);
      if (boundary < 1) boundary = maxLength;
      chunks.push(remaining.slice(0, boundary).trim());
      remaining = remaining.slice(boundary).trim();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
  }

  // بيولّد مفتاح تخزين الصوت
  async function speechCacheKey(provider, voice, language, text) {
    const payload = JSON.stringify([provider, voice, language, text, settings.rate, settings.pitch]);
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    return `speech-${[...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }

  // بيحوّل الصوت المستلم من السيرفر لملف يمكن تشغيله
  function audioBlobFromBase64(audioBase64, contentType) {
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], {type: contentType || 'audio/mpeg'});
  }

  // بيشغّل أجزاء الصوت الطبيعي مع تمييز الكلمات
  async function playGeneratedAudio(blobs, metaChunks = null) {
    stopSpeech();
    stopAudio();
    let chunkIndex = 0;
    const playChunk = async () => {
      if (chunkIndex >= blobs.length) {
        activeAudio = null;
        if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
        activeAudioUrl = null;
        return;
      }
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = URL.createObjectURL(blobs[chunkIndex]);
      const audio = new Audio(activeAudioUrl);
      activeAudio = audio;
      audio.playbackRate = SPEECH_SETTINGS.clampRate(settings.rate);
      audio.preservesPitch = true;
      audio.webkitPreservesPitch = true;
      const meta = metaChunks?.[chunkIndex];
      setReadingState(true);
      if (meta?.words?.length && window.renderLines) {
        audio.addEventListener('timeupdate', () => {
          if (activeAudio !== audio) return;
          const t = audio.currentTime * 1000;
          let current = null;
          for (const word of meta.words) {
            if (word.offset <= t + 60) current = word;
            else break;
          }
          if (current) window.renderLines(meta.start + current.charIndex);
        });
      }
      audio.addEventListener('ended', () => {
        if (activeAudio !== audio) return;
        chunkIndex++;
        if (chunkIndex < blobs.length) playChunk();
        else finishSentence();
      }, {once: true});
      await audio.play();
    };
    const finishSentence = () => {
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
      activeAudio = null;
      if (lineIndex < lines.length - 1) {
        lineIndex++;
        renderLines();
        saveProgress();
        speakNaturally();
      } else {
        lineIndex = 0;
        saveProgress();
        renderLines();
        setReadingState(false);
        cloudStatus('وصلت إلى نهاية القصة.');
        window.dispatchEvent(new CustomEvent('hikma:finished'));
      }
    };
    await playChunk();
  }

  // ده بتاع زر القراءة بالصوت الطبيعي: يجلب الصوت من الخادم أو من الذاكرة ثم يشغله
  async function speakNaturally() {
    if (!story) return;
    const selectedVoice = settings.voiceSource.startsWith('friend:') ? settings.voiceSource.slice(7) : '';
    const voice = selectedVoice || (lang === 'ar' ? 'neural-ar' : 'neural-en');
    const sourceText = lines[lineIndex] || story.text;
    const chunks = splitSpeechChunks(sourceText);
    const speechHealth = window.hikmaBackendHealth?.integrations?.speech;
    const configuredProvider = window.hikmaBackendHealth?.providers?.speech || 'worker';
    const offline = !navigator.onLine;
    const workerConfigured = !offline && speechHealth === 'configured';
    cloudStatus(offline ? 'بلا اتصال: سيُستخدم الصوت المحفوظ إن وُجد، وإلا صوت الجهاز.' : workerConfigured ? 'جارٍ تجهيز الصوت...' : 'جارٍ التحقق من الصوت الخلفي...');
    try {
      const audioChunks = [];
      const metaChunks = [];
      let resultProvider = 'worker';
      let searchFrom = 0;
      for (const chunk of chunks) {
        const chunkStart = Math.max(0, sourceText.indexOf(chunk, searchFrom));
        searchFrom = chunkStart + chunk.length;
        let cachedEntry = null;
        for (const providerName of [configuredProvider, 'edge']) {
          if (cachedEntry) break;
          const key = await speechCacheKey(providerName, voice, lang, chunk);
          cachedEntry = await getSpeechCache(key);
        }
        let audioBlob = cachedEntry?.blob || null;
        let chunkWords = cachedEntry?.words || null;
        if (!audioBlob) {
          if (offline) {
            cloudStatus('هذا الجزء غير محفوظ بعد؛ يعمل صوت الجهاز بدلًا منه.');
            window.startSpeech();
            return;
          }
          const result = await api.speech(chunk, lang, voice, settings.rate, settings.pitch);
          if (result.mode !== 'configured' || !result.audioBase64) {
            cloudStatus('الصوت الخلفي في الوضع التجريبي؛ يعمل صوت الجهاز بدلًا منه.');
            window.startSpeech();
            return;
          }
          resultProvider = result.provider || resultProvider;
          audioBlob = audioBlobFromBase64(result.audioBase64, result.contentType);
          chunkWords = Array.isArray(result.words) ? result.words : null;
          const finalKey = await speechCacheKey(resultProvider, voice, lang, chunk);
          await saveSpeechCache(finalKey, audioBlob, chunkWords);
        }
        if (chunkWords?.length) {
          let pointer = 0;
          chunkWords = chunkWords.map(word => {
            let charIndex = chunk.indexOf(word.text, pointer);
            if (charIndex === -1) charIndex = chunk.indexOf(word.text);
            if (charIndex >= 0) pointer = charIndex + word.text.length;
            return {...word, charIndex: Math.max(0, charIndex)};
          }).filter(word => word.charIndex >= 0 && chunk.includes(word.text));
        }
        audioChunks.push(audioBlob);
        metaChunks.push({start: chunkStart, text: chunk, words: chunkWords});
      }
      await playGeneratedAudio(audioChunks, metaChunks);
      cloudStatus('يعمل الصوت الخلفي المحفوظ على هذا الجهاز.');
    } catch (error) {
      cloudStatus(`${api.toFriendlyMessage(error)} يعمل صوت الجهاز بدلًا منه.`, true);
      window.startSpeech();
    }
  }

  // ============================================================
  // القسم 14: الضغط على كلمة لمعرفة معناها
  // ============================================================
  // بيشوف أي كلمة ضغط عليها اليوزر
  function wordAtPoint(lineSpan, event) {
    const line = lines[Number(lineSpan.dataset.line)];
    if (!line) return null;
    let node = null;
    let offset = 0;
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (!range) return null;
      node = range.startContainer;
      offset = range.startOffset;
    } else if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (!position) return null;
      node = position.offsetNode;
      offset = position.offset;
    }
    if (!node || node.nodeType !== Node.TEXT_NODE || !lineSpan.contains(node)) return null;
    let absolute = 0;
    const walker = document.createTreeWalker(lineSpan, NodeFilter.SHOW_TEXT);
    let current;
    while ((current = walker.nextNode())) {
      if (current === node) { absolute += offset; break; }
      absolute += current.nodeValue.length;
    }
    if (absolute > line.length) return null;
    const before = line.slice(0, absolute).search(/\S+$/);
    const afterMatch = line.slice(absolute).match(/^\S*/);
    if (before === -1 && !afterMatch?.[0]) return null;
    const start = before === -1 ? absolute : before;
    const end = absolute + (afterMatch?.[0]?.length || 0);
    const word = line.slice(start, Math.max(end, start));
    if (!word || !/\S/.test(word)) return null;
    return {word: word.trim(), start, lineIndex: Number(lineSpan.dataset.line)};
  }

  // ذاكرة مؤقتة لمعاني الكلمات
  const wordCache = new Map();
  try {
    const stored = JSON.parse(localStorage.getItem('hikma-word-cache') || '{}');
    Object.entries(stored).forEach(([key, value]) => wordCache.set(key, value));
  } catch {}

  let wordPop = null;
  // إغلاق فقاعة معنى الكلمة
  function dismissWordPop() {
    wordPop?.remove();
    wordPop = null;
  }

  // ده بتاع عرض معنى الكلمة في فقاعة
  async function showWordMeaning(hit, event) {
    dismissWordPop();
    const targetLang = lang === 'ar' ? 'en' : 'ar';
    const cacheKey = `${hit.word.toLowerCase()}|${lang}|${targetLang}`;
    wordPop = document.createElement('div');
    wordPop.className = 'word-pop';
    wordPop.setAttribute('role', 'status');
    wordPop.innerHTML = `<bdi class="word-pop-word">${hit.word.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))}</bdi><span class="word-pop-meaning">…</span>`;
    document.body.appendChild(wordPop);
    const rect = wordPop.getBoundingClientRect();
    const x = Math.min(Math.max(8, event.clientX - rect.width / 2), window.innerWidth - rect.width - 8);
    const y = event.clientY - rect.height - 12 > 8 ? event.clientY - rect.height - 12 : event.clientY + 18;
    wordPop.style.left = `${x}px`;
    wordPop.style.top = `${y}px`;
    const meaningEl = wordPop.querySelector('.word-pop-meaning');
    const setMeaning = text => { if (wordPop && meaningEl.isConnected) meaningEl.textContent = text; };
    if (wordCache.has(cacheKey)) {
      setMeaning(wordCache.get(cacheKey));
    } else {
      try {
        const result = await api.translate(hit.word, targetLang);
        const text = String(result.translatedText || result.text || '').trim();
        if (text && result.mode !== 'demo') {
          wordCache.set(cacheKey, text);
          const stored = {};
          wordCache.forEach((value, key) => { stored[key] = value; });
          try { localStorage.setItem('hikma-word-cache', JSON.stringify(stored)); } catch {}
          setMeaning(text);
        } else {
          setMeaning('—');
        }
      } catch {
        setMeaning('تعذر جلب المعنى');
      }
    }
    setTimeout(() => {
      document.addEventListener('click', dismissWordPop, {once: true, capture: true});
    }, 50);
    setTimeout(dismissWordPop, 8000);
  }

  // الضغط على الكلمة داخل القصة بيفتح معناها
  document.addEventListener('click', event => {
    const lineSpan = event.target.closest('#readingText [data-line]');
    if (lineSpan) {
      const hit = wordAtPoint(lineSpan, event);
      if (hit) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showWordMeaning(hit, event);
        return;
      }
    }
    if (settings.voiceSource === 'device' || !event.target.closest('#playPause, #readingText [data-line]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    speakNaturally();
  }, true);

  // ============================================================
  // القسم 15: تحسينات نافذة القراءة (أزرار وسرعة وترجمة ومؤقت النوم)
  // ============================================================
  // بيضيف أدوات القارئ: السرعة، الصوت، الترجمة، التشكيل، مؤقت النوم
  function enhanceReader() {
    const panel = document.querySelector('#readerContent .voice-panel');
    if (!panel) return;
    const previousButton = document.querySelector('#readerContent .reader-controls [data-step="-1"]');
    const nextButton = document.querySelector('#readerContent .reader-controls [data-step="1"]');
    if (previousButton && !previousButton.dataset.labeled) {
      previousButton.dataset.labeled = 'true';
      previousButton.innerHTML = '<span aria-hidden="true">‹</span><bdi dir="ltr">Previous</bdi>';
      previousButton.setAttribute('aria-label', 'Previous sentence');
    }
    if (nextButton && !nextButton.dataset.labeled) {
      nextButton.dataset.labeled = 'true';
      nextButton.innerHTML = '<bdi dir="ltr">Next</bdi><span aria-hidden="true">›</span>';
      nextButton.setAttribute('aria-label', 'Next sentence');
    }
    const controls = document.querySelector('#readerContent .reader-controls');
    if (controls && !controls.querySelector('#readerSpeedChip')) {
      const speedGroup = document.createElement('div');
      speedGroup.className = 'reader-speed-group';
      speedGroup.innerHTML = `<button class="button secondary reader-speed-chip" id="readerSpeedChip" type="button" aria-expanded="false">Speed ${Number(settings.rate).toFixed(2)}x</button><div class="reader-speed-presets" id="readerSpeedPresets" hidden><button class="button secondary" type="button" data-speed="0.5">0.5x</button><button class="button secondary" type="button" data-speed="0.75">0.75x</button><button class="button secondary" type="button" data-speed="1">1x</button><button class="button secondary" type="button" data-speed="1.5">1.5x</button><button class="button secondary" type="button" data-speed="2">2x</button></div>`;
      controls.appendChild(speedGroup);
      const chip = speedGroup.querySelector('#readerSpeedChip');
      const presets = speedGroup.querySelector('#readerSpeedPresets');
      chip.addEventListener('click', () => {
        presets.hidden = !presets.hidden;
        chip.setAttribute('aria-expanded', String(!presets.hidden));
      });
      speedGroup.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => {
        window.setRate(Number(button.dataset.speed));
        chip.textContent = `Speed ${Number(settings.rate).toFixed(2)}x`;
        presets.hidden = true;
        chip.setAttribute('aria-expanded', 'false');
      }));
      document.querySelector('#readerRate')?.addEventListener('input', () => {
        chip.textContent = `Speed ${Number(settings.rate).toFixed(2)}x`;
      });
    }
    const tashkeelButton = panel.querySelector('#diacritizeText');
    if (tashkeelButton) {
      const originalText = originalReaderText(lang);
      const cached = story.diacritics?.[lang];
      const enabled = story.diacriticsEnabled && cached?.source === originalText;
      tashkeelButton.textContent = enabled ? 'إيقاف التشكيل' : 'تشكيل النص العربي';
      tashkeelButton.setAttribute('aria-pressed', String(!!enabled));
    }
    const sentenceCounter = document.querySelector('#counter');
    const readerMessage = document.querySelector('#readerMessage');
    if (sentenceCounter) sentenceCounter.setAttribute('aria-live', 'polite');
    if (readerMessage) {
      readerMessage.setAttribute('role', 'status');
      readerMessage.setAttribute('aria-live', 'polite');
    }
    const readerDialog = panel.closest('[role="dialog"]');
    if (readerDialog) {
      readerDialog.lang = lang;
      readerDialog.dir = lang === 'ar' ? 'rtl' : 'ltr';
      const head = readerDialog.querySelector('.dialog-head');
      if (head && !head.querySelector('.reader-owl') && window.originalMascotSvg) {
        const owlWrap = document.createElement('span');
        owlWrap.className = 'reader-owl';
        owlWrap.setAttribute('aria-hidden', 'true');
        owlWrap.innerHTML = window.originalMascotSvg;
        head.insertBefore(owlWrap, head.firstChild);
      }
    }
    if (!panel.querySelector('#sleepTimer')) {
      const timerField = document.createElement('div');
      timerField.className = 'field';
      timerField.innerHTML = '<label for="sleepTimer">مؤقت النوم</label><select id="sleepTimer"><option value="0">إيقاف المؤقت</option><option value="5">5 دقائق</option><option value="15">15 دقيقة</option><option value="30">30 دقيقة</option><option value="60">60 دقيقة</option></select>';
      panel.prepend(timerField);
      timerField.querySelector('#sleepTimer').addEventListener('change', event => {
        clearTimeout(readerSleepTimer);
        const minutes = Number(event.target.value);
        if (!minutes) return;
        readerSleepTimer = setTimeout(() => {
          window.hikmaReader.stop();
          const message = document.querySelector('#readerMessage');
          if (message) message.textContent = 'انتهى مؤقت النوم. تم حفظ موضع القراءة.';
          event.target.value = '0';
        }, minutes * 60 * 1000);
      });
    }
    let languageSelect = panel.querySelector('#readLang');
    if (!languageSelect) {
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = '<label for="readLang">لغة القراءة</label><select id="readLang"></select>';
      panel.insertBefore(field, panel.querySelector('.field'));
      languageSelect = field.querySelector('select');
    }
    languageSelect.innerHTML = `<option value="original">${story.lang === 'ar' ? 'الأصل' : 'Original'}</option>${window.HikmaI18n.languages.map(language => `<option value="${language}">${window.HikmaI18n.languageNames[language]}</option>`).join('')}`;
    languageSelect.value = lang === story.lang ? 'original' : lang;
    if (languageSelect.dataset.cloudBound !== 'true') {
      languageSelect.dataset.cloudBound = 'true';
      languageSelect.addEventListener('change', event => {
        event.stopImmediatePropagation();
        translateStory(event.target.value === 'original' ? story.lang : event.target.value);
      }, true);
    }
    if (!panel.querySelector('#cloudVoiceTools')) {
      const tools = document.createElement('div');
      tools.id = 'cloudVoiceTools';
      tools.className = 'cloud-voice-tools';
      tools.innerHTML = '<button class="button primary" id="neuralSpeech" type="button">قراءة بصوت الجهاز</button><button class="button secondary" id="diacritizeText" type="button">تشكيل النص العربي</button><p class="voice-note">تُرسل الطلبات إلى الخدمة الخلفية؛ عند غيابها يبقى صوت الجهاز والتحرير اليدوي متاحين.</p><details id="translationEditor"><summary>تحرير الترجمة يدويًا</summary><div class="field"><label for="translationText">النص المترجم</label><textarea id="translationText" maxlength="20000"></textarea></div><button class="button secondary" id="saveTranslation" type="button">حفظ الترجمة</button></details><p class="voice-note" id="cloudStatus" role="status" aria-live="polite"></p>';
      panel.insertBefore(tools, panel.querySelector('#recordOpen'));
      tools.querySelector('#neuralSpeech').addEventListener('click', speakNaturally);
      tools.querySelector('#diacritizeText').addEventListener('click', async () => {
        const source = originalReaderText(lang);
        if (!source) return cloudStatus('أضف النص أو الترجمة أولًا.', true);
        const cached = story.diacritics?.[lang];
        if (story.diacriticsEnabled && cached?.source === source) {
          story.diacriticsEnabled = false;
          save();
          window.renderReader();
          enhanceReader();
          cloudStatus('تم إيقاف التشكيل وعرض النص الأصلي.');
          return;
        }
        if (cached?.source === source) {
          story.diacriticsEnabled = true;
          save();
          window.renderReader();
          enhanceReader();
          cloudStatus('تم عرض التشكيل المحفوظ.');
          return;
        }
        cloudStatus('جارٍ تشكيل النص...');
        try {
          const result = await api.diacritize(source);
          const shapedText = String(result.text || '');
          if (!shapedText) throw new Error('empty diacritization');
          if (result.mode !== 'configured') {
            cloudStatus('التشكيل غير مهيأ. احتفظنا بالنص الأصلي دون تغيير.', true);
            return;
          }
          story.diacritics = {...story.diacritics, [lang]: {source, text: shapedText}};
          story.diacriticsEnabled = true;
          save();
          window.renderReader();
          enhanceReader();
          cloudStatus('تم تشكيل النص وحفظه على هذا الجهاز.');
        } catch (error) {
          cloudStatus(api.toFriendlyMessage(error), true);
        }
      });
      tools.querySelector('#saveTranslation').addEventListener('click', () => {
        const target = lang === story.lang ? (story.lang === 'ar' ? 'en' : 'ar') : lang;
        const text = tools.querySelector('#translationText').value.trim();
        if (!text) return cloudStatus('اكتب الترجمة قبل حفظها.', true);
        story.translations = {...story.translations, [target]: text};
        story.translation = text;
        story.translationLang = target;
        story.translationSources = {...story.translationSources, [target]: 'manual'};
        save();
        cloudStatus('تم حفظ الترجمة يدويًا.');
      });
    }
    panel.querySelector('#translationText').value = story.translations?.[lang] || story.translation || '';
    updateCloudControls();
    if (!panel.querySelector('#readerSavedTools')) {
      const savedTools = document.createElement('details');
      savedTools.id = 'readerSavedTools';
      savedTools.className = 'reader-saved-tools';
      savedTools.innerHTML = '<summary>علامة وملحوظة للقصة</summary><p class="data-note">اختصارات: المسافة تشغيل/إيقاف، والأسهم للتنقل بين الجمل.</p><button class="button secondary" id="bookmarkSave" type="button">حفظ موضعي الحالي</button><button class="button secondary" id="bookmarkGo" type="button">الانتقال للعلامة المحفوظة</button><div class="field"><label for="storyNote">ملاحظتي</label><textarea id="storyNote" maxlength="2000" placeholder="اكتب ملاحظة لهذه القصة..."></textarea></div><button class="button secondary" id="storyNoteSave" type="button">حفظ الملاحظة</button><p class="status" id="savedReaderStatus" role="status"></p>';
      panel.insertBefore(savedTools, panel.querySelector('#recordOpen'));
      savedTools.querySelector('#bookmarkSave').addEventListener('click', () => {
        story.bookmark = {index: window.hikmaReader.index, lang};
        save();
        savedTools.querySelector('#savedReaderStatus').textContent = `تم حفظ العلامة عند الجملة ${story.bookmark.index + 1}.`;
      });
      savedTools.querySelector('#bookmarkGo').addEventListener('click', () => {
        if (!story.bookmark) return;
        if (story.bookmark.lang !== lang) {
          lang = story.bookmark.lang;
          window.renderReader();
        }
        window.hikmaReader.setIndex(story.bookmark.index);
        document.querySelector('#readerSavedTools #savedReaderStatus').textContent = 'انتقلت إلى العلامة المحفوظة.';
      });
      savedTools.querySelector('#storyNote').value = story.note || '';
      savedTools.querySelector('#storyNoteSave').addEventListener('click', () => {
        story.note = savedTools.querySelector('#storyNote').value.trim();
        save();
        savedTools.querySelector('#savedReaderStatus').textContent = story.note ? 'تم حفظ ملاحظتك على هذا الجهاز.' : 'تم حذف الملاحظة.';
      });
    }
  }

  // ده بتاع مراقبة نافذة القراءة وإعادة تحسينها كلما اتغيرت
  const readerObserver = new MutationObserver(enhanceReader);
  readerObserver.observe(document.querySelector('#readerContent'), {childList: true});

  // ============================================================
  // القسم 16: إضافة القصص (من صورة أو رابط أو PDF)
  // ============================================================
  // هنا: أدوات الإضافة: قراءة نص من صورة، استيراد رابط، ملف PDF
  function addStaticStoryTools() {
    const storyForm = document.querySelector('#storyForm');
    if (!storyForm || storyForm.querySelector('#staticOcrImage')) return;
    const tools = document.createElement('div');
    tools.className = 'field';
    tools.innerHTML = '<section id="urlImportTools"><h3>استيراد قصة من رابط</h3><p class="data-note">Only add content you are allowed to read. It stays private to you.</p><label for="storyUrl">رابط القصة</label><input id="storyUrl" type="url" inputmode="url" placeholder="https://example.org/story"><button class="button secondary" id="previewUrlStory" type="button">معاينة القصة</button><div id="urlPreviewPanel" hidden><label for="urlPreviewTitle">العنوان</label><input id="urlPreviewTitle" type="text"><label for="urlPreviewText">راجع النص واحذف الفقرات غير المطلوبة</label><textarea id="urlPreviewText" maxlength="100000"></textarea><p id="urlPreviewMeta" class="data-note"></p><button class="button primary" id="saveUrlStory" type="button">إضافة وبدء القراءة</button></div><button class="button secondary" id="copySendToHikma" type="button">نسخ علامة Send to Hikma</button><button class="button secondary" id="translateDraftButton" type="button">ترجمة النص تلقائيًا</button><button class="button secondary" id="pasteSendToHikma" type="button">لصق النص المستخرج</button><p id="urlImportStatus" class="status" role="status" aria-live="polite"></p></section><div class="divider"></div><label for="staticOcrImage">استخراج نص من صورة على هذا الجهاز</label><button class="button secondary" id="staticOcrButton" type="button">اختيار صورة صفحة</button><input id="staticOcrImage" type="file" accept="image/*" hidden><p class="status" id="staticOcrStatus" role="status" aria-live="polite">قراءة النص من الصورة تتم على جهازك وتعمل في كل المتصفحات.</p>';
    storyForm.prepend(tools);
    const urlStatus = tools.querySelector('#urlImportStatus');
    tools.querySelector('#translateDraftButton').addEventListener('click', async () => {
      const sourceText = document.querySelector('#storyText').value.trim();
      if (!sourceText) return urlStatus.textContent = 'اكتب أو امسح نص القصة أولًا.';
      const target = /[\u0600-\u06FF]/.test(sourceText) ? 'en' : 'ar';
      urlStatus.textContent = 'جارٍ الترجمة بالسياق...';
      try {
        const result = await api.translate(sourceText, target);
        const translated = String(result.translatedText || '').trim();
        if (result.mode === 'demo' || !translated || translated === sourceText) {
          urlStatus.textContent = 'الترجمة السحابية غير مهيأة بعد؛ أضف مفتاح الترجمة أو اكتب الترجمة يدويًا.';
          return;
        }
        document.querySelector('#storyTranslation').value = translated;
        urlStatus.textContent = 'تمت الترجمة بالسياق. راجعها قبل الحفظ.';
      } catch (error) {
        urlStatus.textContent = api.toFriendlyMessage(error);
      }
    });
    const previewPanel = tools.querySelector('#urlPreviewPanel');
    const bookmarklet = `javascript:(()=>{const r=document.querySelector('article')||document.querySelector('main')||document.body;const p=[...r.querySelectorAll('p')].map(x=>x.innerText.trim()).filter(Boolean);navigator.clipboard.writeText(JSON.stringify({title:document.title,text:p.join('\\n\\n')})).then(()=>alert('Story copied for Hikma.')).catch(()=>alert('Copy the story text manually.'));})();`;
    tools.querySelector('#copySendToHikma').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bookmarklet);
        urlStatus.textContent = 'انسخ العلامة إلى شريط الإشارات. عند استخدامها على صفحة القصة، انسخ النص ثم الصقه هنا.';
      } catch {
        urlStatus.textContent = 'تعذر نسخ العلامة تلقائيًا. افتحها من HTTPS أو الصق نص القصة يدويًا.';
      }
    });
    tools.querySelector('#pasteSendToHikma').addEventListener('click', async () => {
      try {
        const copied = await navigator.clipboard.readText();
        let imported;
        try { imported = JSON.parse(copied); } catch { imported = {title: 'قصة مستوردة', text: copied}; }
        tools.querySelector('#urlPreviewTitle').value = String(imported.title || '').slice(0, 240);
        tools.querySelector('#urlPreviewText').value = String(imported.text || '').slice(0, 100000);
        tools.querySelector('#urlPreviewMeta').textContent = 'راجِع النص واحذف أي قوائم أو محتوى خارج القصة.';
        previewPanel.hidden = false;
      } catch {
        urlStatus.textContent = 'تعذر قراءة الحافظة. الصق نص القصة في حقل النص يدويًا.';
        tools.querySelector('#urlPreviewTitle').value = 'قصة مستوردة';
        previewPanel.hidden = false;
        tools.querySelector('#urlPreviewText').focus();
      }
    });
    tools.querySelector('#previewUrlStory').addEventListener('click', async () => {
      const sourceUrl = tools.querySelector('#storyUrl').value.trim();
      if (!sourceUrl) return urlStatus.textContent = 'أدخل رابط القصة أولًا.';
      urlStatus.textContent = 'جارٍ جلب معاينة آمنة...';
      try {
        const result = await api.importUrl(sourceUrl);
        if (result.mode === 'demo') {
          urlStatus.textContent = 'استيراد الرابط يتطلب API مهيأ. استخدم علامة Send to Hikma أو الصق النص.';
          return;
        }
        const preview = result.preview || {};
        tools.querySelector('#urlPreviewTitle').value = preview.title || '';
        tools.querySelector('#urlPreviewText').value = preview.text || '';
        tools.querySelector('#urlPreviewMeta').textContent = preview.needsClientRender
          ? 'هذه الصفحة تعتمد على JavaScript. استخدم علامة Send to Hikma أو الصق النص.'
          : `${preview.wordCount || 0} كلمة · ${preview.paragraphs || 0} فقرة · ${preview.language || 'unknown'}`;
        previewPanel.hidden = false;
        urlStatus.textContent = result.note || 'راجِع النص قبل إضافته.';
      } catch (error) {
        urlStatus.textContent = api.toFriendlyMessage(error);
      }
    });
    tools.querySelector('#saveUrlStory').addEventListener('click', () => {
      const title = tools.querySelector('#urlPreviewTitle').value.trim() || 'قصة مستوردة';
      const text = tools.querySelector('#urlPreviewText').value.trim();
      if (!text) return urlStatus.textContent = 'المعاينة لا تحتوي نصًا. استخدم العلامة أو الصق النص.';
      const importedStory = {id: `url-${Date.now()}`, title, text, lang: arabic(text) ? 'ar' : (settings.uiLanguage || 'en'), translations: {}, progress: 0, icon: '📖', source: 'url-private'};
      state.stories.unshift(importedStory);
      save();
      window.renderLibrary();
      closeModal('addOverlay');
      chooseStory(importedStory.id);
    });
    const status = tools.querySelector('#staticOcrStatus');
    tools.querySelector('#staticOcrButton').addEventListener('click', () => {
      tools.querySelector('#staticOcrImage').click();
    });
    tools.querySelector('#staticOcrImage').addEventListener('change', async event => {
      const image = event.target.files?.[0];
      if (!image) return;
      try {
        status.textContent = 'جارٍ قراءة النص من الصورة (أول مرة تحمّل قارئ النص)...';
        const Tesseract = await globalThis.HikmaScanner.loadTesseract();
        const result = await Tesseract.recognize(URL.createObjectURL(image), 'ara+eng');
        const text = String(result?.data?.text || '').trim();
        if (!text) throw new Error('لم يُعثر على نص واضح في الصورة.');
        const storyText = document.querySelector('#storyText');
        storyText.value = [storyText.value, text].filter(Boolean).join('\n\n');
        status.textContent = 'تم استخراج النص محليًا. راجعه وصحح الأخطاء قبل الحفظ.';
      } catch (error) {
        status.textContent = error.message || 'تعذر استخراج النص من الصورة.';
      } finally {
        event.target.value = '';
      }
    });

    const pdfTools = document.createElement('section');
    pdfTools.className = 'field';
    pdfTools.id = 'pdfImportTools';
    pdfTools.innerHTML = '<h3>استيراد كتاب PDF على هذا الجهاز</h3><label for="pdfFile">ملف PDF (حتى 50 ميغابايت و1000 صفحة)</label><input id="pdfFile" type="file" accept="application/pdf,.pdf"><label for="pdfReadMode">طريقة القراءة</label><select id="pdfReadMode"><option value="prose">Prose only</option><option value="all">Read everything</option></select><button class="button secondary" id="parsePdf" type="button">استخراج الفصول</button><p id="pdfImportStatus" class="status" role="status" aria-live="polite"></p><div id="pdfChapterPanel" hidden><label for="pdfChapterSelect">الفصل</label><select id="pdfChapterSelect"></select><button class="button primary" id="savePdfChapter" type="button">إضافة الفصل وبدء القراءة</button></div>';
    tools.after(pdfTools);
    const pdfFile = pdfTools.querySelector('#pdfFile');
    const pdfStatus = pdfTools.querySelector('#pdfImportStatus');
    const chapterPanel = pdfTools.querySelector('#pdfChapterPanel');
    let parsedPdf = null;
    pdfTools.querySelector('#parsePdf').addEventListener('click', async () => {
      const file = pdfFile.files?.[0];
      if (!file) { pdfStatus.textContent = 'اختر ملف PDF أولًا.'; return; }
      pdfStatus.textContent = 'جارٍ فحص الملف واستخراج النص صفحة بصفحة...';
      try {
        parsedPdf = await window.HikmaPdf.parse(file, {
          mode: pdfTools.querySelector('#pdfReadMode').value,
          onProgress: progress => { pdfStatus.textContent = `استخراج الصفحة ${progress.page} من ${progress.pages} (${progress.percent}%).`; }
        });
        const select = pdfTools.querySelector('#pdfChapterSelect');
        select.replaceChildren(...parsedPdf.chapters.map((chapter, index) => new Option(`${index + 1}. ${chapter.title} · ص ${chapter.page}`, String(index))));
        chapterPanel.hidden = false;
        pdfStatus.textContent = parsedPdf.needsOcr
          ? `تم استخراج ${parsedPdf.pages} صفحة. بعض الصفحات ممسوحة ضوئيًا؛ OCR العربي/الإنجليزي غير مهيأ في هذا الإصدار.`
          : `تم استخراج ${parsedPdf.chapters.length} فصلًا من ${parsedPdf.pages} صفحة. لم يتم رفع ملف PDF.`;
      } catch (error) {
        pdfStatus.textContent = error.message || 'تعذر تحليل ملف PDF.';
      }
    });
    pdfTools.querySelector('#savePdfChapter').addEventListener('click', () => {
      const chapter = parsedPdf?.chapters[Number(pdfTools.querySelector('#pdfChapterSelect').value)];
      if (!chapter?.text?.trim()) { pdfStatus.textContent = 'هذا الفصل لا يحتوي نصًا قابلًا للاستخراج.'; return; }
      const importedStory = {id: `pdf-${Date.now()}`, title: `${parsedPdf.title} · ${chapter.title}`, text: chapter.text, lang: arabic(chapter.text) ? 'ar' : (settings.uiLanguage || 'en'), progress: 0, icon: '📖', source: 'pdf-local'};
      state.stories.unshift(importedStory);
      save();
      window.renderLibrary();
      closeModal('addOverlay');
      chooseStory(importedStory.id);
      toast('أُضيف الفصل محليًا. لم يتم حفظ ملف PDF.');
    });
  }

  // ============================================================
  // القسم 17: التشغيل الأولي (يُنفذ عند فتح الصفحة)
  // ============================================================
  document.querySelector('#storyForm').addEventListener('reset', () => setTimeout(addStaticStoryTools));
  addStaticStoryTools();
  loadStaticData();
  updateOfflineUI();
  renderGate();
  window.renderLibrary();
  refreshBackendHealth();
  renderDashboard();
})();
