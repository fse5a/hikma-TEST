import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from './_lib/response.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }

  const body = parseJsonBody(request);
  const missing = validateRequired(body, ['code']);
  if (missing.length > 0) {
    return sendError(response, 'missing_fields', `Missing required fields: ${missing.join(', ')}`, requestId, 400);
  }

  const provided = String(body.code).trim();
  const demoCode = String(process.env.DEMO_ACTIVATION_CODE || '1234').trim();
  const demoMode = process.env.APP_MODE === 'demo' || process.env.DEMO_MODE === 'true';

  if (demoMode && !process.env.SUPABASE_URL && provided === demoCode) {
    return sendJson(response, 200, {
      ok: true,
      mode: 'demo',
      requestId,
      message: 'Activation accepted in demo mode.',
      activation: {
        status: 'demo',
        code: demoCode,
        expiresAt: null
      }
    });
  }

  if (demoMode && !process.env.SUPABASE_URL && provided !== demoCode) {
    return sendError(response, 'invalid_activation_code', 'The activation code is invalid. Use a valid demo code or configure Supabase.', requestId, 401);
  }

  if (!process.env.SUPABASE_URL && !demoMode) {
    return sendError(response, 'not_configured', 'Activation is not configured for this deployment.', requestId, 503);
  }

  return sendError(response, 'activation_unavailable', 'Production activation is not configured yet.', requestId, 503);
}
