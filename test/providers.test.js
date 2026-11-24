import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleSpeechProvider} from '../server/lib/speech-provider.js';
import {createTranslationProvider} from '../server/lib/translation-provider.js';

test('google speech provider is disabled without key or flag', () => {
  assert.equal(createGoogleSpeechProvider({}), null);
  assert.equal(createGoogleSpeechProvider({SPEECH_PROVIDER: 'google'}), null);
  assert.equal(createGoogleSpeechProvider({GOOGLE_TTS_API_KEY: 'k'}), null);
});

test('google speech provider maps generic neural voice to Arabic Neural2 voice', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({url, body: JSON.parse(options.body)});
    return {ok: true, json: async () => ({audioContent: Buffer.from('mp3').toString('base64')})};
  };
  const provider = createGoogleSpeechProvider({SPEECH_PROVIDER: 'google', GOOGLE_TTS_API_KEY: 'test-key'}, fakeFetch);
  const result = await provider.synthesize({text: 'مرحبا', language: 'ar', voice: 'neural-ar', rate: 1, pitch: 0});
  assert.equal(result.provider, 'google');
  assert.equal(result.contentType, 'audio/mpeg');
  assert.equal(calls[0].body.voice.name, 'ar-XA-Neural2-B');
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
  assert.equal(calls[0].voice.name, 'ar-XA-Neural2-B');
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
