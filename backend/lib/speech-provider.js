const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4']);

// ============================================================
// مزودات تحويل النص لصوت: مزود عام (Worker) ومزود Google.
// ============================================================
// مزود الصوت العام عبر رابط Worker خارجي
export function createSpeechProvider(environment = process.env, fetchImpl = fetch) {
  if (!environment.SPEECH_WORKER_URL) return null;
  const providerName = String(environment.SPEECH_PROVIDER || 'worker').trim().toLowerCase();

  return {
    name: providerName,
    async synthesize({text, language, voice, rate, pitch}) {
      const url = new URL(environment.SPEECH_WORKER_URL);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
        throw new Error('Speech worker URL must use HTTPS.');
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 8000);
      try {
        const response = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(environment.SPEECH_API_KEY ? {Authorization: `Bearer ${environment.SPEECH_API_KEY}`} : {})
          },
          body: JSON.stringify({text, language, voice, rate, pitch}),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Speech worker returned ${response.status}.`);
        const result = await response.json();
        const contentType = String(result.contentType || 'audio/mpeg').split(';')[0].toLowerCase();
        if (!AUDIO_TYPES.has(contentType) || typeof result.audioBase64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(result.audioBase64)) {
          throw new Error('Speech worker returned an invalid audio payload.');
        }
        if (result.audioBase64.length > 4_200_000) throw new Error('Speech worker audio chunk is too large.');
        return {provider: providerName, contentType, audioBase64: result.audioBase64};
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}
const GOOGLE_LANGUAGE_CODES = {ar: 'ar-XA', en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', zh: 'cmn-CN'};
const GOOGLE_DEFAULT_VOICES = {
  // Google has no Arabic Neural2 voices; WaveNet is the natural Arabic tier with 4M free chars/month.
  ar: 'ar-XA-Wavenet-B',
  en: 'en-US-Neural2-J',
  fr: 'fr-FR-Neural2-B',
  de: 'de-DE-Neural2-B',
  es: 'es-ES-Neural2-B',
  zh: 'cmn-CN-Wavenet-B'
};

// بيختار صوت Google المناسب للغة
function resolveGoogleVoice(voice, language) {
  const languageCode = GOOGLE_LANGUAGE_CODES[language] || 'en-US';
  if (!voice || voice === 'device' || voice === `neural-${language}`) {
    return {languageCode, name: GOOGLE_DEFAULT_VOICES[language] || GOOGLE_DEFAULT_VOICES.en};
  }
  // Allow explicit Google voice names for the requested language only.
  if (/^[A-Za-z0-9-]{3,60}$/.test(voice) && voice.startsWith(languageCode)) {
    return {languageCode, name: voice};
  }
  return {languageCode, name: GOOGLE_DEFAULT_VOICES[language] || GOOGLE_DEFAULT_VOICES.en};
}

// Built-in Google Cloud Text-to-Speech provider with neural Arabic voices.
// Enabled when SPEECH_PROVIDER=google and GOOGLE_TTS_API_KEY is set.
// ده بتاع مزود صوت Google
export function createGoogleSpeechProvider(environment = process.env, fetchImpl = fetch) {
  if (String(environment.SPEECH_PROVIDER || '').trim().toLowerCase() !== 'google') return null;
  const apiKey = environment.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;

  return {
    name: 'google',
    async synthesize({text, language, voice, rate, pitch}) {
      const voiceConfig = resolveGoogleVoice(voice, language);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 8000);
      try {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
        const response = await fetchImpl(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            input: {text},
            voice: voiceConfig,
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: Math.max(0.5, Math.min(2, Number(rate) || 1)),
              pitch: Math.max(-6, Math.min(6, Number(pitch) || 0))
            }
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Google TTS returned ${response.status}.`);
        const result = await response.json();
        const audioBase64 = String(result.audioContent || '');
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64) || !audioBase64) {
          throw new Error('Google TTS returned an invalid audio payload.');
        }
        if (audioBase64.length > 4_200_000) throw new Error('Google TTS audio chunk is too large.');
        return {provider: 'google', contentType: 'audio/mpeg', audioBase64};
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}
