// ============================================================
// الإتاحة: وضع عسر القراءة، مسطرة التركيز، التحكم بالمفتاح الواحد (مسح تلقائي للأزرار)
// ============================================================
(() => {
  'use strict';
  const HX = window.HX;
  const P = () => HX.prefs;
  const root = document.documentElement;
  // بيطبّق الإعدادات المحفوظة على الصفحة
  function apply() {
    root.dataset.dyslexia = P().dyslexia ? 'on' : 'off';
    root.dataset.dyslexiaTint = P().dyslexiaTint || 'cream';
    root.dataset.focusMode = P().focusMode ? 'on' : 'off';
    root.dataset.contrast = P().contrast || 'off';
    root.dataset.switchScan = P().switchScan ? 'on' : 'off';
    if (P().switchScan) startScan(); else stopScan();
  }

  // ---------- مسح المفتاح الواحد ----------
  let timer = null, items = [], idx = -1;
  function currentScope() {
    const open = [...document.querySelectorAll('.overlay.open')];
    return open.length ? open[open.length - 1].querySelector('.dialog') || open[open.length - 1] : document.querySelector('.shell');
  }
  function collect() {
    const scope = currentScope();
    return [...scope.querySelectorAll('button, [role=button], a[href], select, input:not([type=hidden]), textarea, [data-open]')].filter(el => !el.disabled && el.offsetParent !== null && el.getBoundingClientRect().width > 0 && !el.closest('[hidden]'));
  }
  function clearMark() { document.querySelectorAll('.hx-scan-focus').forEach(el => el.classList.remove('hx-scan-focus')); }
  function tick() {
    clearMark();
    items = collect();
    if (!items.length) return;
    idx = (idx + 1) % items.length;
    const el = items[idx];
    el.classList.add('hx-scan-focus');
    el.scrollIntoView({block: 'nearest'});
    el.focus({preventScroll: true});
  }
  function startScan() {
    stopScan(true);
    const ms = (P().scanSpeed || 2) * 1000;
    timer = setInterval(tick, ms);
    document.body.classList.add('hx-scanning');
  }
  function stopScan(keep) { clearInterval(timer); timer = null; clearMark(); idx = -1; if (!keep) document.body.classList.remove('hx-scanning'); }
  // المفتاح (مسافة أو Enter) بيضغط على العنصر المميّز
  document.addEventListener('keydown', e => {
    if (!P().switchScan || (e.key !== ' ' && e.key !== 'Enter')) return;
    const el = document.querySelector('.hx-scan-focus');
    if (!el) return;
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target !== el) return;
    e.preventDefault();
    e.stopPropagation();
    if (el.tagName === 'SELECT') { const o = el.selectedIndex + 1; el.selectedIndex = o % el.options.length; el.dispatchEvent(new Event('change', {bubbles: true})); } else el.click();
    idx = -1; // بعد الاختيار بنبدأ المسح من أول النافذة
  }, true);

  // ---------- نافذة الإتاحة ----------
  function open() {
    const p = P();
    HX.dialog('hxAccess', 'سهولة القراءة والاستخدام', `
      <div class="hx-switches">
        <label class="hx-switch"><input type="checkbox" id="hxDys" ${p.dyslexia ? 'checked' : ''}><span><strong>وضع عسر القراءة</strong><em>مسافات أوسع بين الحروف والكلمات وخلفية هادئة وسطر واحد في كل مرة.</em></span></label>
        <div class="hx-field" ${p.dyslexia ? '' : 'hidden'} id="hxTintBox"><label for="hxTint">لون الخلفية</label><select id="hxTint"><option value="cream">كريمي</option><option value="blue">أزرق فاتح</option><option value="green">أخضر فاتح</option><option value="peach">وردي فاتح</option></select></div>
        <label class="hx-switch"><input type="checkbox" id="hxFocus" ${p.focusMode ? 'checked' : ''}><span><strong>مسطرة التركيز</strong><em>بتظلّل كل الجمل ما عدا الجملة اللي بتقراها.</em></span></label>
        <div class="hx-field"><label for="hxContrast">تباين عالي</label><select id="hxContrast"><option value="off">عادي</option><option value="light">تباين عالي فاتح (أسود على أبيض)</option><option value="dark">تباين عالي داكن (أصفر على أسود)</option></select></div>
        <label class="hx-switch"><input type="checkbox" id="hxAnnounce" ${p.announce ? 'checked' : ''}><span><strong>إعلان الجملة لقارئ الشاشة</strong><em>لو بتستخدم قارئ شاشة (NVDA أو VoiceOver أو TalkBack)، الجملة الحالية بتتقرأ تلقائيًا أثناء التنقل.</em></span></label>
        <label class="hx-switch"><input type="checkbox" id="hxScan" ${p.switchScan ? 'checked' : ''}><span><strong>التحكم بزر واحد</strong><em>التطبيق بيعدّي على الأزرار واحد واحد، وتضغط مسافة أو Enter (أو أي زر موصّل بالكيبورد) لاختيار الزر المميّز.</em></span></label>
        <div class="hx-field" ${p.switchScan ? '' : 'hidden'} id="hxScanBox"><label for="hxScanSpeed">سرعة المسح</label><select id="hxScanSpeed"><option value="1.2">سريع (١٫٢ ثانية)</option><option value="2">متوسط (٢ ثانية)</option><option value="3.5">بطيء (٣٫٥ ثانية)</option></select></div>
      </div>
      <p class="voice-note">اختصارات الكيبورد في القارئ: مسافة للتشغيل، الأسهم للجمل، Esc للإغلاق.</p>`);
    document.getElementById('hxContrast').value = p.contrast || 'off';
    document.getElementById('hxTint').value = p.dyslexiaTint || 'cream';
    document.getElementById('hxScanSpeed').value = String(p.scanSpeed || 2);
    HX.open('hxAccess');
  }
  document.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'hxDys') { P().dyslexia = e.target.checked; document.getElementById('hxTintBox').hidden = !e.target.checked; }
    else if (id === 'hxTint') P().dyslexiaTint = e.target.value;
    else if (id === 'hxContrast') P().contrast = e.target.value;
    else if (id === 'hxAnnounce') P().announce = e.target.checked;
    else if (id === 'hxFocus') P().focusMode = e.target.checked;
    else if (id === 'hxScan') { P().switchScan = e.target.checked; document.getElementById('hxScanBox').hidden = !e.target.checked; if (e.target.checked) HX.toast('التحكم بزر واحد شغال'); }
    else if (id === 'hxScanSpeed') P().scanSpeed = Number(e.target.value);
    else return;
    HX.save(); apply();
  });
  HX.features.push({id: 'access', icon: '♿', name: 'سهولة القراءة', sub: 'عسر القراءة، التركيز، زر واحد', order: 5, open});
  HX.addReaderTool({id: 'focus', icon: '🔦', label: 'تركيز', order: 20, onClick: (s, b) => { P().focusMode = !P().focusMode; HX.save(); apply(); b.setAttribute('aria-pressed', String(!!P().focusMode)); }});
  // أزرار السابق والتالي: الاسم المسموع لازم يحتوي على النص الظاهر
  HX.on('barmounted', () => document.querySelectorAll('#readerContent [data-step]').forEach(b => b.removeAttribute('aria-label')));
  HX.on('barmounted', ({detail}) => detail.bar.querySelector('[data-hx-tool=focus]')?.setAttribute('aria-pressed', String(!!P().focusMode)));
  apply();
})();
