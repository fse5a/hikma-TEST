// ============================================================
// جو صوتي بيتغيّر مع مشهد القصة (بيت، غابة، بحر، مطر، ليل، سوق، مدرسة، صحراء، مدينة، معركة...)
// بيتحدد من نص أي قصة وبيتابع الجملة الحالية. كله مولّد على الجهاز بـ WebAudio، من غير ملفات ولا إنترنت.
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const W = pat => new RegExp('(?<![\\u0600-\\u06FFA-Za-z])[وفبلك]?(?:ال)?(?:' + pat + ')', 'i');
  // الترتيب = الأولوية لو أكتر من مشهد في نفس الجملة
  const SCENES = [
    ['battle', 'معركة', W('معركة|حرب|قتال|سيف|سيوف|battle|war|fight|sword')],
    ['rain', 'مطر', W('مطر|عاصفة|رعد|rain|storm|thunder')],
    ['sea', 'بحر', W('بحر|موج|شاطئ|سفينة|محيط|sea|ocean|wave|beach|ship')],
    ['desert', 'صحراء', W('صحراء|رمال|جمل|desert|sand|camel')],
    ['forest', 'غابة', W('غابة|غاب|شجر|أشجار|طيور|عصفور|forest|tree|jungle|bird')],
    ['market', 'سوق', W('سوق|بائع|تجار|market|shop|vendor')],
    ['school', 'مدرسة', W('مدرسة|فصل|معلم|مدرس|طلاب|school|class|teacher')],
    ['city', 'مدينة', W('مدينة|شارع|سيارة|سيارات|city|street|traffic|cars')],
    ['night', 'ليل', W('ليل|ليلة|نجوم|قمر|night|moon|stars')],
    ['house', 'بيت', W('بيت|منزل|غرفة|مطبخ|house|home|room|kitchen')]
  ];
  function detectScene(text) { const t = String(text || ''); const f = SCENES.find(s => s[2].test(t)); return f ? f[0] : null; }
  HX.detectScene = detectScene; HX.sceneNames = Object.fromEntries(SCENES.map(s => [s[0], s[1]]));

  let ac = null, master = null, cur = null, nodes = [], timers = [], on = true;
  const KEY = 'hikma-scene-on';
  try { on = localStorage.getItem(KEY) !== '0'; } catch {}
  const vol = () => 0.14 * (HX.volumeCap ? HX.volumeCap() : 1);
  function ctx() {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function noiseSrc(c) { const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; }
  function bed(c, type, freq, gain, lfoHz = 0, lfoDepth = 0) {
    const s = noiseSrc(c), f = c.createBiquadFilter(), g = c.createGain(); f.type = type; f.frequency.value = freq; g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(out); nodes.push(s, f, g);
    if (lfoHz) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l, lg); }
  }
  function blip(c, freq, dur, gain, type = 'sine', sweep = 0) { const o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = type; o.frequency.setValueAtTime(freq, t); if (sweep) o.frequency.linearRampToValueAtTime(freq + sweep, t + dur); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(out); o.start(); o.stop(t + dur + 0.05); }
  const every = (fn, min, max) => { const loop = () => { fn(); timers.push(setTimeout(loop, min + Math.random() * (max - min))); }; timers.push(setTimeout(loop, min / 2)); };
  let out = null;
  const BUILD = {
    sea(c) { bed(c, 'lowpass', 500, 0.8, 0.12, 0.5); },
    rain(c) { bed(c, 'highpass', 1500, 0.5); bed(c, 'lowpass', 300, 0.2, 0.2, 0.1); every(() => blip(c, 70, 1.2, 0.25, 'sine'), 5000, 9000); },
    forest(c) { bed(c, 'bandpass', 600, 0.18, 0.1, 0.08); every(() => { const f = 2400 + Math.random() * 1200; blip(c, f, 0.12, 0.05, 'sine', 500); setTimeout(() => blip(c, f + 200, 0.1, 0.04, 'sine', 400), 160); }, 1500, 4000); },
    night(c) { bed(c, 'lowpass', 180, 0.15); every(() => { for (let i = 0; i < 3; i++) setTimeout(() => blip(c, 4300, 0.05, 0.03, 'square'), i * 90); }, 700, 1300); },
    market(c) { bed(c, 'bandpass', 900, 0.45, 3, 0.25); bed(c, 'bandpass', 1500, 0.2, 1.7, 0.12); },
    school(c) { bed(c, 'bandpass', 800, 0.25, 2.2, 0.15); every(() => { blip(c, 880, 1.2, 0.05, 'sine'); }, 12000, 20000); },
    desert(c) { bed(c, 'bandpass', 450, 0.25, 0.07, 0.15); },
    city(c) { bed(c, 'lowpass', 220, 0.45, 0.2, 0.1); every(() => blip(c, 420, 0.25, 0.04, 'triangle'), 4000, 9000); },
    battle(c) { every(() => blip(c, 70, 0.3, 0.4, 'sine'), 700, 900); every(() => { const s = noiseSrc(c), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = 3000; g.gain.value = 0.15; s.connect(f); f.connect(g); g.connect(out); setTimeout(() => { try { s.stop(); } catch {} }, 120); }, 1500, 3000); },
    house(c) { bed(c, 'lowpass', 160, 0.12); every(() => blip(c, 1800, 0.03, 0.03, 'square'), 1000, 1000); }
  };
  function stop() {
    timers.forEach(clearTimeout); timers = [];
    const old = nodes, g = master;
    nodes = []; cur = null;
    if (g && ac) g.gain.setTargetAtTime(0, ac.currentTime, 0.4);
    setTimeout(() => old.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch {} }), 900);
  }
  function setScene(name) {
    if (!on || name === cur) return;
    if (!name) { stop(); return; }
    const c = ctx();
    timers.forEach(clearTimeout); timers = [];
    const old = nodes; nodes = [];
    if (out) { const o = out; o.gain.setTargetAtTime(0, c.currentTime, 0.4); setTimeout(() => { old.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch {} }); try { o.disconnect(); } catch {} }, 900); }
    out = c.createGain(); out.gain.value = 0; out.connect(master);
    cur = name; BUILD[name](c);
    out.gain.setTargetAtTime(1, c.currentTime, 0.6); master.gain.setTargetAtTime(vol(), c.currentTime, 0.3);
    HX.emit && HX.emit('scenechange', {scene: name});
  }
  HX.scene2 = {set: setScene, stop, get current() { return cur; }, get on() { return on; }};
  // بيتابع الجملة الحالية في القارئ. بيفضل على المشهد السابق لو الجملة مفيهاش مؤشر مشهد.
  let lastIdx = -1, lastStory = null;
  setInterval(() => {
    const r = window.hikmaReader, open = document.getElementById('readerOverlay')?.classList.contains('open');
    if (!open || !r || !r.story) { if (cur) stop(); lastIdx = -1; lastStory = null; return; }
    if (!on || (document.documentElement.dataset.a11y === 'on' && document.documentElement.dataset.sceneAudio !== 'on')) return;
    if (r.story.id !== lastStory) { lastStory = r.story.id; lastIdx = -1; }
    if (r.index === lastIdx) return; lastIdx = r.index;
    const lines = HX.lines ? HX.lines() : [];
    const nearby = [lines[r.index], lines[r.index + 1]].filter(Boolean).join(' ');
    const sc = detectScene(nearby) || detectScene(lines[r.index - 1]);
    if (sc) setScene(sc);
  }, 700);
  function toggle() { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {} if (!on) stop(); HX.toast(on ? 'جو المشاهد شغّال' : 'جو المشاهد مقفول'); HX.refreshBar && HX.refreshBar(); }
  HX.addReaderTool({id: 'scene', icon: '🎬', label: () => on ? 'جو المشهد: شغّال' : 'جو المشهد: مقفول', order: 17, onClick: toggle});
})();
