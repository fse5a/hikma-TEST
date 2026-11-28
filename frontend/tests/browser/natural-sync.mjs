// الصوت الطبيعي: التمييز لازم يمشي مع الصوت (الجملة تتغير والكلمة تتحرك). الصوت مقلّد، ما بنكلّمش الخدمة الحقيقية أبدًا.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs} = await newPage(browser, {w: 1100, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
function wav(sec) { const sr = 8000, n = sr * sec, b = Buffer.alloc(44 + n); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b.toString('base64'); }
let calls = 0;
await page.route('**/api/**', async route => {
  const u = route.request().url();
  if (u.includes('/api/speech')) { calls++; await new Promise(r => setTimeout(r, 600)); return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({mode: 'configured', provider: 'mock', contentType: 'audio/wav', audioBase64: wav(2)})}); }
  route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', integrations: {speech: 'configured'}})});
});
await page.evaluate(async () => { window.hikmaBackendHealth = {integrations: {speech: 'configured'}}; });
await page.getByText('اقرأ القصة').nth(1).click();
await page.waitForTimeout(800);
await page.evaluate(() => { window.hikmaBackendHealth = {integrations: {speech: 'configured'}}; });
const line0 = await page.evaluate(() => document.querySelector('#readingText .active')?.dataset.line);
const t0 = Date.now();
await page.locator('#neuralSpeech').click({force: true});
await page.waitForFunction(() => document.querySelector('#readingText .active-word'), null, {timeout: 6000}).catch(() => {});
const firstMs = Date.now() - t0;
const seen = new Set(), lines = new Set(); const shots = [];
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => ({w: document.querySelector('#readingText .active-word')?.textContent, l: document.querySelector('#readingText .active')?.dataset.line}));
  if (s.w) seen.add(s.w); if (s.l) lines.add(s.l);
  if (i === 1 || i === 5 || i === 10) { const p = `/tmp/natural-${i}.png`; await page.screenshot({path: p}); shots.push(p); }
}
ok(firstMs < 2200, `first audio starts fast even with a slow server (600ms per request): ${firstMs}ms`);
ok(calls > 0, 'natural voice requested audio (mocked): ' + calls);
ok(seen.size >= 3, 'highlighted word moves while audio plays: ' + [...seen].slice(0, 6).join(' | '));
ok(lines.size >= 2, 'highlight moves to the next sentence after the first ends: lines ' + [...lines].join(','));
ok(errs.length === 0, 'no errors ' + errs.join('|'));
await browser.close(); stop(); process.exit(summary('natural-sync') ? 1 : 0);
