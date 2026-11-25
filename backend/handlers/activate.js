// ============================================================
// نقطة تفعيل الدخول بكود: تقبل الكود التجريبي في وضع العرض فقط وترفض في الإنتاج.
// ============================================================
import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from '../lib/response.js';
import {enforceApiQuota} from '../lib/quota.js';
import {activationCodeHash} from '../lib/activation.js';

// الدالة الرئيسية للنقطة دي
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

  // التفعيل الحقيقي: الكود بيتفحص في Supabase على السيرفر بس (الهاش بس هو المخزّن)
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return sendError(response, 'activation_unavailable', 'Production activation is not configured yet.', requestId, 503);
  }
  const hash = activationCodeHash(provided);
  if (!hash) {
    return sendError(response, 'invalid_activation_code', 'كود التفعيل غير صحيح.', requestId, 401);
  }
  // حد للمحاولات عشان محدش يخمّن الأكواد
  if (!(await enforceApiQuota(request, response, requestId, null, 'activate'))) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const result = await fetch(`${supabaseUrl}/rest/v1/rpc/redeem_activation_code`, {
      method: 'POST',
      headers: {apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({p_code_hash: hash}),
      signal: controller.signal
    });
    if (!result.ok) {
      return sendError(response, 'activation_unavailable', 'Activation service is temporarily unavailable.', requestId, 503);
    }
    const data = await result.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.redeemed) {
      return sendError(response, 'invalid_activation_code', 'كود التفعيل غير صحيح أو انتهت صلاحيته.', requestId, 401);
    }
    return sendJson(response, 200, {
      ok: true,
      mode: 'production',
      requestId,
      message: 'تم التفعيل.',
      activation: {status: 'active', expiresAt: row.expires_at || null}
    });
  } catch {
    return sendError(response, 'activation_unavailable', 'Activation service is temporarily unavailable.', requestId, 503);
  } finally {
    clearTimeout(timeoutId);
  }
}
