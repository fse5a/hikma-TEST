// ============================================================
// نقطة تحويل النص لصوت: تتحقق من المستخدم والحصة، وتجرب الأصوات بالترتيب، وتخزن الصوت.
// ============================================================
import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from '../lib/response.js';
import {createSpeechProvider, createGoogleSpeechProvider} from '../lib/speech-provider.js';
import {createGeminiSpeechProvider} from '../lib/gemini-provider.js';
import {createEdgeSpeechProvider} from '../lib/edge-provider.js';
import {createElevenSpeechProvider, ELEVEN_VOICE} from '../lib/eleven-provider.js';
import {resolveSupabaseUser} from '../lib/supabase-auth.js';
import {enforceApiQuota} from '../lib/quota.js';
import {loadPrivateAudio, storePrivateAudio} from '../lib/audio-cache.js';

// هنا بنستقبل الطلب
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

  // Ordered fallback chain: if a provider fails (quota, outage), the next one answers.
  const showcase = voice === ELEVEN_VOICE ? createElevenSpeechProvider() : null;
  const providers = [showcase, createSpeechProvider(), createGoogleSpeechProvider(), createGeminiSpeechProvider(), createEdgeSpeechProvider()].filter(Boolean);
  const provider = providers[0];
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  const cacheConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Keyless path: a free provider (Edge demo voice) with no Supabase configured.
  // No auth, quota, or server cache is possible; the client-side per-story
  // cache in restored-features.js keeps repeat plays offline.
  if (provider && !supabaseConfigured) {
    let result;
    try {
      result = await synthesizeWithFallback(providers, {text, language, voice, rate, pitch});
    } catch {
      return sendError(response, 'speech_provider_failed', 'Speech service is temporarily unavailable.', requestId, 502);
    }
    return sendJson(response, 200, {ok: true, requestId, mode: 'configured', cached: false, ...result});
  }

  const user = await resolveSupabaseUser(request, response, requestId, {providerConfigured: Boolean(provider)});
  if (!user) return;
  if (provider && !await enforceApiQuota(request, response, requestId, user.userId, 'speech')) return;

  if (provider) {
    const identity = {userId: user.userId, provider: provider.name, voice, language, text, rate, pitch};
    if (cacheConfigured) {
      try {
        for (const candidate of providers) {
          const cached = await loadPrivateAudio({...identity, provider: candidate.name});
          if (cached) return sendJson(response, 200, {ok: true, requestId, mode: 'configured', provider: candidate.name, cached: true, ...cached});
        }
      } catch {
        return sendError(response, 'audio_storage_failed', 'Private audio cache is unavailable.', requestId, 503);
      }
    }
    let result;
    try {
      result = await synthesizeWithFallback(providers, {text, language, voice, rate, pitch});
    } catch {
      return sendError(response, 'speech_provider_failed', 'Speech service is temporarily unavailable.', requestId, 502);
    }
    if (cacheConfigured) {
      try {
        await storePrivateAudio({...identity, provider: result.provider, audioBase64: result.audioBase64, contentType: result.contentType, words: result.words});
      } catch {
        return sendError(response, 'audio_storage_failed', 'Private audio storage is unavailable; the generated audio was not returned.', requestId, 503);
      }
      return sendJson(response, 200, {ok: true, requestId, mode: 'configured', cached: true, ...result});
    }
    return sendJson(response, 200, {ok: true, requestId, mode: 'configured', cached: false, ...result});
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

// يجرب المزودات بالترتيب لحد ما واحد ينجح
async function synthesizeWithFallback(providers, payload) {
  let lastError;
  for (const candidate of providers) {
    try {
      // صوت العرض خاص بـElevenLabs بس؛ باقي المزودات بتاخد صوتها العادي
      const own = candidate.name === 'elevenlabs' || payload.voice !== ELEVEN_VOICE ? payload : {...payload, voice: 'device'};
      return await candidate.synthesize(own);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No speech provider is configured.');
}
