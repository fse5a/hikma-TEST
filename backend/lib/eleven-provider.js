// ============================================================
// ElevenLabs (الخطة المجانية): صوت العرض فقط، بحد شهري ١٠ آلاف حرف بعدّاد.
// بيشتغل بس لو المفتاح موجود، وبس لما الطلب يطلب صوت "Eleven" (قصص العرض).
// أي مشكلة (حد، خطأ) بترمي خطأ والسلسلة العادية تكمل.
// ============================================================
const BUCKET = 'hikma-private-audio';
export const ELEVEN_VOICE = 'Eleven';
export const ELEVEN_MAX_CHARS_PER_REQUEST = 400;
const HARD_MONTHLY_CAP = 10000;

// اسم ملف عدّاد الشهر
function counterPath(now = new Date()) {
  return `_counters/elevenlabs-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}.json`;
}

// بيجيب عدد الحروف المستخدمة الشهر ده
export async function readElevenUsage(environment = process.env, fetchImpl = fetch, now = new Date()) {
  const base = String(environment.SUPABASE_URL || '').replace(/\/$/, '');
  const key = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Counter storage is not configured.');
  const response = await fetchImpl(`${base}/storage/v1/object/authenticated/${BUCKET}/${counterPath(now)}`, {headers: {apikey: key, Authorization: `Bearer ${key}`}});
  if (response.status === 404 || response.status === 400) return 0;
  if (!response.ok) throw new Error('Counter read failed.');
  const data = await response.json().catch(() => ({}));
  return Math.max(0, Number(data.used) || 0);
}

// بيسجّل الحروف المستخدمة
async function writeElevenUsage(used, environment, fetchImpl, now) {
  const base = String(environment.SUPABASE_URL || '').replace(/\/$/, '');
  const key = environment.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetchImpl(`${base}/storage/v1/object/${BUCKET}/${counterPath(now)}`, {
    method: 'POST',
    headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'x-upsert': 'true'},
    body: JSON.stringify({used, updated: now.toISOString()})
  });
  if (!response.ok) throw new Error('Counter write failed.');
}

export function createElevenSpeechProvider(environment = process.env, fetchImpl = fetch) {
  const apiKey = environment.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  const cap = Math.min(HARD_MONTHLY_CAP, Number(environment.ELEVENLABS_MONTHLY_CAP) || 9500);
  return {
    name: 'elevenlabs',
    async synthesize({text, voice}) {
      if (voice !== ELEVEN_VOICE) throw new Error('Showcase voice only.');
      if (text.length > ELEVEN_MAX_CHARS_PER_REQUEST) throw new Error('Line too long for the showcase voice.');
      const now = new Date();
      const used = await readElevenUsage(environment, fetchImpl, now);
      if (used + text.length > cap) throw new Error('Monthly showcase voice cap reached.');
      // بنسجّل الأول (حذر): لو الطلب فشل، العدّاد أعلى شوية من الحقيقة، مش أقل
      await writeElevenUsage(used + text.length, environment, fetchImpl, now);
      const voiceId = /^[A-Za-z0-9]{10,40}$/.test(environment.ELEVENLABS_VOICE_ID || '') ? environment.ELEVENLABS_VOICE_ID : 'JBFqnCBsd6RMkjVDRZzb';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Number(environment.UPSTREAM_TIMEOUT_MS) || 8000);
      try {
        const response = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
          method: 'POST',
          headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg'},
          body: JSON.stringify({text, model_id: 'eleven_multilingual_v2'}),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}.`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length || bytes.length > 3 * 1024 * 1024) throw new Error('ElevenLabs audio size is invalid.');
        return {provider: 'elevenlabs', contentType: 'audio/mpeg', audioBase64: bytes.toString('base64')};
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };
}
