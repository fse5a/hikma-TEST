import {sendJson, getRequestId, makeRequestId} from './_lib/response.js';

function integrationStatus(name, value) {
  if (!value) return 'missing';
  return value === 'demo' ? 'demo-mode' : 'configured';
}

function recommendedLanguage(request) {
  const country = String(request?.headers?.['x-vercel-ip-country'] || '').toUpperCase();
  const countryLanguages = {SA: 'ar', EG: 'ar', AE: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar', FR: 'fr', DE: 'de', ES: 'es', CN: 'zh'};
  if (countryLanguages[country]) return countryLanguages[country];
  const accepted = String(request?.headers?.['accept-language'] || '').split(',').map(item => item.split(';')[0].trim().toLowerCase());
  for (const language of accepted) {
    const code = language.split('-')[0];
    if (['ar', 'en', 'fr', 'de', 'es', 'zh'].includes(code)) return code;
  }
  return null;
}

export default async function handler(request, response) {
  const requestId = getRequestId(request) || makeRequestId();
  const mode = process.env.APP_MODE === 'demo' || process.env.DEMO_MODE === 'true' ? 'demo' : 'production';

  const integrations = {
    supabase: integrationStatus('supabase', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    auth: integrationStatus('auth', process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    ai: integrationStatus('ai', process.env.AI_API_KEY || process.env.AI_PROVIDER),
    translation: integrationStatus('translation', process.env.TRANSLATION_WORKER_URL),
    speech: integrationStatus('speech', process.env.SPEECH_WORKER_URL),
    quotas: integrationStatus('quotas', process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    privateAudioStorage: integrationStatus('private-audio-storage', process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    diacritization: integrationStatus('diacritization', process.env.DIACRITIZATION_WORKER_URL),
    render: integrationStatus('render', process.env.RENDER_WORKER_URL),
    ocr: integrationStatus('ocr', process.env.OCR_WORKER_URL),
    pdf: integrationStatus('pdf', process.env.PDF_WORKER_URL)
  };

  const payload = {
    ok: true,
    requestId,
    mode,
    recommendedLanguage: recommendedLanguage(request),
    platform: 'vercel',
    runtime: 'node-esm',
    deployment: {
      frontend: 'static',
      api: 'vercel-functions',
      database: process.env.SUPABASE_URL ? 'supabase' : 'demo-mode'
    },
    limits: {
      functionRuntimeSeconds: 10,
      freeSupabaseDatabaseMb: 500,
      freeSupabaseStorageGb: 1,
      freeUploadMb: 50,
      vercelHobby: 'personal-use only'
    },
    integrations,
    providers: {
      speech: process.env.SPEECH_PROVIDER || (process.env.SPEECH_WORKER_URL ? 'worker' : 'device'),
      diacritization: process.env.DIACRITIZATION_WORKER_URL ? 'worker' : 'none',
      translation: process.env.TRANSLATION_WORKER_URL ? 'worker' : 'none'
    },
    warnings: process.env.SUPABASE_URL ? [] : ['Supabase is not configured; the app is running in demo mode.'],
    features: {
      activation: 'demo-mode',
      sync: process.env.ENABLE_SUPABASE_SYNC === 'true' ? 'enabled' : 'demo-only',
      voiceSynthesis: process.env.SPEECH_WORKER_URL ? 'provider-enabled' : 'device-only',
      diacritization: process.env.DIACRITIZATION_WORKER_URL ? 'provider-enabled' : 'original-text-fallback'
    }
  };

  return sendJson(response, 200, payload);
}
