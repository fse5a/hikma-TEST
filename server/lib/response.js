import {randomUUID, createHash} from 'node:crypto';

export function makeRequestId() {
  return randomUUID();
}

export function getRequestId(req) {
  const header = req?.headers?.['x-request-id'] || req?.headers?.['X-Request-Id'];
  return Array.isArray(header) ? header[0] : (header || makeRequestId());
}

export function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

export function sendError(res, code, message, requestId, statusCode = 400) {
  return sendJson(res, statusCode, {
    error: { code, message, requestId: requestId || makeRequestId() }
  });
}

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

export function validateRequired(body, requiredKeys) {
  const missing = requiredKeys.filter((key) => body[key] === undefined || body[key] === null || body[key] === '');
  return missing;
}

export function getDemoStatus() {
  return {
    mode: process.env.APP_MODE === 'demo' || process.env.DEMO_MODE === 'true' ? 'demo' : 'production',
    demoActivationCode: process.env.DEMO_ACTIVATION_CODE || '1234'
  };
}

export function hashValue(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}
