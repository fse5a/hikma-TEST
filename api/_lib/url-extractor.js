import {lookup as dnsLookup} from 'node:dns/promises';
import {BlockList, isIP} from 'node:net';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {JSDOM} from 'jsdom';
import {Readability} from '@mozilla/readability';

const MAX_REDIRECTS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;
const PUBLIC_USER_AGENT = 'HikmaReader/1.0 (+https://hikma.app; story preview; contact: support@hikma.app)';

const blockedAddresses = new BlockList();
const blockedIpv4Ranges = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]
];
for (const [address, prefix] of blockedIpv4Ranges) blockedAddresses.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of [
  ['::', 128], ['::1', 128], ['64:ff9b:1::', 48], ['100::', 64], ['2001:10::', 28],
  ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]
]) blockedAddresses.addSubnet(address, prefix, 'ipv6');

function ipv4Number(address) {
  return address.split('.').reduce((value, octet) => ((value << 8) | Number(octet)) >>> 0, 0);
}

function isBlockedIpv4(address) {
  const value = ipv4Number(address);
  return blockedIpv4Ranges.some(([network, prefix]) => {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) === (ipv4Number(network) & mask);
  });
}

export function isPublicAddress(address) {
  const family = isIP(address);
  if (!family) return false;
  if (family === 4) return !isBlockedIpv4(address);
  if (address.toLowerCase().startsWith('::ffff:')) return false;
  return !blockedAddresses.check(address, 'ipv6');
}

export async function resolvePublicAddress(hostname, lookupImpl = dnsLookup) {
  let addresses;
  if (isIP(hostname)) addresses = [{address: hostname, family: isIP(hostname)}];
  else {
    let timeoutId;
    try {
      addresses = await Promise.race([
        lookupImpl(hostname, {all: true, verbatim: true}),
        new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error('DNS lookup timed out.')), DEFAULT_TIMEOUT_MS); })
      ]);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  if (!addresses.length || addresses.some(record => !isPublicAddress(record.address))) {
    throw new Error('URL host resolves to a non-public address.');
  }
  return addresses[0];
}

function validateUrl(value) {
  const url = value instanceof URL ? new URL(value) : new URL(String(value));
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only public HTTP/HTTPS URLs are allowed.');
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  if (!['80', '443'].includes(port)) throw new Error('Only ports 80 and 443 are allowed.');
  return url;
}

async function requestPinned(url, address, {timeoutMs, maxBytes, requestImpl} = {}) {
  if (requestImpl) return requestImpl(url, {address, timeoutMs, maxBytes});
  const doRequest = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const request = doRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      agent: false,
      headers: {
        'User-Agent': PUBLIC_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
        'Accept-Encoding': 'identity',
        Host: url.host
      },
      lookup(_hostname, _options, callback) {
        callback(null, address.address, address.family);
      }
    }, response => {
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) {
          request.destroy(new Error('URL response exceeded the 5 MB limit.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({
        status: response.statusCode || 0,
        headers: response.headers,
        body: Buffer.concat(chunks)
      }));
      response.on('error', reject);
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error('URL request timed out.')));
    request.on('error', reject);
    request.end();
  });
}

export async function fetchPublicResource(input, options = {}) {
  const lookupImpl = options.lookupImpl || dnsLookup;
  const requestImpl = options.requestImpl;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes || MAX_BYTES;
  let url = validateUrl(input);
  for (let redirects = 0; redirects <= (options.maxRedirects ?? MAX_REDIRECTS); redirects++) {
    const address = await resolvePublicAddress(url.hostname, lookupImpl);
    const result = await requestPinned(url, address, {timeoutMs, maxBytes, requestImpl});
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      if (redirects === (options.maxRedirects ?? MAX_REDIRECTS)) throw new Error('Too many URL redirects.');
      if (!result.headers.location) throw new Error('URL redirect did not include a destination.');
      url = validateUrl(new URL(result.headers.location, url));
      continue;
    }
    return {...result, url};
  }
  throw new Error('Too many URL redirects.');
}

export async function assertRobotsAllowed(input, options = {}) {
  const url = validateUrl(input);
  const robotsUrl = new URL('/robots.txt', url.origin);
  const response = await fetchPublicResource(robotsUrl, {...options, maxRedirects: 0, maxBytes: 256 * 1024});
  if (response.status === 404) return true;
  if (response.status < 200 || response.status >= 300) throw new Error('Unable to check robots.txt for this site.');
  const lines = response.body.toString('utf8').split(/\r?\n/);
  let applies = false;
  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') applies = value === '*' || value.toLowerCase().includes('hikmareader');
    if (applies && key === 'disallow' && value && url.pathname.startsWith(value)) throw new Error('This site disallows automated story previews.');
  }
  return true;
}

export function extractArticle(html, sourceUrl) {
  const dom = new JSDOM(html, {url: sourceUrl});
  const document = dom.window.document;
  const originalLanguage = String(document.documentElement.lang || '').split('-')[0].toLowerCase();
  const sourceHeading = document.querySelector('article h1, main h1, h1')?.textContent.replace(/\s+/g, ' ').trim();
  const article = new Readability(document.cloneNode(true), {charThreshold: 120}).parse();
  if (!article?.textContent?.trim() || article.textContent.trim().length < 120) {
    const embedded = extractEmbeddedArticle(document);
    if (embedded) {
      const text = embedded.text.slice(0, 100_000);
      return {title: embedded.title.slice(0, 240), language: embedded.language || originalLanguage || (/[\u0600-\u06FF]/.test(text) ? 'ar' : 'unknown'), text, paragraphs: text.split(/\n\n/).filter(Boolean).length, wordCount: text.split(/\s+/).filter(Boolean).length, firstLines: text.split(/\n\n/).slice(0, 3), needsClientRender: false};
    }
    return {title: sourceHeading || document.title || new URL(sourceUrl).hostname, language: originalLanguage || 'unknown', text: '', paragraphs: [], needsClientRender: true};
  }
  const parsed = new JSDOM(article.content || '').window.document;
  const heading = parsed.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim();
  const paragraphs = [...parsed.querySelectorAll('p')].map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(item => item.length > 20);
  const text = (paragraphs.length ? paragraphs : [article.textContent.replace(/\s+/g, ' ').trim()]).join('\n\n').slice(0, 100_000);
  const arabic = /[\u0600-\u06FF]/.test(text);
  const language = ['ar', 'en', 'fr', 'de', 'es', 'zh'].includes(originalLanguage) ? originalLanguage : (arabic ? 'ar' : 'unknown');
  return {title: String(sourceHeading || heading || article.title || document.title).slice(0, 240), language, text, paragraphs: paragraphs.length, wordCount: text.split(/\s+/).filter(Boolean).length, firstLines: text.split(/\n\n/).slice(0, 3), needsClientRender: false};
}

function extractEmbeddedArticle(document) {
  const candidates = [];
  for (const element of document.querySelectorAll('script[type="application/ld+json"],script#__NEXT_DATA__')) {
    try { candidates.push(JSON.parse(element.textContent)); } catch {}
  }
  const seen = new Set();
  const visit = value => {
    if (!value || typeof value !== 'object' || seen.has(value)) return null;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) { const found = visit(item); if (found) return found; }
      return null;
    }
    const title = String(value.headline || value.title || value.name || '').trim();
    const rawBody = value.articleBody || value.storyBody || value.body;
    if (typeof rawBody === 'string' && rawBody.trim().length > 160) {
      const paragraphs = rawBody.split(/\n\s*\n/).map(part => part.replace(/\s+/g, ' ').trim()).filter(part => part.length > 20);
      if (paragraphs.length) return {title: title || document.title, text: paragraphs.join('\n\n'), language: String(value.inLanguage || value.language || '').split('-')[0].toLowerCase()};
    }
    for (const child of Object.values(value)) { const found = visit(child); if (found) return found; }
    return null;
  };
  for (const candidate of candidates) { const found = visit(candidate); if (found) return found; }
  return null;
}

export async function importUrlPreview(input, options = {}) {
  const url = validateUrl(input);
  await assertRobotsAllowed(url, options);
  const response = await fetchPublicResource(url, options);
  if (response.status < 200 || response.status >= 300) throw new Error(`Source returned HTTP ${response.status}.`);
  const contentType = String(response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!['text/html', 'application/xhtml+xml', 'text/plain'].includes(contentType)) throw new Error('This URL does not return an HTML or text page.');
  if (contentType === 'text/plain') {
    const text = response.body.toString('utf8').replace(/\s+/g, ' ').trim();
    return {title: url.hostname, language: /[\u0600-\u06FF]/.test(text) ? 'ar' : 'unknown', text, paragraphs: text ? 1 : 0, wordCount: text.split(/\s+/).filter(Boolean).length, firstLines: [text.slice(0, 500)], needsClientRender: !text};
  }
  return extractArticle(response.body.toString('utf8'), response.url.href);
}
