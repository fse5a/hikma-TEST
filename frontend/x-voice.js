// ============================================================
// دفعة ٩: الصوت (على الجهاز ومجاني): "تدريب النطق": تسمع الكلمة أو الجملة، تسجّل صوتك، وتسمع الاتنين.
// مفيش تقييم أوتوماتيك (ده محتاج خدمة صوت سحابية)، إنت اللي بتقارن بودنك. التسجيل بيفضل على الجهاز ولا بيتبعت.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  let target = '', rec = null, chunks = [], url = null, stream = null;
  const lang = t => /[\u0600-\u06FF]/.test(t) ? 'ar' : 'en';
  const options = () => {
    const l = HX.lines ? HX.lines() : [];
    const sents = l.filter(s => s.trim().split(/\s+/).length >= 2).slice(0, 3);
    const kw = HX.keywords ? HX.keywords(l.join(' '), 5).map(k => k.word) : [];
    return [...kw, ...sents.map(s => s.trim())];
  };
  function stopStream() { try { stream?.getTracks().forEach(t => t.stop()); } catch {} stream = null; }
  function render(msg = '') {
    const opts = options();
    if (!target) target = opts[0] || '';
    HX.dialog('hxVoice', 'تدريب النطق', opts.length ? `
      <p class="hx-muted">اختار كلمة أو جملة، اسمعها، وبعدين سجّل صوتك وقارن.</p>
      <select id="hxVoiceSel" aria-label="اختار النص" class="hx-input">${opts.map(o => `<option value="${esc(o)}"${o === target ? ' selected' : ''}>${esc(o.length > 50 ? o.slice(0, 50) + '…' : o)}</option>`).join('')}</select>
      <p class="hx-moral-text" dir="auto" id="hxVoiceTarget">${esc(target)}</p>
      <div class="hx-row" style="flex-wrap:wrap;gap:8px">
        <button type="button" class="button secondary" id="hxVoiceHear">🔊 اسمعها</button>
        <button type="button" class="button primary" id="hxVoiceRec">${rec && rec.state === 'recording' ? '⏹ وقّف التسجيل' : '🎙 سجّل صوتك'}</button>
        <button type="button" class="button secondary" id="hxVoiceMine" ${url ? '' : 'disabled'}>▶ صوتي</button>
      </div>
      <p id="hxVoiceMsg" class="hx-muted" role="status">${esc(msg)}</p>` : '<p class="hx-muted">افتح قصة الأول.</p>');
    HX.open('hxVoice');
  }
  document.addEventListener('change', e => { if (e.target.id === 'hxVoiceSel') { target = e.target.value; document.getElementById('hxVoiceTarget').textContent = target; } });
  document.addEventListener('click', async e => {
    if (e.target.closest('#hxVoiceHear')) { try { HX.say(target, lang(target)); } catch {} return; }
    if (e.target.closest('#hxVoiceMine')) { if (url) new Audio(url).play().catch(() => {}); return; }
    if (e.target.closest('#hxVoiceRec')) {
      if (rec && rec.state === 'recording') { rec.stop(); return; }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return render('جهازك مش بيدعم التسجيل.');
      try {
        stream = await navigator.mediaDevices.getUserMedia({audio: true});
      } catch { return render('محتاج تسمح للميكروفون علشان تسجّل.'); }
      chunks = []; rec = new MediaRecorder(stream);
      rec.ondataavailable = ev => { if (ev.data.size) chunks.push(ev.data); };
      rec.onstop = () => { stopStream(); if (url) URL.revokeObjectURL(url); url = chunks.length ? URL.createObjectURL(new Blob(chunks, {type: rec.mimeType || 'audio/webm'})) : null; render(url ? 'اتسجّل. دوس «صوتي» وقارن.' : 'ما اتسجّلش صوت.'); };
      rec.start(); render('بيسجّل… اتكلم دلوقتي.');
    }
  });
  HX.features.push({id: 'pron', icon: '🎙', name: 'تدريب النطق', sub: 'اسمع وسجّل وقارن', order: 27, open: () => render()});
})();
