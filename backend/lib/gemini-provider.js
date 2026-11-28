// Built-in providers for Google's free AI Studio (Gemini Developer API) key.
// One GEMINI_API_KEY can power both contextual translation and neural speech.
// Free tier: generous for text models; TTS is capped to a small number of
// calls per day, so the device voice stays the default and fallback.

const LANGUAGE_NAMES = {ar: 'Arabic', en: 'English', fr: 'French', de: 'German', es: 'Spanish', zh: 'Chinese (Simplified)'};
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ============================================================
// مزودات Gemini: الترجمة الذكية والصوت.
// ============================================================
// بيحوّل الصوت الخام إلى ملف WAV
function wavFromPcm(base64Pcm) {
  const bytes = Buffer.from(base64Pcm, 'base64');
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF') return base64Pcm;
  const dataSize = bytes.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(48000, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, bytes]).toString('base64');
}

const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670]/g;

// تقدير توقيت كل كلمة من مدة الصوت، موزونة بطول الكلمة ووقفات الترقيم.
// Gemini لا يرجع توقيت كلمات، فهذا بديل تقريبي لتمييز الكلمة أثناء القراءة.
export function estimateWordTimings(text, durationMs) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length || !Number.isFinite(durationMs) || durationMs <= 0) return [];
  const weights = words.map(word => {
    const plain = word.replace(ARABIC_DIACRITICS, '');
    let weight = Math.max(1, plain.length) + 1;
    if (/[.!؟?…]$/.test(plain)) weight += 6;
    else if (/[,،؛;:]$/.test(plain)) weight += 3;
    return weight;
  });
  const leadMs = Math.min(120, durationMs * 0.05);
  const speakable = Math.max(0, durationMs - leadMs);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let elapsed = leadMs;
  return words.map((word, index) => {
    const wordDuration = speakable * (weights[index] / totalWeight);
    const entry = {text: word, offset: Math.round(elapsed), duration: Math.round(wordDuration)};
    elapsed += wordDuration;
    return entry;
  });
}

// ده بتاع الترجمة الذكية بالمعنى عبر Gemini
export function createGeminiTranslationProvider(environment = process.env, fetchImpl = fetch) {
  const apiKey = environment.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = String(environment.GEMINI_MODEL || 'gemini-3.5-flash-lite');

  return {
    name: 'gemini',
    async translate({text, targetLanguage}) {
      const targetName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 15000);
      try {
        const response = await fetchImpl(`${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            contents: [{parts: [{text: `You are a professional literary translator for a children's reading app. Translate the meaning naturally and contextually, never word-for-word. Keep the tone warm and age-appropriate, keep names, and return ONLY the translated text with no commentary.\n\nTranslate the following text into ${targetName}:\n\n${text}`}]}],
            generationConfig: {temperature: 0.3}
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Gemini returned ${response.status}.`);
        const result = await response.json();
        const translatedText = String(result?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '').trim();
        if (!translatedText || translatedText.length > 40000) throw new Error('Gemini returned an invalid translation.');
        return {provider: 'gemini', translatedText};
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}

// بيولّد الصوت عبر Gemini
export function createGeminiSpeechProvider(environment = process.env, fetchImpl = fetch) {
  if (String(environment.SPEECH_PROVIDER || '').trim().toLowerCase() !== 'gemini') return null;
  const apiKey = environment.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = String(environment.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts');
  const defaultVoice = String(environment.GEMINI_TTS_VOICE || 'Kore');

  const NATIVE_VOICE = /^(ar-[a-z]{2}-[a-z]+-\d{1,3}|voice_[A-Za-z0-9]{6,64})$/;
  async function postJson(url, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 20000);
    try {
      const response = await fetchImpl(url, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey}, body: JSON.stringify(body), signal: controller.signal});
      if (!response.ok) throw new Error(`Gemini TTS returned ${response.status}.`);
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async function synthesizePrebuilt(voiceName, text, useModel = model) {
    const result = await postJson(`${API_BASE}/models/${useModel}:generateContent`, {
      // النص بيتبعت لوحده: أي جملة تعليمات قبله كان الصوت بينطقها بصوت عالي
      contents: [{parts: [{text: String(text)}]}],
      generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName}}}}
    });
    const data = String(result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '');
    if (!data) throw new Error('Gemini TTS returned no audio.');
    return data;
  }
  async function synthesizeInteraction(voice, text) {
    const result = await postJson(`${API_BASE}/interactions`, {
      model,
      input: [{type: 'user_input', content: [{type: 'text', text}]}],
      response_format: {type: 'audio'},
      generation_config: {speech_config: [{voice}]}
    });
    const data = String(result?.output_audio?.data || findAudioData(result) || '');
    if (!data) throw new Error('Gemini TTS returned no audio.');
    return data;
  }
  // The audio block can sit at different depths in the response; find the first base64 "data" next to an audio mime type.
  function findAudioData(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 6) return '';
    if (typeof node.data === 'string' && node.data.length > 1000 && (!node.mime_type || /^audio\//.test(String(node.mime_type)))) return node.data;
    for (const value of Object.values(node)) {
      const found = findAudioData(value, depth + 1);
      if (found) return found;
    }
    return '';
  }

  return {
    name: 'gemini',
    async synthesize({text, voice}) {
      const requested = /^[A-Z][A-Za-z]{2,30}$/.test(String(voice || '')) ? voice : defaultVoice;
      const fallbackVoice = /^[A-Z][A-Za-z]{2,30}$/.test(String(environment.GEMINI_TTS_FALLBACK_VOICE || '')) ? environment.GEMINI_TTS_FALLBACK_VOICE : 'Kore';
      // Native library voices (for example ar-eg-storyteller-3) go through the Interactions endpoint.
      // If that fails, retry once with the classic prebuilt voice before the chain falls back to Edge.
      let audioBase64;
      if (NATIVE_VOICE.test(requested)) {
        try { audioBase64 = await synthesizeInteraction(requested, text); } catch { audioBase64 = ''; }
      }
      if (!audioBase64) {
        const classic = NATIVE_VOICE.test(requested) ? fallbackVoice : requested;
        // النص بيتبعت لوحده من غير تعليمات؛ لو الطريقة الكلاسيكية فشلت نجرب Interactions بنفس الصوت
        try { audioBase64 = await synthesizePrebuilt(classic, text); }
        catch {
          // لو الموديل وصل للحد المجاني بنجرب موديل تاني مجاني قبل ما نسيب الدور للمزود اللي بعده
          try { audioBase64 = await synthesizeInteraction(classic, text); }
          catch { audioBase64 = await synthesizePrebuilt(classic, text, 'gemini-2.5-flash-preview-tts'); }
        }
      }
      const wav = wavFromPcm(audioBase64);
      if (wav.length > 4_200_000) throw new Error('Gemini TTS audio chunk is too large.');
      const pcmBytes = Buffer.from(audioBase64, 'base64');
      const isRiff = pcmBytes.subarray(0, 4).toString('ascii') === 'RIFF';
      const durationMs = ((isRiff ? pcmBytes.length - 44 : pcmBytes.length) / 2 / 24000) * 1000;
      const words = estimateWordTimings(text, durationMs);
      return {provider: 'gemini', contentType: 'audio/wav', audioBase64: wav, words, estimatedWords: true};
    }
  };
}

// بيشكّل النص العربي عبر Gemini (تشكيل فقط، من غير تغيير أي حرف)
export function createGeminiDiacritizationProvider(environment = process.env, fetchImpl = fetch) {
  const apiKey = environment.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = String(environment.GEMINI_MODEL || 'gemini-3.5-flash-lite');

  return {
    name: 'gemini',
    async diacritize({text}) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 9000);
      try {
        const response = await fetchImpl(`${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            contents: [{parts: [{text: `Add full Arabic diacritics (tashkeel) to the text below, correctly and in context. Rules: do not change, add, remove or reorder any letter, word, punctuation, digit, space or line break. Only add the diacritic marks (fatha, damma, kasra, sukun, shadda, tanween, etc). Return ONLY the diacritized text, nothing else.\n\nText:\n${text}`}]}],
            generationConfig: {temperature: 0}
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Gemini returned ${response.status}.`);
        const result = await response.json();
        const out = String(result?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '').replace(/^```[a-z]*\n?|```$/g, '').trim();
        if (!out || out.length > 60000) throw new Error('Gemini returned an invalid diacritization.');
        return out;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}
