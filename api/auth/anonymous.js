import {sendError, getRequestId, sendJson} from '../_lib/response.js';
import {enforceApiQuota} from '../_lib/quota.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return sendError(response, 'auth_not_configured', 'Anonymous accounts are not configured.', requestId, 503);
  if (!await enforceApiQuota(request, response, requestId, null, 'anonymous-signup')) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', apikey: anonKey},
      body: JSON.stringify({data: {hikma_anonymous: true}}),
      signal: controller.signal
    });
    const session = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || !session.access_token || !session.refresh_token || !session.user?.id) {
      return sendError(response, 'anonymous_signup_failed', 'Unable to start an anonymous session. Check Supabase anonymous sign-in settings.', requestId, 502);
    }
    return sendJson(response, 200, {
      ok: true,
      requestId,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: Number(session.expires_in) || 3600,
      user: {id: session.user.id, is_anonymous: session.user.is_anonymous === true}
    });
  } catch {
    return sendError(response, 'auth_unavailable', 'Authentication is temporarily unavailable.', requestId, 503);
  } finally {
    clearTimeout(timeoutId);
  }
}
