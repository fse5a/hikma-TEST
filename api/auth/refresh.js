import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from '../_lib/response.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }
  const body = parseJsonBody(request);
  const missing = validateRequired(body, ['refresh_token']);
  if (missing.length) return sendError(response, 'missing_fields', `Missing required fields: ${missing.join(', ')}`, requestId, 400);
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return sendError(response, 'auth_not_configured', 'Session refresh is not configured.', requestId, 503);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', apikey: anonKey},
      body: JSON.stringify({refresh_token: String(body.refresh_token)}),
      signal: controller.signal
    });
    const session = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || !session.access_token || !session.refresh_token) {
      return sendError(response, 'invalid_refresh_token', 'Your session expired. Start a new session.', requestId, 401);
    }
    return sendJson(response, 200, {
      ok: true,
      requestId,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: Number(session.expires_in) || 3600,
      user: {id: session.user?.id, is_anonymous: session.user?.is_anonymous === true}
    });
  } catch {
    return sendError(response, 'auth_unavailable', 'Authentication is temporarily unavailable.', requestId, 503);
  } finally {
    clearTimeout(timeoutId);
  }
}
