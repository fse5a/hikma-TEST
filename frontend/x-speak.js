// ============================================================
// نقطة الكلام الوحيدة: كل صوت في الموقع بيعدّي من هنا.
// الترتيب: صوت سحابي طبيعي (مخزّن على الجهاز) ثم صوت الجهاز كآخر حل.
// كل شخصية ليها صوتها (اسم صوت Gemini + سرعة).
// ============================================================
(() => {
  const SKIN_VOICES = {
    hikma: {voice: 'Aoede', rate: 0.95},
    cat: {voice: 'Fenrir', rate: 1.05},
    felix: {voice: 'Achird', rate: 1.05},
    bot: {voice: 'Zephyr', rate: 0.95},
    doraemon: {voice: 'Puck', rate: 1.05},
    mickey: {voice: 'Charon', rate: 0.95},
    anbu: {voice: 'Orus', rate: 0.95},
    uchiha: {voice: 'Kore', rate: 0.95},
    zelda: {voice: 'Leda', rate: 1},
    doom: {voice: 'Charon', rate: 0.9}
  };
  const SHOWCASE_IDS = ['bk-rich-dad', 'bk-kotler', 'cart-naruto', 'cart-doraemon', 'lol-swain', 'myth-icarus', 'myth-isis', 'myth-thor'];
  let creditShown = false;
  const settings = () => (typeof state !== 'undefined' && state.settings) || {};
  const profile = () => SKIN_VOICES[document.documentElement.dataset.skin || settings().skin] || SKIN_VOICES.hikma;
  let token = 0, audio = null, audioUrl = null, capFn = () => 1;
  let cloudDownUntil = 0;
  const cloudAllowed = () => navigator.onLine && Date.now() > cloudDownUntil && window.hikmaBackendHealth?.integrations?.speech === 'configured' && (settings().voiceSource || 'cloud') !== 'device' && typeof window.hikmaCloudBlob === 'function';

  function stop() {
    token++;
    if (audio) { try { audio.pause(); } catch {} audio = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    try { window.speechSynthesis?.cancel(); } catch {}
  }

  // ------- آخر حل: صوت الجهاز (المكان الوحيد اللي بيبني SpeechSynthesisUtterance) -------
  function speakDevice(text, {lang = 'ar', rate = 1, pitch = 1, voiceIndex = -1, queue = false, onend, onSilent, onNoTts} = {}) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance !== 'function') { onNoTts?.(); resolve(false); return; }
      if (!queue) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
      u.lang = lang === 'en' ? 'en-US' : 'ar-EG';
      u.rate = rate; u.pitch = pitch;
      u.volume = Math.min(1, capFn());
      if (voiceIndex >= 0) {
        const vs = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
        if (vs.length > 1) u.voice = vs[voiceIndex % vs.length];
      }
      let started = false;
      u.onstart = () => { started = true; };
      u.onend = () => { onend?.(); resolve(true); };
      u.onerror = () => resolve(false);
      speechSynthesis.speak(u);
      setTimeout(() => { if (!started && speechSynthesis.speaking === false && !speechSynthesis.pending) onSilent?.(); }, 3500);
    });
  }

  async function playBlob(blob, my, rate, onend) {
    audioUrl = URL.createObjectURL(blob);
    const a = new Audio(audioUrl);
    audio = a;
    a.playbackRate = Math.min(1.5, Math.max(0.6, rate || 1));
    a.preservesPitch = true;
    a.volume = Math.min(1, capFn());
    await new Promise((resolve, reject) => {
      a.onended = () => { onend?.(); resolve(); };
      a.onerror = () => reject(new Error('audio-error'));
      a.play().catch(reject);
    });
  }

  // ------- الدالة الرئيسية -------
  function speak(text, opts = {}) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return false;
    const lang = opts.lang === 'en' ? 'en' : 'ar';
    if (!opts.queue) stop();
    const my = token;
    const p = profile();
    const rate = (opts.rate || 1) * (p.rate || 1);
    const fallback = () => { if (my === token || opts.queue) speakDevice(clean, {...opts, lang, rate}); };
    if (!cloudAllowed()) { fallback(); return true; }
    const timer = setTimeout(() => { if (my === token && !audio) { token++; fallback(); } }, opts.maxWaitMs || 7000);
    window.hikmaCloudBlob(clean, lang, p.voice).then(async blob => {
      clearTimeout(timer);
      if (my !== token && !opts.queue) return;
      await playBlob(blob, my, rate, opts.onend);
    }).catch(err => {
      clearTimeout(timer);
      if (/demo|quota|429|503|502/.test(String(err?.message || err?.code || ''))) cloudDownUntil = Date.now() + 60000;
      if (my === token || opts.queue) fallback();
    });
    return true;
  }

  // تجهيز السطور الثابتة لكل شخصية (بتتخزّن مرة واحدة)
  function prefetch(lines, lang = 'ar') {
    if (!cloudAllowed()) return;
    const p = profile();
    lines.slice(0, 4).forEach((t, i) => setTimeout(() => window.hikmaCloudBlob(t, lang, p.voice).catch(() => {}), 1500 + i * 1500));
  }

  window.HikmaSpeak = {
    speak, speakDevice, stop, prefetch,
    // قصص العرض بس: صوت ElevenLabs المجاني (حد شهري على السيرفر). غير كده صوت الشخصية.
    skinVoice: () => {
      const st = window.hikmaReader?.story;
      if (st && (st.showcase === true || SHOWCASE_IDS.includes(st.id)) && window.hikmaBackendHealth?.integrations?.showcaseVoice === 'configured') {
        if (!creditShown) { creditShown = true; try { window.HX?.toast('صوت القصة دي من ElevenLabs'); } catch {} }
        return 'Eleven';
      }
      return profile().voice;
    },
    isSpeaking: () => Boolean(audio && !audio.paused) || Boolean(window.speechSynthesis?.speaking),
    setVolumeCap: fn => { capFn = fn; },
    voices: SKIN_VOICES
  };
  if (window.HX) window.HX.speak = (t, o) => speak(t, o);
})();
