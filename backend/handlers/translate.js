// ============================================================
// نقطة الترجمة: تتحقق من المستخدم والحصة وتترجم بمزود Gemini أو Worker.
// ============================================================
import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from '../lib/response.js';
import {resolveSupabaseUser} from '../lib/supabase-auth.js';
import {enforceApiQuota} from '../lib/quota.js';
import {createTranslationProvider} from '../lib/translation-provider.js';
import {createGeminiTranslationProvider} from '../lib/gemini-provider.js';

// مسؤول عن معالجة الطلب القادم لهذه النقطة
export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }

  const body = parseJsonBody(request);
  const missing = validateRequired(body, ['text', 'targetLanguage']);
  if (missing.length > 0) {
    return sendError(response, 'missing_fields', `Missing required fields: ${missing.join(', ')}`, requestId, 400);
  }

  const targetLanguage = String(body.targetLanguage || 'en');
  const text = String(body.text || '');
  if (!text.trim() || text.length > 20000) return sendError(response, 'invalid_text', 'Text must be between 1 and 20000 characters.', requestId, 400);
  if (!['ar', 'en', 'fr', 'de', 'es', 'zh'].includes(targetLanguage)) return sendError(response, 'invalid_language', 'Target language is not supported.', requestId, 400);
  const provider = process.env.TRANSLATION_WORKER_URL ? null : (createTranslationProvider() || createGeminiTranslationProvider());
  const translationConfigured = Boolean(process.env.TRANSLATION_WORKER_URL || provider);
  // Keyless path: a provider is configured but Supabase is not, so auth and
  // quota cannot run; translate anonymously (same approach as /api/speech).
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  if (!translationConfigured || supabaseConfigured) {
    const user = await resolveSupabaseUser(request, response, requestId, {providerConfigured: translationConfigured});
    if (!user) return;
    if (translationConfigured && !await enforceApiQuota(request, response, requestId, user.userId, 'translation')) return;
  }

  if (process.env.TRANSLATION_WORKER_URL) {
    try {
      const workerUrl = new URL(process.env.TRANSLATION_WORKER_URL);
      if (workerUrl.protocol !== 'https:') throw new Error('Translation worker URL must use HTTPS.');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
      try {
        const workerResponse = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.TRANSLATION_API_KEY ? {Authorization: `Bearer ${process.env.TRANSLATION_API_KEY}`} : {})
          },
          body: JSON.stringify({text, targetLanguage, instruction: 'Translate only the supplied story text. Return JSON with translatedText only.'}),
          signal: controller.signal
        });
        if (!workerResponse.ok) return sendError(response, 'translation_provider_failed', 'Translation service is temporarily unavailable.', requestId, 502);
        const result = await workerResponse.json();
        const translatedText = String(result.translatedText || '').trim();
        if (!translatedText || translatedText.length > 40000) return sendError(response, 'invalid_translation', 'Translation service returned an invalid result.', requestId, 502);
        return sendJson(response, 200, {ok: true, requestId, mode: 'configured', targetLanguage, translatedText});
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      return sendError(response, 'translation_provider_failed', 'Translation service is temporarily unavailable.', requestId, 502);
    }
  }

  if (provider) {
    try {
      const result = await provider.translate({text, targetLanguage});
      return sendJson(response, 200, {ok: true, requestId, mode: 'configured', targetLanguage, provider: result.provider, translatedText: result.translatedText});
    } catch {
      return sendError(response, 'translation_provider_failed', 'Translation service is temporarily unavailable.', requestId, 502);
    }
  }

  return sendJson(response, 200, {
    ok: true,
    requestId,
    mode: 'demo',
    targetLanguage,
    text,
    translatedText: text,
    note: 'Manual translation remains the always-available fallback when external providers are unavailable.'
  });
}
