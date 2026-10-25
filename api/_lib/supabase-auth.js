import {sendError} from './response.js';

export function hasExplicitDemoMode(environment = process.env) {
  return environment.APP_MODE === 'demo' || environment.DEMO_MODE === 'true';
}

export async function resolveSupabaseUser(request, response, requestId, {providerConfigured = false} = {}) {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    if (hasExplicitDemoMode() && !providerConfigured) return {userId: null, demo: true};
    sendError(response, 'auth_not_configured', 'Authentication is not configured for this deployment.', requestId, 503);
    return null;
  }

  const authorization = request?.headers?.authorization || request?.headers?.Authorization || '';
  const tokenMatch = String(authorization).match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    sendError(response, 'unauthorized', 'Sign in anonymously to continue.', requestId, 401);
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {apikey: anonKey, Authorization: `Bearer ${tokenMatch[1]}`},
      signal: controller.signal
    });
    if (!authResponse.ok) {
      sendError(response, 'invalid_session', 'Your session expired. Reconnect to continue.', requestId, 401);
      return null;
    }
    const user = await authResponse.json();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(user.id || ''))) {
      sendError(response, 'invalid_session', 'The authentication service returned an invalid user.', requestId, 401);
      return null;
    }
    return {userId: user.id, demo: false};
  } catch {
    sendError(response, 'auth_unavailable', 'Authentication is temporarily unavailable.', requestId, 503);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
