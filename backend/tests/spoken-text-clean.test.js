// الصوت لازم ينطق نص القصة بس. أي جملة تعليمات جوه النص المتبعت كانت بتتقرأ بصوت عالي (حصل في Gemini).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createGeminiSpeechProvider} from '../lib/gemini-provider.js';
import {createElevenSpeechProvider, ELEVEN_VOICE} from '../lib/eleven-provider.js';

const STORY = 'كان يا ما كان، في قديم الزمان.';
const instruction = /read aloud|exactly as written|no additions|say the following|speak the following|اقرأ النص/i;

test('gemini prebuilt voice: the request contains only the story text', async () => {
  const bodies = [];
  const pcm = Buffer.alloc(4800).toString('base64');
  const p = createGeminiSpeechProvider({SPEECH_PROVIDER: 'gemini', GEMINI_API_KEY: 'k'}, async (u, init) => { bodies.push(JSON.parse(init.body)); return {ok: true, json: async () => ({candidates: [{content: {parts: [{inlineData: {data: pcm}}]}}]})}; });
  await p.synthesize({text: STORY, voice: 'Kore'});
  assert.equal(bodies[0].contents[0].parts[0].text, STORY);
  assert.equal(JSON.stringify(bodies[0]).match(instruction), null);
});

test('gemini native voice: the interaction input is only the story text', async () => {
  const bodies = [];
  const pcm = Buffer.alloc(48000).toString('base64');
  const p = createGeminiSpeechProvider({SPEECH_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', GEMINI_TTS_VOICE: 'ar-eg-storyteller-3'}, async (u, init) => { bodies.push(JSON.parse(init.body)); return {ok: true, json: async () => ({outputs: [{type: 'audio', mime_type: 'audio/wav', data: pcm}]})}; });
  await p.synthesize({text: STORY, voice: 'neural'});
  assert.equal(bodies[0].input[0].content[0].text, STORY);
  assert.equal(JSON.stringify(bodies[0]).match(instruction), null);
});

test('elevenlabs: the request text is only the story text', async () => {
  let sent;
  const env = {ELEVENLABS_API_KEY: 'k', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 's'};
  const f = async (url, opts = {}) => { url = String(url);
    if (url.includes('/storage/v1/object/authenticated/')) return {ok: true, status: 200, json: async () => ({used: 0})};
    if (url.includes('/storage/v1/object/hikma')) return {ok: true, status: 200};
    sent = JSON.parse(opts.body); return {ok: true, status: 200, arrayBuffer: async () => Buffer.from('abc')}; };
  await createElevenSpeechProvider(env, f).synthesize({text: STORY, voice: ELEVEN_VOICE});
  assert.equal(sent.text, STORY);
});

test('no provider or client file contains a spoken instruction prefix', () => {
  const dirs = [new URL('../lib/', import.meta.url), new URL('../../frontend/', import.meta.url)];
  const bad = [];
  for (const d of dirs) for (const f of readdirSync(d).filter(n => n.endsWith('.js'))) {
    const src = readFileSync(new URL(f, d), 'utf8');
    if (/Read aloud the following|exactly as written, with no additions/i.test(src)) bad.push(f);
  }
  assert.deepEqual(bad, []);
});

test('audio cache key changed so audio made with the old prompt is never reused', () => {
  assert.match(readFileSync(new URL('../lib/audio-cache.js', import.meta.url), 'utf8'), /v2-clean-prompt/);
});
