import {sendError, parseJsonBody, validateRequired, getRequestId, sendJson} from '../_lib/response.js';
import {resolveSupabaseUser} from '../_lib/supabase-auth.js';
import {enforceApiQuota} from '../_lib/quota.js';
import {importUrlPreview} from '../_lib/url-extractor.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  if (request.method && request.method.toUpperCase() !== 'POST') {
    return sendError(response, 'method_not_allowed', 'This endpoint accepts POST requests only.', requestId, 405);
  }
  const user = await resolveSupabaseUser(request, response, requestId);
  if (!user) return;

  const body = parseJsonBody(request);
  const missing = validateRequired(body, ['url']);
  if (missing.length > 0) {
    return sendError(response, 'missing_fields', `Missing required fields: ${missing.join(', ')}`, requestId, 400);
  }
  if (!await enforceApiQuota(request, response, requestId, user.userId, 'url-import')) return;

  try {
    const preview = await importUrlPreview(body.url, {
      timeoutMs: Number(process.env.URL_IMPORT_TIMEOUT_MS) || 10000,
      maxBytes: Number(process.env.URL_IMPORT_MAX_BYTES) || 5 * 1024 * 1024,
      maxRedirects: Math.min(3, Math.max(0, Number(process.env.URL_IMPORT_MAX_REDIRECTS) || 3))
    });
    return sendJson(response, 200, {
      ok: true,
      requestId,
      mode: 'configured',
      preview: {...preview, sourceUrl: String(body.url)},
      note: preview.needsClientRender
        ? 'This page needs JavaScript rendering. Use the Send to Hikma bookmarklet or paste the story text.'
        : 'Only add content you are allowed to read. It stays private to you.'
    });
  } catch (error) {
    const message = String(error.message || 'Unable to import this URL.');
    const code = message.includes('robots.txt') || message.includes('disallows') ? 'robots_disallowed'
      : message.includes('non-public') || message.includes('Only ports') || message.includes('Only public') ? 'blocked_url'
        : message.includes('5 MB') ? 'url_too_large'
          : message.includes('timed out') ? 'url_timeout'
            : message.includes('content') || message.includes('HTTP') ? 'url_fetch_failed'
              : 'invalid_url';
    const status = code === 'robots_disallowed' ? 403 : code === 'url_too_large' ? 413 : code === 'url_timeout' ? 504 : code === 'url_fetch_failed' ? 502 : 400;
    return sendError(response, code, message.slice(0, 240), requestId, status);
  }
}
