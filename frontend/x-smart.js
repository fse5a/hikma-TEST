// ============================================================
// أدوات ذكية على الجهاز لأي نص أو قصة (مش بس قصص العرض): عبرة تقديرية وملخص جملتين.
// مجانية، من غير إنترنت ولا كوتة، ومفيش أي نص بيتبعت لحد.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX;
  if (!HX) return;
  const esc = HX.escapeHtml;
  const CUES = /(العبرة|الحكمة|المغزى|نتعلم|تعلّم|تعلم|لذلك|لهذا|فلا تنس|دائمًا|دايمًا|دائما|يجب|لازم|ينبغي|moral|lesson|learn|always|never|remember)/i;
  const clean = s => String(s).replace(/\s+/g, ' ').trim();
  const sentences = t => HX.splitSentences(t).map(clean).filter(x => x.length >= 12);
  const words = s => HX.tokens(HX.strip(s)).map(w => w.toLowerCase());
  const STOPW = new Set(['في', 'من', 'على', 'الى', 'عن', 'ثم', 'قد', 'كان', 'كانت', 'هذا', 'هذه', 'التي', 'الذي', 'لكن', 'كل', 'ان', 'ما', 'لا', 'هل', 'مع', 'او', 'the', 'and', 'was', 'that', 'with', 'for', 'from', 'his', 'her', 'she', 'they', 'then', 'had', 'has']);

  // ملخص: الجمل اللي فيها أكتر كلمات متكررة في النص، بترتيبها الأصلي
  function summarize(text, n = 2) {
    const ss = sentences(text);
    if (ss.length <= n) return ss;
    const freq = {};
    ss.forEach(s => words(s).forEach(w => { if (w.length > 2 && !STOPW.has(w)) freq[w] = (freq[w] || 0) + 1; }));
    const scored = ss.map((s, i) => {
      const ws = words(s).filter(w => w.length > 2 && !STOPW.has(w));
      const sc = ws.reduce((a, w) => a + freq[w], 0) / Math.sqrt(ws.length + 3);
      return {s, i, sc: sc + (i === 0 ? 0.5 : 0)};
    });
    return scored.sort((a, b) => b.sc - a.sc).slice(0, n).sort((a, b) => a.i - b.i).map(x => x.s);
  }
  // عبرة تقديرية: جملة فيها كلمة عبرة/لازم/نتعلم في الآخر، وإلا آخر جملة
  function autoMoral(text) {
    const ss = sentences(text);
    if (!ss.length) return '';
    const tail = ss.slice(Math.floor(ss.length / 2));
    const cue = [...tail].reverse().find(s => CUES.test(s));
    const pick = cue || ss[ss.length - 1];
    return pick.length > 140 ? pick.slice(0, 137) + '...' : pick;
  }
  HX.summarize = summarize; HX.autoMoral = autoMoral;

  function openSummary(s) {
    if (!s) return;
    const sum = summarize(s.text, 2);
    const body = sum.length ? `<ol class="hx-list">${sum.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="hx-muted">ملخص تلقائي على جهازك من نص القصة.</p><div class="modal-actions"><button class="button secondary" id="hxSumRead" type="button">🔊 اسمعه</button></div>` : '<p class="hx-muted">النص قصير على التلخيص.</p>';
    HX.dialog('hxSummary', 'ملخص في جملتين', `<h3>${esc(s.title)}</h3>${body}`);
    HX.open('hxSummary');
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('#hxSumRead')) return;
    const s = window.hikmaReader?.story;
    if (s && HX.say) HX.say(summarize(s.text, 2).join(' '), s.lang);
  });
  HX.addReaderTool({id: 'summary', icon: '📝', label: 'ملخص', order: 14, onClick: openSummary});
})();
