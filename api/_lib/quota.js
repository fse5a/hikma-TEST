import {createHmac} from 'node:crypto';
import {sendError} from './response.js';

export async function enforceApiQuota(request, response, requestId, userId, metric) {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    sendError(response, 'quota_not_configured', 'Server-side usage limits are not configured.', requestId, 503);
    return false;
  }

  const forwarded = request?.headers?.['x-forwarded-for'] || request?.headers?.['X-Forwarded-For'] || '';
  const ip = String(forwarded).split(',')[0].trim() || request?.socket?.remoteAddress || 'unknown';
  const ipHash = createHmac('sha256', serviceKey).update(ip).digest('hex');
  const timeout = Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const quotaResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_api_quota`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_ip_hash: ipHash,
        p_metric: metric,
        p_ip_per_minute: Number(process.env.IP_RATE_LIMIT_PER_MINUTE) || 30,
        p_user_per_minute: Number(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 20,
        p_user_per_hour: Number(process.env.RATE_LIMIT_REQUESTS_PER_HOUR) || 300,
        p_user_per_day: Number(process.env.DAILY_QUOTA_FREE) || 200,
        p_user_per_month: Number(process.env.MONTHLY_QUOTA_FREE) || 2000
      }),
      signal: controller.signal
    });
    if (!quotaResponse.ok) {
      sendError(response, 'quota_unavailable', 'Usage limits are temporarily unavailable.', requestId, 503);
      return false;
    }
    const result = await quotaResponse.json();
    const entry = Array.isArray(result) ? result[0] : result;
    if (!entry?.allowed) {
      sendError(response, 'quota_exceeded', 'لقد وصلت إلى حد الاستخدام المجاني. حاول لاحقًا.', requestId, 429);
      return false;
    }
    return true;
  } catch {
    sendError(response, 'quota_unavailable', 'Usage limits are temporarily unavailable.', requestId, 503);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
