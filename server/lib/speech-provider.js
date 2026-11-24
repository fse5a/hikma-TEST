const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4']);

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