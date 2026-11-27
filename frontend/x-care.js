// ============================================================
// أدوات رعاية وسهولة وصول، كلها على الجهاز ومجانية وبتشتغل على أي نص:
//  - «الوقت والتاريخ» بالصوت  - سقف للصوت (يحمي سمع الطفل)  - تسجيل الطفل وسماعه (مش بيتبعت لحد)
//  - مؤثرات صوتية حسب كلمات القصة (مطر، رعد، باب، ريح) مولّدة بـ WebAudio
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  const KEY = 'hikma-care-v1';
  const prefs = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } })();
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };
  const speak = (t, lang = 'ar') => { try { HX.say ? HX.say(t, lang) : speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(t), {lang: lang === 'en' ? 'en-US' : 'ar-EG'})); } catch {} };

  // ---------- الوقت والتاريخ ----------
  function timeText() {
    const d = new Date();
    const day = d.toLocaleDateString('ar-EG', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
    const t = d.toLocaleTimeString('ar-EG', {hour: 'numeric', minute: '2-digit'});
    return `النهارده ${day}، والساعة ${t}`;
  }
  HX.timeText = timeText;
  function openTime() {
    const t = timeText();
    HX.dialog('hxTime', 'الوقت والتاريخ', `<p class="hx-moral-text" role="status">${esc(t)}</p><div class="modal-actions"><button class="button primary" id="hxTimeSay" type="button">🔊 قوله بصوت</button></div>`);
    HX.open('hxTime'); speak(t);
  }
  document.addEventListener('click', e => { if (e.target.closest('#hxTimeSay')) speak(timeText()); });
  HX.features.push({id: 'time', icon: '🕒', name: 'الوقت والتاريخ', sub: 'بيقولهم بصوت', order: 56, open: openTime});

  // ---------- سقف الصوت ----------
  const LEVELS = [['off', 'من غير سقف', 1], ['mid', 'متوسط', 0.6], ['low', 'هادي (للأطفال)', 0.35]];
  const cap = () => (LEVELS.find(l => l[0] === (prefs.cap || 'off')) || LEVELS[0])[2];
  HX.volumeCap = cap;
  const origSpeak = window.speechSynthesis && window.speechSynthesis.speak.bind(window.speechSynthesis);
  if (origSpeak) window.speechSynthesis.speak = u => { try { if (u) u.volume = Math.min(u.volume ?? 1, cap()); } catch {} return origSpeak(u); };
  function openCap() {
    HX.dialog('hxCap', 'سقف الصوت', `<p class="hx-muted">بيحدّد أعلى صوت ممكن، عشان سمع الطفل.</p><div class="hx-row" role="radiogroup" aria-label="سقف الصوت">${LEVELS.map(l => `<button class="button ${(prefs.cap || 'off') === l[0] ? 'primary' : 'secondary'}" type="button" role="radio" aria-checked="${(prefs.cap || 'off') === l[0]}" data-hx-cap="${l[0]}">${l[1]}</button>`).join('')}</div>`);
    HX.open('hxCap');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-hx-cap]'); if (!b) return; prefs.cap = b.dataset.hxCap; store(); openCap(); HX.toast('اتحفظ سقف الصوت'); });
  HX.features.push({id: 'cap', icon: '🔉', name: 'سقف الصوت', sub: 'يحمي سمع الطفل', order: 57, open: openCap});

  // ---------- تسجيل الطفل ----------
  let rec = null, chunks = [], lastUrl = null;
  function openRecord() {
    const ok = !!(navigator.mediaDevices && window.MediaRecorder);
    HX.dialog('hxRec', 'سجّل صوتك وأنت بتقرا', ok ? `<p class="hx-muted">التسجيل بيفضل على جهازك بس، ومش بيتبعت لأي حد.</p><div class="modal-actions"><button class="button primary" id="hxRecGo" type="button">🎙️ ابدأ التسجيل</button><button class="button secondary" id="hxRecStop" type="button" disabled>⏹️ وقّف</button></div><audio id="hxRecPlay" controls hidden aria-label="سماع تسجيلك"></audio><p class="status" id="hxRecMsg" role="status"></p>` : '<p class="hx-muted">المتصفح ده مش بيدعم التسجيل.</p>');
    HX.open('hxRec');
  }
  document.addEventListener('click', async e => {
    if (e.target.closest('#hxRecGo')) {
      const msg = document.getElementById('hxRecMsg');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        chunks = []; rec = new MediaRecorder(stream);
        rec.ondataavailable = ev => chunks.push(ev.data);
        rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); if (lastUrl) URL.revokeObjectURL(lastUrl); lastUrl = URL.createObjectURL(new Blob(chunks, {type: rec.mimeType || 'audio/webm'})); const a = document.getElementById('hxRecPlay'); if (a) { a.src = lastUrl; a.hidden = false; a.play().catch(() => {}); } };
        rec.start(); document.getElementById('hxRecGo').disabled = true; document.getElementById('hxRecStop').disabled = false; msg.textContent = 'بيسجّل...';
      } catch { if (msg) msg.textContent = 'مقدرتش أفتح الميكروفون. اسمح للموقع باستخدامه.'; }
    }
    if (e.target.closest('#hxRecStop') && rec && rec.state === 'recording') { rec.stop(); document.getElementById('hxRecGo').disabled = false; document.getElementById('hxRecStop').disabled = true; document.getElementById('hxRecMsg').textContent = 'تمام، اسمع تسجيلك.'; }
  });
  HX.features.push({id: 'rec', icon: '🎙️', name: 'سجّل صوتك', sub: 'اسمع نفسك وأنت بتقرا', order: 59, open: openRecord});

  // ---------- مؤثرات صوتية حسب الكلمات ----------
  const FX = [
    {k: 'rain', re: /مطر|شتا|rain|storm/i, name: 'مطر'},
    {k: 'thunder', re: /رعد|برق|thunder/i, name: 'رعد'},
    {k: 'door', re: /باب|طرق|door|knock/i, name: 'باب'},
    {k: 'wind', re: /ريح|هوا|عاصف|wind/i, name: 'ريح'}
  ];
  const detectFx = text => FX.filter(f => f.re.test(String(text || '')));
  HX.detectFx = detectFx;
  let ac = null;
  function noise(ms, freq, gain, type = 'lowpass') {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const len = Math.floor(ac.sampleRate * ms / 1000), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = type; f.frequency.value = freq; g.gain.value = Math.min(gain, 0.6) * cap();
    s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
  }
  function play(k) {
    if (k === 'rain') noise(1800, 4000, 0.35, 'highpass');
    if (k === 'thunder') noise(1600, 160, 0.6);
    if (k === 'wind') noise(1800, 700, 0.3, 'bandpass');
    if (k === 'door') { noise(120, 900, 0.6); setTimeout(() => noise(120, 900, 0.5), 220); }
  }
  function openFx(s) {
    const found = s ? detectFx(s.text) : [];
    HX.dialog('hxFx', 'مؤثرات القصة', found.length ? `<p class="hx-muted">لقينا في القصة كلمات بتدل على مؤثرات. دوس تسمعها:</p><div class="hx-row">${found.map(f => `<button class="button secondary" type="button" data-hx-fx="${f.k}">${f.name}</button>`).join('')}</div>` : '<p class="hx-muted">مفيش في القصة دي كلمات لمؤثرات (مطر، رعد، باب، ريح).</p>');
    HX.open('hxFx');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-hx-fx]'); if (b) play(b.dataset.hxFx); });
  HX.addReaderTool({id: 'fx', icon: '🌧️', label: 'مؤثرات', order: 16, onClick: openFx});
})();
