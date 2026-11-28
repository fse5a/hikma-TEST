// زر الإيقاف المؤقت لازم يوقّف الصوت فعلاً ويكمّل من مكانه (حالة عنصر الصوت الحقيقي). الخدمة الحقيقية ما بتتكلّمش (مقلّدة).
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
function wav(sec) { const sr = 8000, n = sr * sec, b = Buffer.alloc(44 + n, 128); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); return b.toString('base64'); }
async function setup(mode, delay = 0) {
  const {page, ctx, errs} = await newPage(browser, {w: 1100, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  await page.route('**/api/**', async route => {
    const u = route.request().url();
    if (u.includes('/api/speech')) {
      if (delay) await new Promise(r => setTimeout(r, delay));
      if (mode === 'fail') return route.fulfill({status: 502, contentType: 'application/json', body: '{"ok":false}'});
      return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({mode: 'configured', provider: 'mock', contentType: 'audio/wav', audioBase64: wav(6)})});
    }
    route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', integrations: {speech: 'configured'}})});
  });
  await page.addInitScript(() => {
    window.__dev = {speak: 0, cancel: 0}; window.__aud = [];
    if (window.speechSynthesis) { speechSynthesis.speak = () => { window.__dev.speak++; }; speechSynthesis.cancel = () => { window.__dev.cancel++; }; }
    const P = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (!window.__aud.includes(this)) window.__aud.push(this); return P.apply(this, arguments); };
  });
  await page.reload(); await page.waitForTimeout(800);
  await page.evaluate(() => { window.hikmaBackendHealth = {integrations: {speech: 'configured'}}; state.settings.voiceSource = 'cloud'; });
  await page.getByText('اقرأ القصة').nth(1).click(); await page.waitForTimeout(800);
  return {page, ctx, errs};
}
const icon = p => p.evaluate(() => /متابعة|تشغيل/.test(document.querySelector('#playPause')?.getAttribute('aria-label') || '') ? '▶' : 'pause:' + document.querySelector('#playPause')?.getAttribute('aria-label'));
const aud = p => p.evaluate(() => { const a = window.__aud[window.__aud.length - 1]; return a ? {paused: a.paused, t: a.currentTime, ended: a.ended} : null; });

// 1) صوت طبيعي: إيقاف فعلي ثم استكمال من نفس المكان
{
  const {page, ctx, errs} = await setup('ok');
  await page.locator('#playPause').click(); await page.waitForTimeout(2500);
  let a = await aud(page);
  ok(a && !a.paused && a.t > 0.3, 'natural voice is really playing ' + JSON.stringify(a));
  await page.locator('#playPause').click(); await page.waitForTimeout(400);
  const p1 = await aud(page); await page.waitForTimeout(1200); const p2 = await aud(page);
  ok(p1.paused && p2.paused && Math.abs(p2.t - p1.t) < 0.05, 'pause stops the audio and the time stays still ' + JSON.stringify([p1, p2]));
  ok(await icon(page) === '▶', 'icon shows play while paused: ' + await icon(page));
  await page.locator('#playPause').click(); await page.waitForTimeout(1200);
  const r = await aud(page);
  ok(!r.paused && r.t > p2.t, 'resume continues from the same place (same audio, later time) ' + JSON.stringify([p2, r]));
  ok(await page.evaluate(() => window.__aud.length) === 1, 'resume did not start a new audio from the beginning');
  ok(errs.length === 0, 'no errors ' + errs.join('|')); await ctx.close();
}
// 2) الصوت الخلفي فشل والكلام اتحوّل لصوت الجهاز: الإيقاف لازم يوقّف مش يبدأ من الأول
{
  const {page, ctx, errs} = await setup('fail');
  await page.locator('#playPause').click(); await page.waitForTimeout(2500);
  const before = await page.evaluate(() => ({...window.__dev, reading: document.body.classList.contains('hikma-reading')}));
  ok(before.speak >= 1 && before.reading, 'fell back to the device voice and is reading ' + JSON.stringify(before));
  await page.locator('#playPause').click(); await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({...window.__dev, reading: document.body.classList.contains('hikma-reading')}));
  ok(after.speak === before.speak && !after.reading && after.cancel > before.cancel, 'pause on the device-voice fallback stops it and does not restart ' + JSON.stringify([before, after]));
  ok(await icon(page) === '▶', 'icon shows play: ' + await icon(page));
  ok(errs.length === 0, 'no errors ' + errs.join('|')); await ctx.close();
}
// 3) الضغط على إيقاف والصوت لسه بيتجهّز: مفيش صوت يشتغل بعدها
{
  const {page, ctx, errs} = await setup('ok', 2000);
  await page.locator('#playPause').click(); await page.waitForTimeout(300);
  await page.locator('#playPause').click(); await page.waitForTimeout(4500);
  const s = await page.evaluate(() => ({aud: window.__aud.filter(a => !a.paused).length, dev: window.__dev.speak}));
  ok(s.aud === 0 && s.dev === 0, 'pressing pause while the voice is still loading means no audio is playing afterwards ' + JSON.stringify(s));
  ok(errs.length === 0, 'no errors ' + errs.join('|')); await ctx.close();
}
await browser.close(); stop(); process.exit(summary('pause-real') ? 1 : 0);
