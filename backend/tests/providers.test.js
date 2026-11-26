import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleSpeechProvider} from '../lib/speech-provider.js';
import {createTranslationProvider} from '../lib/translation-provider.js';

test('google speech provider is disabled without key or flag', () => {
  assert.equal(createGoogleSpeechProvider({}), null);
  assert.equal(createGoogleSpeechProvider({SPEECH_PROVIDER: 'google'}), null);
  assert.equal(createGoogleSpeechProvider({GOOGLE_TTS_API_KEY: 'k'}), null);
});

test('google speech provider maps generic neural voice to the Arabic WaveNet voice (Google has no Arabic Neural2)', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({url, body: JSON.parse(options.body)});
    return {ok: true, json: async () => ({audioContent: Buffer.from('mp3').toString('base64')})};
  };
  const provider = createGoogleSpeechProvider({SPEECH_PROVIDER: 'google', GOOGLE_TTS_API_KEY: 'test-key'}, fakeFetch);
  const result = await provider.synthesize({text: 'مرحبا', language: 'ar', voice: 'neural-ar', rate: 1, pitch: 0});
  assert.equal(result.provider, 'google');
  assert.equal(result.contentType, 'audio/mpeg');
  assert.equal(calls[0].body.voice.name, 'ar-XA-Wavenet-B');
  assert.equal(calls[0].body.voice.languageCode, 'ar-XA');
  assert.ok(calls[0].url.includes('key=test-key'));
});

test('google speech provider rejects cross-language explicit voices', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return {ok: true, json: async () => ({audioContent: Buffer.from('x').toString('base64')})};
  };
  const provider = createGoogleSpeechProvider({SPEECH_PROVIDER: 'google', GOOGLE_TTS_API_KEY: 'k'}, fakeFetch);
  await provider.synthesize({text: 'hi', language: 'ar', voice: 'en-US-Neural2-J', rate: 1, pitch: 0});
  assert.equal(calls[0].voice.name, 'ar-XA-Wavenet-B');
});

test('google speech provider throws on upstream failure', async () => {
  const provider = createGoogleSpeechProvider({SPEECH_PROVIDER: 'google', GOOGLE_TTS_API_KEY: 'k'}, async () => ({ok: false, status: 500}));
  await assert.rejects(() => provider.synthesize({text: 'مرحبا', language: 'ar', voice: 'neural-ar', rate: 1, pitch: 0}));
});

test('translation provider is disabled without API key', () => {
  assert.equal(createTranslationProvider({}), null);
});

test('translation provider asks for contextual, non-literal translation', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({url, body: JSON.parse(options.body)});
    return {ok: true, json: async () => ({choices: [{message: {content: 'نص مترجم طبيعي'}}]})};
  };
  const provider = createTranslationProvider({OPENAI_API_KEY: 'k'}, fakeFetch);
  const result = await provider.translate({text: 'a brave little star', targetLanguage: 'ar'});
  assert.equal(result.translatedText, 'نص مترجم طبيعي');
  const systemPrompt = calls[0].body.messages[0].content;
  assert.match(systemPrompt, /naturally and contextually/);
  assert.match(systemPrompt, /never word-for-word/);
  assert.match(calls[0].body.messages[1].content, /Arabic/);
});

test('translation provider rejects invalid upstream payloads', async () => {
  const provider = createTranslationProvider({OPENAI_API_KEY: 'k'}, async () => ({ok: true, json: async () => ({choices: []})}));
  await assert.rejects(() => provider.translate({text: 'hello', targetLanguage: 'ar'}));
});

test('gemini translation provider is disabled without API key', async () => {
  const {createGeminiTranslationProvider} = await import('../lib/gemini-provider.js');
  assert.equal(createGeminiTranslationProvider({}), null);
});

test('gemini translation provider requests contextual translation and reads candidates', async () => {
  const {createGeminiTranslationProvider} = await import('../lib/gemini-provider.js');
  const calls = [];
  const provider = createGeminiTranslationProvider({GEMINI_API_KEY: 'k'}, async (url, options) => {
    calls.push({url, body: JSON.parse(options.body)});
    return {ok: true, json: async () => ({candidates: [{content: {parts: [{text: 'نجمة صغيرة شجاعة'}]}}]})};
  });
  const result = await provider.translate({text: 'a brave little star', targetLanguage: 'ar'});
  assert.equal(result.translatedText, 'نجمة صغيرة شجاعة');
  assert.match(calls[0].body.contents[0].parts[0].text, /naturally and contextually/);
  assert.ok(calls[0].url.includes('key=k'));
});

test('gemini speech provider wraps raw PCM into a WAV header', async () => {
  const {createGeminiSpeechProvider} = await import('../lib/gemini-provider.js');
  const pcm = Buffer.alloc(100, 1);
  const provider = createGeminiSpeechProvider({SPEECH_PROVIDER: 'gemini', GEMINI_API_KEY: 'k'}, async () => ({
    ok: true,
    json: async () => ({candidates: [{content: {parts: [{inlineData: {data: pcm.toString('base64')}}]}}]})
  }));
  const result = await provider.synthesize({text: 'مرحبا', language: 'ar', voice: 'neural-ar'});
  assert.equal(result.contentType, 'audio/wav');
  const wav = Buffer.from(result.audioBase64, 'base64');
  assert.equal(wav.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(wav.length, 144);
});

test('gemini speech provider requires the gemini flag and key', async () => {
  const {createGeminiSpeechProvider} = await import('../lib/gemini-provider.js');
  assert.equal(createGeminiSpeechProvider({}), null);
  assert.equal(createGeminiSpeechProvider({GEMINI_API_KEY: 'k'}), null);
  assert.equal(createGeminiSpeechProvider({SPEECH_PROVIDER: 'gemini'}), null);
});

import {createEdgeSpeechProvider, __edgeInternals} from '../lib/edge-provider.js';

test('edge speech provider is disabled unless explicitly selected or on Vercel without keys', () => {
  assert.equal(createEdgeSpeechProvider({}), null);
  assert.equal(createEdgeSpeechProvider({EDGE_TTS: 'off', VERCEL: '1'}), null);
  assert.equal(createEdgeSpeechProvider({SPEECH_PROVIDER: 'google', VERCEL: '1'}), null);
  // A stored key alone does not activate google/gemini speech: SPEECH_PROVIDER selects them.
  assert.equal(createEdgeSpeechProvider({GOOGLE_TTS_API_KEY: 'k', VERCEL: '1'})?.name, 'edge');
  assert.equal(createEdgeSpeechProvider({GEMINI_API_KEY: 'k', VERCEL: '1'})?.name, 'edge');
  assert.equal(createEdgeSpeechProvider({SPEECH_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', VERCEL: '1'}), null);
  assert.equal(createEdgeSpeechProvider({SPEECH_PROVIDER: 'google', GOOGLE_TTS_API_KEY: 'k', VERCEL: '1'}), null);
  assert.equal(createEdgeSpeechProvider({SPEECH_WORKER_URL: 'https://x', VERCEL: '1'}), null);
  assert.equal(createEdgeSpeechProvider({VERCEL: '1'})?.name, 'edge');
  assert.equal(createEdgeSpeechProvider({EDGE_TTS: 'on'})?.name, 'edge');
  assert.equal(createEdgeSpeechProvider({SPEECH_PROVIDER: 'edge'})?.name, 'edge');
});

test('edge speech provider maps Arabic to the Egyptian neural voice by default', () => {
  const {resolveVoice} = __edgeInternals;
  assert.equal(resolveVoice(undefined, 'ar'), 'ar-EG-SalmaNeural');
  assert.equal(resolveVoice('device', 'ar'), 'ar-EG-SalmaNeural');
  assert.equal(resolveVoice('neural-ar', 'ar'), 'ar-EG-SalmaNeural');
  assert.equal(resolveVoice('ar-EG-ShakirNeural', 'ar'), 'ar-EG-ShakirNeural');
  assert.equal(resolveVoice('en-US-Neural2-J', 'ar'), 'ar-EG-SalmaNeural');
  assert.equal(resolveVoice(undefined, 'en'), 'en-US-AvaNeural');
});

test('edge Sec-MS-GEC v2 token matches the reference test vector', () => {
  const token = __edgeInternals.generateSecMsGec(1791888000 * 1000);
  assert.equal(token, '492D7694A183A45E-56E821F95D4579C5B7C7E33DC7303FF379EC36D510213555BBBB9EB17EF15876');
});

test('gemini diacritization provider sends a strict prompt and returns the text', async () => {
  const {createGeminiDiacritizationProvider} = await import('../lib/gemini-provider.js');
  let sentBody;
  const provider = createGeminiDiacritizationProvider({GEMINI_API_KEY: 'k'}, async (url, options) => {
    sentBody = JSON.parse(options.body);
    return {ok: true, json: async () => ({candidates: [{content: {parts: [{text: 'كَانَ'}]}}]})};
  });
  assert.equal(await provider.diacritize({text: 'كان'}), 'كَانَ');
  assert.match(sentBody.contents[0].parts[0].text, /do not change, add, remove or reorder/i);
  assert.equal(createGeminiDiacritizationProvider({}), null);
});

test('gemini speech provider uses the Interactions endpoint for native voices and falls back to Kore', async () => {
  const {createGeminiSpeechProvider} = await import('../lib/gemini-provider.js');
  const pcm = Buffer.alloc(48000).toString('base64');
  const calls = [];
  const okInteraction = async (url, init) => {
    calls.push({url: String(url), body: JSON.parse(init.body), key: init.headers['x-goog-api-key']});
    return {ok: true, json: async () => ({status: 'completed', outputs: [{type: 'audio', mime_type: 'audio/wav', data: pcm}]})};
  };
  const native = createGeminiSpeechProvider({SPEECH_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', GEMINI_TTS_VOICE: 'ar-eg-storyteller-3', GEMINI_TTS_MODEL: 'm'}, okInteraction);
  const first = await native.synthesize({text: 'كان يا ما كان', voice: 'neural'});
  assert.equal(first.provider, 'gemini');
  assert.ok(calls[0].url.endsWith('/v1beta/interactions'));
  assert.equal(calls[0].body.generation_config.speech_config[0].voice, 'ar-eg-storyteller-3');
  assert.equal(calls[0].key, 'k');
  assert.ok(first.words.length > 0);

  const urls = [];
  const failingNative = async (url, init) => {
    urls.push(String(url));
    if (String(url).includes('/interactions')) return {ok: false, status: 429, json: async () => ({})};
    return {ok: true, json: async () => ({candidates: [{content: {parts: [{inlineData: {data: pcm}}]}}]})};
  };
  const fallback = createGeminiSpeechProvider({SPEECH_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', GEMINI_TTS_VOICE: 'ar-eg-storyteller-3', GEMINI_TTS_MODEL: 'm'}, failingNative);
  const second = await fallback.synthesize({text: 'كان يا ما كان', voice: 'neural'});
  assert.equal(second.provider, 'gemini');
  assert.ok(urls[0].includes('/interactions') && urls[1].includes(':generateContent'), 'native fails then Kore answers');
});
