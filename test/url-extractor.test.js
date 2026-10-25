import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertRobotsAllowed, extractArticle, fetchPublicResource, isPublicAddress, resolvePublicAddress} from '../api/_lib/url-extractor.js';

test('URL SSRF address policy rejects loopback, private, link-local, and metadata ranges', async () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '192.168.1.2', '169.254.169.254', '::1', 'fd00::1', 'fe80::1']) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress('93.184.216.34'), true);
  await assert.rejects(resolvePublicAddress('private.example', async () => [{address: '10.0.0.5', family: 4}]), /non-public/);
});

test('redirect destinations are resolved and blocked independently', async () => {
  const lookupImpl = async hostname => hostname === 'public.example'
    ? [{address: '93.184.216.34', family: 4}]
    : [{address: '127.0.0.1', family: 4}];
  const requestImpl = async url => ({status: 302, headers: {location: 'http://private.example/admin'}, body: Buffer.alloc(0)});
  await assert.rejects(fetchPublicResource('https://public.example/story', {lookupImpl, requestImpl}), /non-public/);
});

test('Readability extraction returns story paragraphs without navigation or footer text', () => {
  const html = '<!doctype html><html lang="en"><head><title>Story</title></head><body><nav>Menu Home Search</nav><main><article><h1>The Lantern</h1><p>This is the first meaningful paragraph of the story, long enough for readability extraction.</p><p>This is the second meaningful paragraph where the child finds a quiet lantern near the river.</p></article></main><footer>Related links and copyright menu</footer></body></html>';
  const result = extractArticle(html, 'https://stories.example/the-lantern');
  assert.equal(result.title, 'The Lantern');
  assert.equal(result.language, 'en');
  assert.equal(result.paragraphs, 2);
  assert.match(result.text, /first meaningful paragraph/);
  assert.doesNotMatch(result.text, /Menu Home Search|Related links/);
  assert.equal(result.needsClientRender, false);
});

test('robots policy can deny a story path before fetching its content', async () => {
  const lookupImpl = async () => [{address: '93.184.216.34', family: 4}];
  const requestImpl = async url => ({status: 200, headers: {'content-type': 'text/plain'}, body: Buffer.from(url.pathname === '/robots.txt' ? 'User-agent: *\nDisallow: /private' : 'story')});
  await assert.rejects(assertRobotsAllowed('https://stories.example/private/chapter', {lookupImpl, requestImpl}), /disallows/);
});

test('saved synthetic site fixtures extract story-only content, including embedded lore JSON', async () => {
  const fixtures = [
    ['blog-article.html', 'The Lantern Keeper', 'Mira found a lantern'],
    ['news-feature.html', 'Le jardin partagé', 'les voisins arrosaient'],
    ['magazine-story.html', 'Der Papierdrache', 'Emil faltete'],
    ['community-post.html', 'La cometa azul', 'Lucía encontró'],
    ['game-lore-shell.html', 'The Glass Orchard', 'A traveler crossed']
  ];
  for (const [file, expectedTitle, expectedLine] of fixtures) {
    const html = await readFile(new URL(`./fixtures/${file}`, import.meta.url), 'utf8');
    const result = extractArticle(html, `https://fixtures.example/${file}`);
    assert.equal(result.title, expectedTitle, file);
    assert.match(result.text, new RegExp(expectedLine), file);
    assert.doesNotMatch(result.text, /Home Topics Search|Daily menu|Archives Newsletter|Comunidad Cuenta|Loading the tale/);
  }
});
