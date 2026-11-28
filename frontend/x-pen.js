// ============================================================
// شاشات تجربة القلم (٤ فئات). القلم نفسه لسه تحت التطوير: دي محاكاة على الشاشة بس، ومفيش جهاز متوصل.
// كل شاشة عليها علامة "تجربة، القلم تحت التطوير". مفيش صوت ولا شبكة.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const TAG = 'تجربة، القلم تحت التطوير';
  const SAMPLE = 'الشمس بتطلع كل يوم من الشرق.';
  const AUD = {
    kid: {name: 'طفل', icon: '🧒', what: 'القلم بيلمس الكلمة والطفل بيشوف معناها بشكل بسيط وبيشجعه بنجمة.', demo: 'شمس', out: 'شمس: النجمة الكبيرة اللي بتنوّر النهار. ⭐ أحسنت!'},
    blind: {name: 'مكفوف', icon: '🦯', what: 'القلم يلمس السطر فيقرا النص بصوت، والاهتزاز يقوله وصل لآخر السطر.', demo: 'السطر الأول', out: 'هنا القلم هيقرا السطر بصوت. في التجربة دي بنعرض النص بس، من غير صوت.'},
    student: {name: 'طالب', icon: '🎓', what: 'القلم يلمس كلمة صعبة فتتسجل في «كلماتي» مع معناها للمراجعة بعدين.', demo: 'الشرق', out: 'الشرق: الجهة اللي الشمس بتطلع منها. اتضافت لكلماتي (تجربة).'},
    school: {name: 'مدرسة', icon: '🏫', what: 'المعلم يشوف ملخص قراءة الفصل من غير ما أي بيانات تروح لأي مكان.', demo: 'ملخص الفصل', out: 'الفصل قرا ٣ قصص النهارده، أكتر كلمة اتسألت عنها «الشرق». (أرقام تجريبية)'}
  };
  function html(k) {
    const a = AUD[k];
    const tabs = Object.entries(AUD).map(([id, v]) => `<button type="button" class="button ${id === k ? '' : 'secondary'}" data-pen-aud="${id}" aria-pressed="${id === k}">${v.icon} ${v.name}</button>`).join(' ');
    return `<p class="hx-demo-tag" style="background:#fff3cd;color:#5c4400;padding:6px 10px;border-radius:10px;font-weight:700">${TAG}</p>
<div role="group" aria-label="اختار الفئة" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${tabs}</div>
<p>${a.what}</p>
<p class="voice-note" style="margin:6px 0">جملة التجربة: «${SAMPLE}»</p>
<button type="button" class="button" id="hxPenTry" data-pen-demo="${k}">اعتبر إن القلم لمس «${a.demo}»</button>
<p id="hxPenOut" aria-live="polite" style="min-height:2em;margin-top:8px"></p>
<p class="hx-muted">ده عرض على الشاشة بس. مفيش قلم متوصل، والقلم الحقيقي لسه بنشتغل عليه.</p>`;
  }
  function open(k = 'kid') { HX.dialog('hxPen', 'جرّب القلم (' + TAG + ')', html(k)); HX.open('hxPen'); }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-pen-aud]');
    if (t && document.getElementById('hxPenTry')) { const body = document.querySelector('#hxPen .dialog-body'); if (body) body.innerHTML = html(t.dataset.penAud); return; }
    const d = e.target.closest('#hxPenTry');
    if (d) { const out = document.getElementById('hxPenOut'); if (out) out.textContent = AUD[d.dataset.penDemo].out; }
  });
  HX.penDemo = open;
  HX.features.push({id: 'pen-demo', icon: '🖊️', name: 'القلم (تجربة)', sub: TAG, order: 60, open: () => open('kid')});
})();
