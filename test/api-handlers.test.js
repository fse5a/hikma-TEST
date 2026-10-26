import test from 'node:test';
import assert from 'node:assert/strict';
import activate from '../api/activate.js';
import diacritize from '../api/diacritize.js';
import health from '../api/health.js';
import anonymousSession from '../api/auth/anonymous.js';
import upgradeAccount from '../api/auth/upgrade.js';
import speech from '../api/speech.js';
import translate from '../api/translate.js';
import {resolveSupabaseUser} from '../api/_lib/supabase-auth.js';
import {enforceApiQuota} from '../api/_lib/quota.js';

function responseRecorder() {
  return {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test('demo activation accepts the default demo code and rejects other codes', async () => {
  const previousAppMode = process.env.APP_MODE;
  const previousDemoMode = process.env.DEMO_MODE;
  const previousDemoCode = process.env.DEMO_ACTIVATION_CODE;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  process.env.APP_MODE = 'demo';
  process.env.DEMO_MODE = 'true';
  delete process.env.DEMO_ACTIVATION_CODE;
  delete process.env.SUPABASE_URL;
  try {
    const response = responseRecorder();
    await activate({method: 'POST', headers: {}, body: {code: '1234'}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.mode, 'demo');
    assert.equal(response.payload.activation.status, 'demo');

    const invalidResponse = responseRecorder();
    await activate({method: 'POST', headers: {}, body: {code: 'wrong'}}, invalidResponse);
    assert.equal(invalidResponse.statusCode, 401);
  } finally {
    if (previousAppMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previousAppMode;
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
    if (previousDemoCode === undefined) delete process.env.DEMO_ACTIVATION_CODE;
    else process.env.DEMO_ACTIVATION_CODE = previousDemoCode;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
  }
});

test('translation, diacritization, and speech handlers return demo-only results', async () => {
  const previousMode = process.env.APP_MODE;
  const previousDemoMode = process.env.DEMO_MODE;
  process.env.APP_MODE = 'demo';
  process.env.DEMO_MODE = 'true';
  try {
    const translation = responseRecorder();
    await translate({method: 'POST', headers: {}, body: {text: 'مرحبا', targetLanguage: 'en'}}, translation);
    assert.equal(translation.statusCode, 200);
    assert.equal(translation.payload.mode, 'demo');
    assert.equal(translation.payload.translatedText, 'مرحبا');

    const diacritization = responseRecorder();
    await diacritize({method: 'POST', headers: {}, body: {text: 'مدـ'}}, diacritization);
    assert.equal(diacritization.statusCode, 200);
    assert.equal(diacritization.payload.mode, 'demo');
    assert.equal(diacritization.payload.text, 'مدـ');

    const speechResult = responseRecorder();
    await speech({method: 'POST', headers: {}, body: {text: 'مرحبا', voice: 'device', language: 'ar'}}, speechResult);
    assert.equal(speechResult.statusCode, 200);
    assert.equal(speechResult.payload.mode, 'demo');
    assert.equal(speechResult.payload.audioUrl, null);
  } finally {
    if (previousMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previousMode;
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
  }
});

test('diacritization worker output is accepted only when original letters are preserved', async () => {
  const previousWorkerUrl = process.env.DIACRITIZATION_WORKER_URL;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousAnonKey = process.env.SUPABASE_ANON_KEY;
  const previousServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.DIACRITIZATION_WORKER_URL = 'https://diacritics.example/process';
  process.env.SUPABASE_URL = 'https://hikma-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'public-test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'private-service-key';
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/auth/v1/user')) return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6'}; }};
    if (String(url).endsWith('/rest/v1/rpc/consume_api_quota')) return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
    return {ok: true, async json() { return {text: 'مَدّ'}; }};
  };
  try {
    const response = responseRecorder();
    await diacritize({method: 'POST', headers: {authorization: 'Bearer valid-test-token'}, body: {text: 'مد'}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.mode, 'configured');
    assert.equal(response.payload.text, 'مَدّ');

    globalThis.fetch = async url => {
      if (String(url).endsWith('/auth/v1/user')) return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6'}; }};
      if (String(url).endsWith('/rest/v1/rpc/consume_api_quota')) return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
      return {ok: true, async json() { return {text: 'مَدّ كلمة'}; }};
    };
    const invalidResponse = responseRecorder();
    await diacritize({method: 'POST', headers: {authorization: 'Bearer valid-test-token'}, body: {text: 'مد'}}, invalidResponse);
    assert.equal(invalidResponse.statusCode, 502);
    assert.equal(invalidResponse.payload.error.code, 'invalid_diacritization');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousAnonKey;
    if (previousServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceKey;
    if (previousWorkerUrl === undefined) delete process.env.DIACRITIZATION_WORKER_URL;
    else process.env.DIACRITIZATION_WORKER_URL = previousWorkerUrl;
  }
});

test('configured speech provider returns audio without exposing its secret key', async () => {
  const previousWorkerUrl = process.env.SPEECH_WORKER_URL;
  const previousProvider = process.env.SPEECH_PROVIDER;
  const previousApiKey = process.env.SPEECH_API_KEY;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousAnonKey = process.env.SUPABASE_ANON_KEY;
  const previousServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SPEECH_WORKER_URL = 'https://speech.example/synthesize';
  process.env.SPEECH_PROVIDER = 'test-worker';
  process.env.SPEECH_API_KEY = 'private-test-key';
  process.env.SUPABASE_URL = 'https://hikma-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'public-test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'private-service-key';
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/auth/v1/user')) return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6'}; }};
    if (String(url).endsWith('/rest/v1/rpc/consume_api_quota')) return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
    if (String(url).includes('/storage/v1/object/hikma-private-audio/')) {
      assert.equal(options.headers.Authorization, 'Bearer private-service-key');
      assert.equal(options.headers['x-upsert'], 'true');
      return {ok: true, async json() { return {}; }};
    }
    if (String(url).includes('/rest/v1/audio_cache')) {
      assert.equal(options.headers.Authorization, 'Bearer private-service-key');
      if (options.method !== 'POST') return {ok: true, async json() { return []; }};
      const record = JSON.parse(options.body);
      assert.equal(record.user_id, '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6');
      assert.match(record.storage_key, /^7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6\//);
      return {ok: true, async json() { return {}; }};
    }
    assert.equal(options.headers.Authorization, 'Bearer private-test-key');
    return {ok: true, async json() { return {contentType: 'audio/mpeg', audioBase64: 'AQID'}; }};
  };
  try {
    const response = responseRecorder();
    await speech({method: 'POST', headers: {authorization: 'Bearer valid-test-token'}, body: {text: 'مرحبا', voice: 'neural-ar', language: 'ar', rate: 1, pitch: 0}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.mode, 'configured');
    assert.equal(response.payload.provider, 'test-worker');
    assert.equal(response.payload.audioBase64, 'AQID');
    assert.equal(JSON.stringify(response.payload).includes('private-test-key'), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousAnonKey;
    if (previousServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceKey;
    if (previousWorkerUrl === undefined) delete process.env.SPEECH_WORKER_URL;
    else process.env.SPEECH_WORKER_URL = previousWorkerUrl;
    if (previousProvider === undefined) delete process.env.SPEECH_PROVIDER;
    else process.env.SPEECH_PROVIDER = previousProvider;
    if (previousApiKey === undefined) delete process.env.SPEECH_API_KEY;
    else process.env.SPEECH_API_KEY = previousApiKey;
  }
});

test('health endpoint reports integration status without exposing secret values', async () => {
  const previousAppMode = process.env.APP_MODE;
  const previousDemoMode = process.env.DEMO_MODE;
  process.env.APP_MODE = 'demo';
  process.env.DEMO_MODE = 'true';
  const response = responseRecorder();
  try {
    await health({headers: {}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.ok, true);
    assert.equal(response.payload.mode, 'demo');
    assert.ok(response.payload.integrations);
    assert.equal(JSON.stringify(response.payload).includes(process.env.SUPABASE_SERVICE_ROLE_KEY || 'never-a-secret'), false);
  } finally {
    if (previousAppMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previousAppMode;
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
  }
});

test('health endpoint never defaults an unset deployment to demo mode', async () => {
  const previousAppMode = process.env.APP_MODE;
  const previousDemoMode = process.env.DEMO_MODE;
  delete process.env.APP_MODE;
  delete process.env.DEMO_MODE;
  try {
    const response = responseRecorder();
    await health({headers: {}}, response);
    assert.equal(response.payload.mode, 'production');
  } finally {
    if (previousAppMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previousAppMode;
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
  }
});

test('production activation fails closed when Supabase is not configured', async () => {
  const previousAppMode = process.env.APP_MODE;
  const previousDemoMode = process.env.DEMO_MODE;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  process.env.APP_MODE = 'production';
  process.env.DEMO_MODE = 'false';
  delete process.env.SUPABASE_URL;
  try {
    const response = responseRecorder();
    await activate({method: 'POST', headers: {}, body: {code: '1234'}}, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.error.code, 'not_configured');
  } finally {
    if (previousAppMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previousAppMode;
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
  }
});

test('configured translation worker returns translated text without exposing its key', async () => {
  const previousWorkerUrl = process.env.TRANSLATION_WORKER_URL;
  const previousApiKey = process.env.TRANSLATION_API_KEY;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousAnonKey = process.env.SUPABASE_ANON_KEY;
  const previousServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.TRANSLATION_WORKER_URL = 'https://translate.example/translate';
  process.env.TRANSLATION_API_KEY = 'private-translation-key';
  process.env.SUPABASE_URL = 'https://hikma-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'public-test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'private-service-key';
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/auth/v1/user')) return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6'}; }};
    if (String(url).endsWith('/rest/v1/rpc/consume_api_quota')) return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
    assert.equal(options.headers.Authorization, 'Bearer private-translation-key');
    return {ok: true, async json() { return {translatedText: 'A short story.'}; }};
  };
  try {
    const response = responseRecorder();
    await translate({method: 'POST', headers: {authorization: 'Bearer valid-test-token'}, body: {text: 'قصة قصيرة.', targetLanguage: 'en'}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.mode, 'configured');
    assert.equal(response.payload.translatedText, 'A short story.');
    assert.equal(JSON.stringify(response.payload).includes('private-translation-key'), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousAnonKey;
    if (previousServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceKey;
    if (previousWorkerUrl === undefined) delete process.env.TRANSLATION_WORKER_URL;
    else process.env.TRANSLATION_WORKER_URL = previousWorkerUrl;
    if (previousApiKey === undefined) delete process.env.TRANSLATION_API_KEY;
    else process.env.TRANSLATION_API_KEY = previousApiKey;
  }
});

test('production activation does not accept the demo code when Supabase is present', async () => {
  const previousAppMode = process.env.APP_MODE;
  const previousDemoMode = process.env.DEMO_MODE;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  process.env.APP_MODE = 'production';
  process.env.DEMO_MODE = 'false';
  process.env.SUPABASE_URL = 'https://project.example';
  try {
    const response = responseRecorder();
    await activate({method: 'POST', headers: {}, body: {code: '1234'}}, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.error.code, 'activation_unavailable');
  } finally {
    if (previousAppMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = previousAppMode;
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previousDemoMode;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
  }
});

test('health recommends country language before browser Accept-Language', async () => {
  const response = responseRecorder();
  await health({headers: {'x-vercel-ip-country': 'FR', 'accept-language': 'de-DE,de;q=0.9'}}, response);
  assert.equal(response.payload.recommendedLanguage, 'fr');

  const acceptedLanguage = responseRecorder();
  await health({headers: {'accept-language': 'de-DE,de;q=0.9,en;q=0.8'}}, acceptedLanguage);
  assert.equal(acceptedLanguage.payload.recommendedLanguage, 'de');
});

test('anonymous auth route returns session tokens but never Supabase keys', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  const previousServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://hikma-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'server-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-service-key';
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/rest/v1/rpc/consume_api_quota')) return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
    assert.equal(String(url), 'https://hikma-test.supabase.co/auth/v1/signup');
    assert.equal(options.headers.apikey, 'server-anon-key');
    return {ok: true, async json() { return {access_token: 'user-access', refresh_token: 'user-refresh', expires_in: 3600, user: {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6', is_anonymous: true}}; }};
  };
  try {
    const response = responseRecorder();
    await anonymousSession({method: 'POST', headers: {}, body: {}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.access_token, 'user-access');
    assert.equal(JSON.stringify(response.payload).includes('server-anon-key'), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousKey;
    if (previousServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceKey;
  }
});

test('provider middleware rejects missing tokens and returns verified Supabase user IDs', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://hikma-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'server-anon-key';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://hikma-test.supabase.co/auth/v1/user');
    assert.equal(options.headers.Authorization, 'Bearer verified-token');
    return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6'}; }};
  };
  try {
    const rejected = responseRecorder();
    assert.equal(await resolveSupabaseUser({headers: {}}, rejected, 'request-id', {providerConfigured: true}), null);
    assert.equal(rejected.statusCode, 401);

    const accepted = await resolveSupabaseUser({headers: {authorization: 'Bearer verified-token'}}, responseRecorder(), 'request-id', {providerConfigured: true});
    assert.equal(accepted.userId, '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousKey;
  }
});

test('email upgrade is applied to the verified anonymous user session', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://hikma-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'server-anon-key';
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/auth/v1/user') && options.method === 'PUT') {
      assert.equal(options.headers.Authorization, 'Bearer verified-token');
      assert.equal(JSON.parse(options.body).email, 'reader@example.org');
      return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6', email: 'reader@example.org'}; }};
    }
    return {ok: true, async json() { return {id: '7b4e30b4-70e3-4d4a-8a91-c5afd62c65a6'}; }};
  };
  try {
    const response = responseRecorder();
    await upgradeAccount({method: 'POST', headers: {authorization: 'Bearer verified-token'}, body: {email: 'reader@example.org', password: 'good-password-42'}}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.user.email, 'reader@example.org');
    assert.equal(JSON.stringify(response.payload).includes('server-anon-key'), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousKey;
  }
});