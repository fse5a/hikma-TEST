// ============================================================
// ردود الخادم الموحدة: JSON والأخطاء ومعرّف الطلب وقراءة الجسم.
// ============================================================
import {randomUUID, createHash} from 'node:crypto';

// بيولّد معرّف فريد لكل طلب
export function makeRequestId() {
  return randomUUID();
}

// بيقرا معرّف الطلب من الهيدر أو بيولّد واحد جديد
export function getRequestId(req) {
  const header = req?.headers?.['x-request-id'] || req?.headers?.['X-Request-Id'];
  return Array.isArray(header) ? header[0] : (header || makeRequestId());
}

// بيبعت رد JSON
export function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

// بيبعت خطأ موحد برمز ورسالة
export function sendError(res, code, message, requestId, statusCode = 400) {
  return sendJson(res, statusCode, {
    error: { code, message, requestId: requestId || makeRequestId() }
  });
}

// بيقرا جسم الطلب كـJSON مع حد للحجم
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

// بيشوف هل الخادم في وضع العرض التجريبي
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
