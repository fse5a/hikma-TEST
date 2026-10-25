import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from './_lib/response.js';
import {createSpeechProvider} from './_lib/speech-provider.js';
import {resolveSupabaseUser} from './_lib/supabase-auth.js';
import {enforceApiQuota} from './_lib/quota.js';
import {loadPrivateAudio, storePrivateAudio} from './_lib/audio-cache.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }

  const body = parseJsonBody(request);
  const missing = validateRequired(body, ['text', 'voice', 'language']);
  if (missing.length > 0) {
    return sendError(response, 'missing_fields', `Missing required fields: ${missing.join(', ')}`, requestId, 400);
  }

  const text = String(body.text || '').trim();
  const voice = String(body.voice || 'device');
  const language = String(body.language || 'en');
  const rate = Number(body.rate ?? 1);
  const pitch = Number(body.pitch ?? 0);
  if (!text || text.length > 1200) return sendError(response, 'invalid_text', 'Speech text must be between 1 and 1200 characters.', requestId, 400);
  if (!['ar', 'en', 'fr', 'de', 'es', 'zh'].includes(language)) return sendError(response, 'invalid_language', 'Language is not supported.', requestId, 400);
  if (!/^[\w:-]{1,100}$/.test(voice)) return sendError(response, 'invalid_voice', 'Voice identifier is invalid.', requestId, 400);
  if (!Number.isFinite(rate) || rate < 0.5 || rate > 2 || !Number.isFinite(pitch) || pitch < -6 || pitch > 6) {
    return sendError(response, 'invalid_voice_settings', 'Rate must be 0.5-2 and pitch must be -6 to 6 semitones.', requestId, 400);
  }

  const user = await resolveSupabaseUser(request, response, requestId, {providerConfigured: Boolean(process.env.SPEECH_WORKER_URL)});
  if (!user) return;
  if (process.env.SPEECH_WORKER_URL && !await enforceApiQuota(request, response, requestId, user.userId, 'speech')) return;

  const provider = createSpeechProvider();
  if (provider) {
    const identity = {userId: user.userId, provider: provider.name, voice, language, text, rate, pitch};
    try {
      const cached = await loadPrivateAudio(identity);
      if (cached) return sendJson(response, 200, {ok: true, requestId, mode: 'configured', provider: provider.name, cached: true, ...cached});
    } catch {
      return sendError(response, 'audio_storage_failed', 'Private audio cache is unavailable.', requestId, 503);
    }
    let result;
    try {
      result = await provider.synthesize({text, language, voice, rate, pitch});
    } catch {
      return sendError(response, 'speech_provider_failed', 'Speech service is temporarily unavailable.', requestId, 502);
    }
    try {
      await storePrivateAudio({...identity, provider: result.provider, audioBase64: result.audioBase64, contentType: result.contentType});
    } catch {
      return sendError(response, 'audio_storage_failed', 'Private audio storage is unavailable; the generated audio was not returned.', requestId, 503);
    }
    return sendJson(response, 200, {ok: true, requestId, mode: 'configured', cached: true, ...result});
  }

  return sendJson(response, 200, {
    ok: true,
    requestId,
    mode: 'demo',
    provider: voice === 'device' ? 'device' : 'demo-provider',
    language,
    voice,
    audioUrl: null,
    note: 'Speech worker is not configured; use device speech as the free local fallback.'
  });
}
