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

  return {
    name: 'gemini',
    async synthesize({text, voice}) {
      const voiceName = /^[A-Z][A-Za-z]{2,30}$/.test(String(voice || '')) ? voice : defaultVoice;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 20000);
      try {
        const response = await fetchImpl(`${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            contents: [{parts: [{text: `Read aloud the following text exactly as written, with no additions:\n\n${text}`}]}],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName}}}
            }
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Gemini TTS returned ${response.status}.`);
        const result = await response.json();
        const audioBase64 = String(result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '');
        if (!audioBase64) throw new Error('Gemini TTS returned no audio.');
        const wav = wavFromPcm(audioBase64);
        if (wav.length > 4_200_000) throw new Error('Gemini TTS audio chunk is too large.');
        return {provider: 'gemini', contentType: 'audio/wav', audioBase64: wav};
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}
