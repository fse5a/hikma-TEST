import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('voice catalog is public metadata only and contains no enabled sample voices', async () => {
  const voices = JSON.parse(await readFile(new URL('../voices.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(voices));
  for (const voice of voices) {
    assert.ok(['ar', 'en'].includes(voice.language));
    assert.equal(typeof voice.consent, 'boolean');
    assert.equal(voice.consent, false);
    assert.equal('apiKey' in voice, false);
  }
});

test('package has no always-running server and lists only URL extraction runtime dependencies', async () => {
  const packageData = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageData.scripts.start, undefined);
  assert.deepEqual(Object.keys(packageData.dependencies).sort(), ['@mozilla/readability', 'jsdom']);
});

test('PWA app shell includes the local locale dictionaries', async () => {
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(worker, /'\.\/i18n\.js'/);
  assert.match(worker, /'\.\/pdf-import\.js'/);
  assert.match(worker, /'\.\/vendor\/pdf\.worker\.min\.mjs'/);
});