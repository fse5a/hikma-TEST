// Built-in contextual translation through any OpenAI-compatible chat API.
// Enabled when TRANSLATION_PROVIDER=openai (or OPENAI_API_KEY is set) and
// OPENAI_API_KEY is configured. Optional: OPENAI_BASE_URL, OPENAI_MODEL.

const LANGUAGE_NAMES = {ar: 'Arabic', en: 'English', fr: 'French', de: 'German', es: 'Spanish', zh: 'Chinese (Simplified)'};

// خاص بمزود الترجمة عبر رابط Worker خارجي
export function createTranslationProvider(environment = process.env, fetchImpl = fetch) {
  const apiKey = environment.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = String(environment.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = String(environment.OPENAI_MODEL || 'gpt-4o-mini');
  if (!/^https:\/\//.test(baseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl)) return null;

  return {
    name: 'openai',
    async translate({text, targetLanguage}) {
      const targetName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 15000);
      try {
        const response = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`},
          body: JSON.stringify({
            model,
            temperature: 0.3,
            messages: [
              {
                role: 'system',
                content: 'You are a professional literary translator for a children\'s reading app. Translate the meaning naturally and contextually, never word-for-word. Keep the tone warm and age-appropriate, keep names, and return ONLY the translated text with no commentary.'
              },
              {role: 'user', content: `Translate the following text into ${targetName}:\n\n${text}`}
            ]
          }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Translation provider returned ${response.status}.`);
        const result = await response.json();
        const translatedText = String(result?.choices?.[0]?.message?.content || '').trim();
        if (!translatedText || translatedText.length > 40000) throw new Error('Translation provider returned an invalid result.');
        return {provider: 'openai', translatedText};
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}
