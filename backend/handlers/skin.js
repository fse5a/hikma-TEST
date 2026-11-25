// ============================================================
// نقطة فتح السكنز: بتاخد كود وترجّع اسم السكن اللي بيفتحه. الفحص كله على السيرفر بالهاش.
// ============================================================
import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from '../lib/response.js';
import {enforceApiQuota} from '../lib/quota.js';
import {skinForCode} from '../lib/skin-codes.js';

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
  // حد للمحاولات عشان محدش يخمّن الأكواد (لو الحصص متظبطة على السيرفر)
  if (process.env.SUPABASE_URL && !(await enforceApiQuota(request, response, requestId, null, 'skin'))) return;
  const skin = skinForCode(String(body.code).trim());
  if (!skin) {
    return sendError(response, 'invalid_skin_code', 'كود السكن غير صحيح.', requestId, 401);
  }
  return sendJson(response, 200, {ok: true, requestId, skin, message: 'تم فتح السكن.'});
}
