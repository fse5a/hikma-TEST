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
  assert.match(worker, /'\.\/style\.css'/);
  assert.match(worker, /'\.\/pdf-import\.js'/);
  assert.match(worker, /'\.\/vendor\/pdf\.worker\.min\.mjs'/);
});

test('homepage loads the responsive redesign stylesheet from the project root', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const stylesheet = await readFile(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(html, /href="\/style\.css"/);
  assert.match(stylesheet, /\.onboarding \.gate-panel/);
  assert.match(stylesheet, /\.story-card:hover/);
  assert.match(stylesheet, /#audioPreview/);
});

test('Vercel uses root static files and has no catch-all rewrite overriding them', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(config.framework, null);
  assert.equal(config.outputDirectory, undefined);
  assert.equal(config.rewrites, undefined);
});
