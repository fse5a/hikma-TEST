import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from './_lib/response.js';
import {resolveSupabaseUser} from './_lib/supabase-auth.js';
import {enforceApiQuota} from './_lib/quota.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }

  const body = parseJsonBody(request);
  const missing = validateRequired(body, ['text']);
  if (missing.length > 0) {
    return sendError(response, 'missing_fields', `Missing required fields: ${missing.join(', ')}`, requestId, 400);
  }

  const text = String(body.text || '');
  if (!text.trim() || text.length > 20000) return sendError(response, 'invalid_text', 'Text must be between 1 and 20000 characters.', requestId, 400);
  const user = await resolveSupabaseUser(request, response, requestId, {providerConfigured: Boolean(process.env.DIACRITIZATION_WORKER_URL)});
  if (!user) return;
  if (process.env.DIACRITIZATION_WORKER_URL && !await enforceApiQuota(request, response, requestId, user.userId, 'diacritization')) return;
  if (!process.env.DIACRITIZATION_WORKER_URL) {
    return sendJson(response, 200, {
      ok: true,
      requestId,
      mode: 'demo',
      text,
      note: 'Diacritization worker is not configured; the original text was preserved.'
    });
  }
  let workerUrl;
  try {
    workerUrl = new URL(process.env.DIACRITIZATION_WORKER_URL);
    if (workerUrl.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    return sendError(response, 'diacritization_provider_failed', 'Diacritization service configuration is invalid.', requestId, 503);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const responseFromWorker = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.DIACRITIZATION_API_KEY ? {Authorization: `Bearer ${process.env.DIACRITIZATION_API_KEY}`} : {})
      },
      body: JSON.stringify({text, instruction: 'Add Arabic diacritics only. Do not change, remove, reorder, or add letters, words, punctuation, or whitespace.'}),
      signal: controller.signal
    });
    if (!responseFromWorker.ok) return sendError(response, 'diacritization_provider_failed', 'Diacritization service is temporarily unavailable.', requestId, 502);
    const result = await responseFromWorker.json();
    const diacritizedText = String(result.text || '');
    const removeMarks = value => value.replace(/[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    if (!diacritizedText || removeMarks(diacritizedText) !== removeMarks(text)) {
      return sendError(response, 'invalid_diacritization', 'The diacritization result changed the original letters; it was rejected.', requestId, 502);
    }
    return sendJson(response, 200, {ok: true, requestId, mode: 'configured', text: diacritizedText, provider: 'worker'});
  } catch {
    return sendError(response, 'diacritization_provider_failed', 'Diacritization service is temporarily unavailable.', requestId, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
