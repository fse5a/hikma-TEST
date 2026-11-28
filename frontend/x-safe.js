// ============================================================
// دفعة ٨: الأمان والخصوصية (على الجهاز، من غير حساب ولا فلوس):
//  "خصوصيتي": إيه المتخزن على الجهاز، وإيه اللي بيخرج منه، ومسح كل البيانات بخطوتين.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  const sizeKb = () => { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } return Math.round(n * 2 / 1024); };
  HX.privacyInventory = async () => {
    let dbs = [];
    try { dbs = (await indexedDB.databases?.()) || []; } catch {}
    return {stories: state.stories.length, kb: sizeKb(), dbs: dbs.map(d => d.name).filter(Boolean), profiles: (HX.X?.profiles || []).length};
  };
  HX.eraseEverything = async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    try { const dbs = (await indexedDB.databases?.()) || []; await Promise.all(dbs.map(d => new Promise(r => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }))); } catch {}
    try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch {}
    try { const rs = await navigator.serviceWorker?.getRegistrations?.(); await Promise.all((rs || []).map(r => r.unregister())); } catch {}
  };
  async function openPrivacy() {
    const inv = await HX.privacyInventory();
    HX.dialog('hxPrivacy', 'خصوصيتي', `
      <p class="hx-moral-text" role="status">كل قصصك وتقدّمك محفوظين على الجهاز ده بس.</p>
      <ul class="hx-list" style="padding-inline-start:18px">
        <li>${inv.stories} قصة، ${inv.profiles || 1} ملف، حوالي ${inv.kb} كيلوبايت إعدادات وتقدّم.</li>
        <li>التسجيلات والذكريات الصوتية: ${inv.dbs.length ? 'محفوظة محليًا' : 'مفيش'}.</li>
      </ul>
      <h3>إيه اللي بيخرج من الجهاز؟</h3>
      <ul class="hx-list" style="padding-inline-start:18px">
        <li>الكلمة أو الجملة اللي تضغط عليها لمعناها: بتتبعت لخدمة ترجمة مجانية لو ترجمة الجهاز مش متاحة.</li>
        <li>جملة القراءة بالصوت الطبيعي: بتتبعت لخادم الموقع علشان يتحوّل لصوت.</li>
        <li>صور الكاميرا والمسح: لأ، بتتقرأ على الجهاز وما بتخرجش.</li>
        <li>مفيش إعلانات ولا تتبّع ولا حساب بريد.</li>
      </ul>
      <h3>مسح كل بياناتي</h3>
      <p class="hx-muted">هتمسح القصص والتقدّم والتسجيلات والإعدادات من الجهاز ده، ومفيش رجوع. اعمل نسخة احتياطية الأول من الإعدادات لو عايز.</p>
      <label class="hx-row"><input type="checkbox" id="hxEraseOk"> فاهم إن ده نهائي</label>
      <button type="button" class="button secondary" id="hxEraseGo" disabled>امسح كل حاجة</button>`);
    HX.open('hxPrivacy');
  }
  document.addEventListener('change', e => { if (e.target.id === 'hxEraseOk') { const b = document.getElementById('hxEraseGo'); if (b) b.disabled = !e.target.checked; } });
  document.addEventListener('click', async e => {
    const b = e.target.closest('#hxEraseGo'); if (!b || b.disabled) return;
    b.disabled = true; b.textContent = 'جارٍ المسح...';
    await HX.eraseEverything();
    location.reload();
  });
  HX.features.push({id: 'privacy', icon: '🔒', name: 'خصوصيتي', sub: 'إيه المحفوظ وإيه اللي بيخرج', order: 40, open: openPrivacy});
})();
