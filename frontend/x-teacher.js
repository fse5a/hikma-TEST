// ============================================================
// دفعة ١٠: ملخص جاهز للمعلم (على الجهاز): عنوان، مستوى، تقدّم، ملخص جملتين، أهم الكلمات، عبرة تقديرية.
// بينسخ أو ينزّل ملف نصي، وإنت اللي بتبعته. مفيش حاجة بتتبعت من الموقع.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  HX.teacherReport = story => {
    const text = story?.text || '';
    const pct = Math.round(story?.pct ?? (story?.done ? 100 : story?.progress || 0));
    const sum = (HX.summarize ? HX.summarize(text, 2) : []).join(' ');
    const kw = HX.keywords ? HX.keywords(text, 6).map(k => k.word).join('، ') : '';
    const lv = HX.textLevel ? HX.textLevel(text) : null;
    const name = HX.profile?.name || '';
    return [`تقرير قراءة: ${story?.title || ''}`, name ? `القارئ: ${name}` : '', `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, `التقدم في القصة: ${pct}%`, lv ? `مستوى النص (تقديري): ${lv.name}` : '', sum ? `الملخص: ${sum}` : '', kw ? `أهم الكلمات: ${kw}` : '', HX.autoMoral ? `العبرة (تقديرية): ${HX.autoMoral(text)}` : '', 'اتعمل على جهاز القارئ بدون إنترنت.'].filter(Boolean).join('\n');
  };
  function open() {
    const s = window.hikmaReader?.story || state.stories[0];
    if (!s) return;
    const rep = HX.teacherReport(s);
    HX.dialog('hxTeacher', 'ملخص للمعلم', `<p class="hx-muted">ملخص جاهز للقصة اللي فاتحها. انسخه أو نزّله وابعته إنت للمعلم.</p><textarea id="hxTeachTxt" class="hx-input" rows="10" dir="auto" readonly>${esc(rep)}</textarea><div class="hx-row" style="flex-wrap:wrap;gap:8px"><button type="button" class="button primary" id="hxTeachCopy">نسخ</button><button type="button" class="button secondary" id="hxTeachSave">تنزيل ملف</button></div><p id="hxTeachMsg" class="hx-muted" role="status"></p>`);
    HX.open('hxTeacher');
  }
  document.addEventListener('click', async e => {
    const txt = document.getElementById('hxTeachTxt'); if (!txt) return;
    const msg = document.getElementById('hxTeachMsg');
    if (e.target.closest('#hxTeachCopy')) {
      try { await navigator.clipboard.writeText(txt.value); msg.textContent = 'اتنسخ.'; }
      catch { txt.select(); msg.textContent = 'حدّد النص وانسخه يدويًا.'; }
    }
    if (e.target.closest('#hxTeachSave')) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt.value], {type: 'text/plain;charset=utf-8'}));
      a.download = 'reading-summary.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000); msg.textContent = 'اتنزّل.';
    }
  });
  HX.features.push({id: 'teacher', icon: '📝', name: 'ملخص للمعلم', sub: 'جاهز للنسخ', order: 41, open});
})();
