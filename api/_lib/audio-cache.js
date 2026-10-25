import {createHash} from 'node:crypto';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function cacheHash({provider, voice, language, text, rate, pitch}) {
  return digest(JSON.stringify([provider, voice, language, text, rate, pitch]));
}

function serviceHeaders(serviceKey, extra = {}) {
  return {apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, ...extra};
}

export async function loadPrivateAudio({userId, provider, voice, language, text, rate, pitch}, environment = process.env, fetchImpl = fetch) {
  const supabaseUrl = String(environment.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !userId) throw new Error('Private audio storage is not configured.');
  const key = cacheHash({provider, voice, language, text, rate, pitch});
  const query = new URLSearchParams({user_id: `eq.${userId}`, 'metadata->>cache_hash': `eq.${key}`, select: 'storage_key,metadata', limit: '1'});
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const rowsResponse = await fetchImpl(`${supabaseUrl}/rest/v1/audio_cache?${query}`, {headers: serviceHeaders(serviceKey), signal: controller.signal});
    if (!rowsResponse.ok) throw new Error('Audio cache lookup failed.');
    const rows = await rowsResponse.json();
    const row = rows[0];
    if (!row?.storage_key || !row.storage_key.startsWith(`${userId}/`) || row.storage_key.includes('..')) return null;
    const audioResponse = await fetchImpl(`${supabaseUrl}/storage/v1/object/authenticated/hikma-private-audio/${row.storage_key.split('/').map(encodeURIComponent).join('/')}`, {headers: serviceHeaders(serviceKey), signal: controller.signal});
    if (audioResponse.status === 404) return null;
    if (!audioResponse.ok) throw new Error('Private audio retrieval failed.');
    const audio = Buffer.from(await audioResponse.arrayBuffer());
    if (!audio.length || audio.length > 4 * 1024 * 1024) throw new Error('Cached audio size is invalid.');
    return {audioBase64: audio.toString('base64'), contentType: row.metadata?.content_type || audioResponse.headers.get('content-type') || 'audio/mpeg'};
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function storePrivateAudio({userId, provider, voice, language, text, rate, pitch, audioBase64, contentType}, environment = process.env, fetchImpl = fetch) {
  const supabaseUrl = String(environment.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !userId) throw new Error('Private audio storage is not configured.');
  const key = cacheHash({provider, voice, language, text, rate, pitch});
  const storagePath = `${userId}/${key}.${contentType === 'audio/mpeg' ? 'mp3' : contentType.split('/')[1]}`;
  const bytes = Buffer.from(audioBase64, 'base64');
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error('Audio size is invalid.');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 8000);
  try {
    const upload = await fetchImpl(`${supabaseUrl}/storage/v1/object/hikma-private-audio/${storagePath.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: bytes,
      signal: controller.signal
    });
    if (!upload.ok) throw new Error('Private audio upload failed.');
    const metadata = await fetchImpl(`${supabaseUrl}/rest/v1/audio_cache?on_conflict=user_id,storage_key`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        storage_key: storagePath,
        provider,
        voice,
        metadata: {cache_hash: key, language, rate, pitch, content_type: contentType}
      }),
      signal: controller.signal
    });
    if (!metadata.ok) throw new Error('Audio cache metadata write failed.');
    return {storagePath, cacheHash: key};
  } finally {
    clearTimeout(timeoutId);
  }
}
