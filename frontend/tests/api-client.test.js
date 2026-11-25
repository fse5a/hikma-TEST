import test from 'node:test';
import assert from 'node:assert/strict';

await import('../api-client.js');
const api = globalThis.HikmaApi;

test('friendly Arabic messaging handles network failures', () => {
  const message = api.toFriendlyMessage(new Error('Failed to fetch'));
  assert.match(message, /تعذر|حاول|الوضع التجريبي/i);
});

test('demo fallback returns a safe local response when the backend is not configured', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async path => String(path).endsWith('/api/health')
    ? {ok: true, status: 200, async json() { return {ok: true, mode: 'demo'}; }}
    : {ok: false, status: 503, async json() { return {error: {code: 'not_configured', message: 'This deployment is not configured.'}}; }};

  try {
    const result = await api.request('/api/speech', {method: 'POST', body: JSON.stringify({text: 'مرحبا', language: 'ar', voice: 'device'})});
    assert.equal(result.mode, 'demo');
    assert.equal(result.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('503 is not demo success unless health explicitly reports demo mode', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async path => {
    requests.push(String(path));
    return String(path).endsWith('/api/health')
      ? {ok: true, status: 200, async json() { return {ok: true, mode: 'production'}; }}
      : {ok: false, status: 503, async json() { return {error: {code: 'not_configured', message: 'Not configured.'}}; }};
  };

  try {
    await assert.rejects(api.activate('1234'), error => {
      assert.equal(error.code, 'not_configured');
      assert.match(error.message, /لم يتم التفعيل/);
      return true;
    });
    assert.ok(requests.includes('/api/health'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('200 demo activation response is rejected when health reports production', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async path => String(path).endsWith('/api/health')
    ? {ok: true, status: 200, async json() { return {ok: true, mode: 'production'}; }}
    : {ok: true, status: 200, async json() { return {ok: true, mode: 'demo'}; }};
  try {
    await assert.rejects(api.activate('1234'), error => {
      assert.equal(error.code, 'not_configured');
      assert.match(error.message, /لم يتم التفعيل/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('network failures produce a friendly Arabic error instead of false demo success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };

  try {
    await assert.rejects(api.health(), /تعذر الاتصال/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('request timeout produces a friendly Arabic error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_path, {signal}) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), {name: 'AbortError'})));
  });

  try {
    await assert.rejects(api.request('/api/health', {timeoutMs: 5}), /انتهت مهلة الاتصال/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
