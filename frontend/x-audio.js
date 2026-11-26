// ============================================================
// الصوت: موسيقى هادئة وأصوات طبيعة (مولّدة في المتصفح، مجانية)، قراءة بالأدوار،
// قاموس النطق، بيانات شاشة القفل، وإعلان الجملة لقارئ الشاشة
// ============================================================
(() => {
  'use strict';
  const HX = window.HX, esc = HX.escapeHtml, P = () => HX.prefs;

  // ---------- 12) موسيقى وأصوات خلفية ----------
  const SOUNDS = [{id: 'off', name: 'بدون'}, {id: 'pad', name: 'موسيقى هادئة'}, {id: 'rain', name: 'مطر'}, {id: 'ocean', name: 'أمواج'}];
  let ctx = null, master = null, nodes = [], chordTimer = null;
  const soundName = () => SOUNDS.find(s => s.id === (P().ambient || 'off'))?.name;
  function noiseBuffer(c) {
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    return buf;
  }
  function stopAmbient() {
    clearInterval(chordTimer); chordTimer = null;
    nodes.forEach(n => { try { n.stop?.(); } catch {} try { n.disconnect(); } catch {} });
    nodes = [];
  }
  function startAmbient() {
    stopAmbient();
    const kind = P().ambient || 'off';
    if (kind === 'off') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    master = master || ctx.createGain();
    master.connect(ctx.destination);
    master.gain.value = (P().ambientVolume ?? 0.25) * 0.5;
    if (kind === 'pad') {
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900;
      filter.connect(master); nodes.push(filter);
      const chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
      const oscs = [0, 1, 2].map(() => { const o = ctx.createOscillator(); o.type = 'sine'; const g = ctx.createGain(); g.gain.value = 0.3; o.connect(g); g.connect(filter); o.start(); nodes.push(o, g); return o; });
      let i = 0;
      const step = () => { const t = ctx.currentTime; oscs.forEach((o, k) => o.frequency.linearRampToValueAtTime(chords[i % chords.length][k], t + 2.5)); i++; };
      step(); chordTimer = setInterval(step, 7000);
    } else {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); src.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = kind === 'rain' ? 'highpass' : 'lowpass'; filter.frequency.value = kind === 'rain' ? 1200 : 500;
      const gain = ctx.createGain(); gain.gain.value = kind === 'rain' ? 0.6 : 0.8;
      src.connect(filter); filter.connect(gain); gain.connect(master); src.start(); nodes.push(src, filter, gain);
      if (kind === 'ocean') { const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(gain.gain); lfo.start(); nodes.push(lfo, lg); }
    }
  }
  HX.ambient = {start: startAmbient, stop: stopAmbient, get playing() { return nodes.length > 0; }};
  function openSound() {
    const p = P();
    HX.dialog('hxSound', 'أصوات خلفية للقراءة', `<div class="hx-field"><label for="hxAmbient">الصوت</label><select id="hxAmbient">${SOUNDS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div><div class="hx-field"><label for="hxAmbVol">مستوى الصوت</label><input type="range" id="hxAmbVol" min="0" max="1" step="0.05" value="${p.ambientVolume ?? 0.25}" aria-valuetext="${Math.round((p.ambientVolume ?? 0.25) * 100)} في المية"></div><p class="voice-note">الأصوات بتتولّد جوه المتصفح ومفيهاش أي ملفات أو اشتراكات. بتوقف لما تقفل القصة.</p>`);
    document.getElementById('hxAmbient').value = p.ambient || 'off';
    HX.open('hxSound');
  }
  document.addEventListener('change', e => {
    if (e.target.id === 'hxAmbient') { P().ambient = e.target.value; HX.save(); startAmbient(); HX.refreshBar?.(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'hxAmbVol') { P().ambientVolume = Number(e.target.value); e.target.setAttribute('aria-valuetext', Math.round(e.target.value * 100) + ' في المية'); if (master) master.gain.value = P().ambientVolume * 0.5; HX.save(); }
  });
  // بنوقف الموسيقى لما القارئ يتقفل
  new MutationObserver(() => { if (!document.getElementById('readerOverlay').classList.contains('open')) { stopAmbient(); stopRoles(); } })
    .observe(document.getElementById('readerOverlay'), {attributes: true, attributeFilter: ['class']});
  HX.addReaderTool({id: 'sound', icon: '🎵', label: () => 'خلفية: ' + soundName(), order: 30, onClick: openSound});

  // ---------- 11) قراءة بالأدوار (صوت مختلف لكل شخصية) ----------
  let rolesOn = false, rolesToken = 0;
  // بيقسم الجملة لأجزاء: سرد أو كلام شخصية
  function segments(line) {
    const out = [];
    const re = /[«"“]([^»"”]+)[»"”]/g;
    let last = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > last) out.push({t: line.slice(last, m.index), who: 'narrator'});
      const before = line.slice(Math.max(0, m.index - 40), m.index);
      const sps = [...before.matchAll(/(?:قال|قالت|صاح|صاحت|ردّ|ردت|رد|said|asked)\s+(\S+)/gi)];
      const sp = sps[sps.length - 1];
      out.push({t: m[1], who: sp ? sp[1].replace(/[:،,]/g, '') : 'x'});
      last = m.index + m[0].length;
    }
    // «قال الأرنب: كلام» بدون علامات اقتباس
    if (!out.length) {
      const c = line.match(/^(.*?(?:قال|قالت|صاح|صاحت)\s+(\S+)\s*:)\s*(.+)$/);
      if (c) return [{t: c[1], who: 'narrator'}, {t: c[3], who: c[2]}];
    }
    if (last < line.length) out.push({t: line.slice(last), who: 'narrator'});
    return out.filter(s => s.t.trim());
  }
  HX.roleSegments = segments;
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const PITCHES = [1.5, 0.7, 1.25, 0.85, 1.65];
  function speakSegment(seg, lang, speakers) {
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(seg.t);
      u.lang = lang === 'en' ? 'en-US' : 'ar-EG';
      u.rate = Math.min(1.5, Math.max(0.6, state.settings.rate || 1));
      if (seg.who === 'narrator') u.pitch = 1;
      else {
        if (!speakers.has(seg.who)) speakers.set(seg.who, speakers.size);
        u.pitch = PITCHES[speakers.get(seg.who) % PITCHES.length];
        u.rate *= 1.03;
      }
      const voices = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
      if (voices.length > 1 && seg.who !== 'narrator') u.voice = voices[(speakers.get(seg.who) + 1) % voices.length];
      u.onend = resolve; u.onerror = resolve;
      speechSynthesis.speak(u);
    });
  }
  async function playRoles() {
    const r = window.hikmaReader;
    if (!r?.story || !('speechSynthesis' in window)) { HX.toast('القراءة الصوتية مش مدعومة هنا'); return; }
    r.stop();
    rolesOn = true; const my = ++rolesToken;
    HX.refreshBar();
    const speakers = new Map(), lang = r.story.lang;
    for (let i = r.index; i < HX.lines().length && rolesOn && my === rolesToken; i++) {
      HX.setIndex(i);
      for (const seg of segments(HX.lines()[i])) { if (!rolesOn || my !== rolesToken) break; await speakSegment(seg, lang, speakers); }
    }
    if (my === rolesToken) { rolesOn = false; HX.refreshBar(); if (r.index >= HX.lines().length - 1) window.dispatchEvent(new CustomEvent('hikma:finished')); }
  }
  function stopRoles() { if (!rolesOn) return; rolesOn = false; rolesToken++; try { speechSynthesis.cancel(); } catch {} }
  HX.addReaderTool({id: 'roles', icon: '🎭', label: () => rolesOn ? 'إيقاف الأدوار' : 'قراءة بالأدوار', order: 31, onClick: () => { if (rolesOn) { stopRoles(); HX.refreshBar(); } else playRoles(); }});

  // ---------- قاموس النطق (كلمات زي Zelda) ----------
  const defaults = {Zelda: 'زيلدا', Doraemon: 'دورايمون', Mickey: 'ميكي', Hikma: 'حِكمة'};
  const dict = () => ({...defaults, ...HX.X.pronounce});
  const dictRe = () => {
    const keys = Object.keys(dict()).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return keys.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${keys.join('|')})(?![\\p{L}\\p{N}])`, 'giu') : null;
  };
  const applyDict = text => {
    const re = dictRe(), d = dict(), lower = Object.fromEntries(Object.entries(d).map(([k, v]) => [k.toLowerCase(), v]));
    return re ? String(text).replace(re, m => lower[m.toLowerCase()] || m) : text;
  };
  HX.applyPronounce = applyDict;
  // بنغلّف الـ SpeechSynthesisUtterance وطلبات الصوت السحابي علشان القاموس يشتغل في كل الأصوات
  const OrigUtterance = window.SpeechSynthesisUtterance;
  if (OrigUtterance) {
    window.SpeechSynthesisUtterance = class extends OrigUtterance { constructor(text) { super(text === undefined ? text : applyDict(text)); } };
  }
  const origFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const url = typeof input === 'string' ? input : input.url;
      if (url && url.includes('/api/speech') && init && typeof init.body === 'string') {
        const body = JSON.parse(init.body);
        if (typeof body.text === 'string') { body.text = applyDict(body.text); init = {...init, body: JSON.stringify(body)}; }
      }
    } catch {}
    return origFetch(input, init);
  };
  function openDict() {
    const rows = Object.entries(HX.X.pronounce).map(([k, v]) => `<li><span><bdi>${esc(k)}</bdi> ← <bdi>${esc(v)}</bdi></span><button class="icon-button" data-hx-dict-del="${esc(k)}" aria-label="احذف ${esc(k)}" type="button">🗑</button></li>`).join('');
    const defRows = Object.entries(defaults).filter(([k]) => !(k in HX.X.pronounce)).map(([k, v]) => `<li class="hx-def"><span><bdi>${esc(k)}</bdi> ← <bdi>${esc(v)}</bdi></span><span class="hx-muted">جاهزة</span></li>`).join('');
    HX.dialog('hxDict', 'قاموس النطق', `<p class="voice-note" style="margin-top:0">اكتب الكلمة زي ما هي في القصة، واكتب جنبها إزاي تتنطق بالعربي. الصوت هيقرأها بالنطق الجديد (النص على الشاشة مش بيتغيّر).</p><form class="hx-add-word" id="hxDictForm"><label class="sr-only" for="hxDictK">الكلمة</label><input id="hxDictK" placeholder="الكلمة (مثلًا Zelda)" required maxlength="30"><label class="sr-only" for="hxDictV">نطقها</label><input id="hxDictV" placeholder="نطقها (زيلدا)" required maxlength="30"><button class="button primary" type="submit">إضافة</button></form><div class="hx-row"><button class="button secondary" id="hxDictTest" type="button">🔊 جرّب</button></div><ul class="hx-list">${rows}${defRows}</ul>`, {wide: true});
    HX.open('hxDict');
  }
  document.addEventListener('submit', e => {
    if (e.target.id !== 'hxDictForm') return;
    e.preventDefault();
    HX.X.pronounce[document.getElementById('hxDictK').value.trim()] = document.getElementById('hxDictV').value.trim();
    HX.save(); openDict();
  });
  document.addEventListener('click', e => {
    const del = e.target.closest('[data-hx-dict-del]');
    if (del) { delete HX.X.pronounce[del.dataset.hxDictDel]; HX.save(); openDict(); }
    if (e.target.closest('#hxDictTest')) { const k = document.getElementById('hxDictK').value.trim(); if (k) HX.say(k, 'ar'); }
  });
  HX.features.push({id: 'dict', icon: '📖', name: 'قاموس النطق', sub: 'علّم الصوت كلمات صعبة', order: 12, open: openDict});
  HX.features.push({id: 'sound', icon: '🎵', name: 'أصوات خلفية', sub: 'موسيقى، مطر، أمواج', order: 14, open: openSound});

  // ---------- 14) شاشة القفل ----------
  HX.on('barmounted', () => {
    const s = window.hikmaReader?.story;
    if (s && 'mediaSession' in navigator && window.MediaMetadata) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({title: s.title, artist: 'حِكمة', album: 'مكتبة حكمة', artwork: [{src: new URL('assets/mascots/hikma.webp', document.baseURI).href, sizes: '512x512', type: 'image/webp'}]});
      } catch {}
    }
  });

  // ---------- قارئ الشاشة: إعلان الجملة الحالية ----------
  const live = document.createElement('div');
  live.id = 'hxLive'; live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
  document.body.appendChild(live);
  HX.announce = text => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 40); };
  let lastAnnounced = -1;
  new MutationObserver(() => {
    if (!P().announce) return;
    const a = document.querySelector('#readingText .active');
    if (!a) return;
    const i = Number(a.dataset.line);
    if (i !== lastAnnounced) { lastAnnounced = i; HX.announce(a.textContent.trim()); }
  }).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class'], childList: true});
})();
