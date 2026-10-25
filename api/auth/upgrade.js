import {sendError, parseJsonBody, getRequestId, sendJson} from '../_lib/response.js';
import {resolveSupabaseUser} from '../_lib/supabase-auth.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }
  const user = await resolveSupabaseUser(request, response, requestId);
  if (!user) return;
  const body = parseJsonBody(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(response, 'invalid_email', 'Enter a valid email address.', requestId, 400);
  if (password.length < 8 || password.length > 72) return sendError(response, 'invalid_password', 'Password must contain 8 to 72 characters.', requestId, 400);

  const supabaseUrl = String(process.env.SUPABASE_URL).replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const authorization = request.headers?.authorization || request.headers?.Authorization;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json', apikey: anonKey, Authorization: authorization},
      body: JSON.stringify({email, password}),
      signal: controller.signal
    });
    const updatedUser = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || updatedUser.id !== user.userId) {
      return sendError(response, 'account_upgrade_failed', 'Unable to upgrade this account. Check your email or password requirements.', requestId, 400);
    }
    return sendJson(response, 200, {ok: true, requestId, user: {id: updatedUser.id, email: updatedUser.email || email, is_anonymous: false}, confirmationRequired: updatedUser.email_confirmed_at == null});
  } catch {
    return sendError(response, 'auth_unavailable', 'Authentication is temporarily unavailable.', requestId, 503);
  } finally {
    clearTimeout(timeoutId);
  }
}
