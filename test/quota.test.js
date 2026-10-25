import test from 'node:test';
import assert from 'node:assert/strict';
import {enforceApiQuota} from '../api/_lib/quota.js';

function recorder() {
  return {statusCode: 0, payload: null, status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; }};
}

test('quota guard calls the private RPC with a hashed IP and permits allowed usage', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://project.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-secret';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://project.example/rest/v1/rpc/consume_api_quota');
    assert.equal(options.headers.apikey, 'server-only-secret');
    const body = JSON.parse(options.body);
    assert.notEqual(body.p_ip_hash, '203.0.113.9');
    assert.equal(body.p_user_id, 'user-id');
    return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
  };
  try {
    assert.equal(await enforceApiQuota({headers: {'x-forwarded-for': '203.0.113.9, 10.0.0.1'}}, recorder(), 'request', 'user-id', 'speech'), true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test('quota denial returns HTTP 429 and missing server credentials fail closed', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://project.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-secret';
  globalThis.fetch = async () => ({ok: true, async json() { return [{allowed: false, reason: 'daily_quota'}]; }});
  try {
    const denied = recorder();
    assert.equal(await enforceApiQuota({headers: {}}, denied, 'request', 'user-id', 'translation'), false);
    assert.equal(denied.statusCode, 429);
    assert.equal(denied.payload.error.code, 'quota_exceeded');

    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const unavailable = recorder();
    assert.equal(await enforceApiQuota({headers: {}}, unavailable, 'request', 'user-id', 'speech'), false);
    assert.equal(unavailable.statusCode, 503);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test('anonymous signup quota can be counted by IP before a user id exists', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://project.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-secret';
  globalThis.fetch = async (_url, options) => {
    assert.equal(JSON.parse(options.body).p_user_id, null);
    return {ok: true, async json() { return [{allowed: true, reason: null}]; }};
  };
  try {
    assert.equal(await enforceApiQuota({headers: {'x-forwarded-for': '203.0.113.10'}}, recorder(), 'request', null, 'anonymous-signup'), true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});