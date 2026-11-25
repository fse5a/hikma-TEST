// ============================================================
// ردود الخادم الموحدة: JSON والأخطاء ومعرّف الطلب وقراءة الجسم.
// ============================================================
import {randomUUID, createHash} from 'node:crypto';

// مسؤول عن توليد معرّف فريد لكل طلب
export function makeRequestId() {
  return randomUUID();
}

// مسؤول عن قراءة معرّف الطلب من الهيدر أو توليد جديد
export function getRequestId(req) {
  const header = req?.headers?.['x-request-id'] || req?.headers?.['X-Request-Id'];
  return Array.isArray(header) ? header[0] : (header || makeRequestId());
}

// مسؤول عن إرسال رد JSON
export function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

// مسؤول عن إرسال خطأ موحد برمز ورسالة
export function sendError(res, code, message, requestId, statusCode = 400) {
  return sendJson(res, statusCode, {
    error: { code, message, requestId: requestId || makeRequestId() }
  });
}

// مسؤول عن قراءة جسم الطلب كـJSON مع حد للحجم
export function parseJsonBody(req) {
  if (!req || !req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

// مسؤول عن التحقق من وجود الحقول المطلوبة
export function validateRequired(body, requiredKeys) {
  const missing = requiredKeys.filter((key) => body[key] === undefined || body[key] === null || body[key] === '');
  return missing;
}

// مسؤول عن معرفة هل الخادم في وضع العرض التجريبي
export function getDemoStatus() {
  return {
    mode: process.env.APP_MODE === 'demo' || process.env.DEMO_MODE === 'true' ? 'demo' : 'production',
    demoActivationCode: process.env.DEMO_ACTIVATION_CODE || '1234'
  };
}

// مسؤول عن تشفير قيمة (Hash) بدون كشفها
export function hashValue(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}
