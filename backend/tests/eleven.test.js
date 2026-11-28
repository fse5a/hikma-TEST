import test from 'node:test';
import assert from 'node:assert/strict';
import {createElevenSpeechProvider, ELEVEN_VOICE} from '../lib/eleven-provider.js';

const env = {ELEVENLABS_API_KEY: 'k', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 's'};
function fakeFetch(state) {
  return async (url, opts = {}) => {
    url = String(url);
    if (url.includes('/storage/v1/object/authenticated/')) return state.used == null ? {ok: false, status: 404} : {ok: true, status: 200, json: async () => ({used: state.used})};
    if (url.includes('/storage/v1/object/hikma')) { state.used = JSON.parse(opts.body).used; return {ok: true, status: 200}; }
    if (url.includes('api.elevenlabs.io')) { state.calls++; return {ok: true, status: 200, arrayBuffer: async () => Buffer.from('abc')}; }
    throw new Error('unexpected ' + url);
  };
}

test('no key: provider is off', () => assert.equal(createElevenSpeechProvider({}), null));
test('only the showcase voice uses ElevenLabs', async () => {
  const st = {used: null, calls: 0};
  await assert.rejects(createElevenSpeechProvider(env, fakeFetch(st)).synthesize({text: 'مرحبا', voice: 'Aoede'}));
  assert.equal(st.calls, 0);
});
test('counts characters and stops at the cap', async () => {
  const st = {used: 9490, calls: 0};
  const p = createElevenSpeechProvider(env, fakeFetch(st));
  await assert.rejects(p.synthesize({text: 'ا'.repeat(20), voice: ELEVEN_VOICE}));
  assert.equal(st.calls, 0);
  const r = await p.synthesize({text: 'ا'.repeat(5), voice: ELEVEN_VOICE});
  assert.equal(r.provider, 'elevenlabs'); assert.equal(st.used, 9495); assert.equal(st.calls, 1);
});
test('cap never goes above 10000 even if env says more', async () => {
  const st = {used: 9990, calls: 0};
  const p = createElevenSpeechProvider({...env, ELEVENLABS_MONTHLY_CAP: '50000'}, fakeFetch(st));
  await assert.rejects(p.synthesize({text: 'ا'.repeat(20), voice: ELEVEN_VOICE}));
});
test('long lines are refused so one line cannot burn the month', async () => {
  const st = {used: 0, calls: 0};
  await assert.rejects(createElevenSpeechProvider(env, fakeFetch(st)).synthesize({text: 'ا'.repeat(401), voice: ELEVEN_VOICE}));
});
