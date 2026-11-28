// كل كلام في الموقع لازم يعدّي من HikmaSpeak: فحص ثابت على الكود + فحص تشغيل على كل مدخل. الخدمة الحقيقية ما بتتكلّمش (مقلّدة).
import fs from 'node:fs';
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const dir = new URL('../../', import.meta.url).pathname;
// 1) فحص ثابت: مفيش نداء مباشر لصوت الجهاز إلا في x-speak.js وفي app.js (آخر حل لقراءة القصة)
const ALLOW = new Set(['x-speak.js', 'app.js']);
const bad = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(dir + f, 'utf8');
  const hits = (src.match(/new SpeechSynthesisUtterance\(|speechSynthesis\.speak\(/g) || []).length;
  if (hits && !ALLOW.has(f)) bad.push(`${f}:${hits}`);
}
ok(bad.length === 0, 'no direct device-voice calls outside x-speak.js and the story fallback in app.js ' + bad.join(','));
const app = fs.readFileSync(dir + 'app.js', 'utf8');
ok((app.match(/new SpeechSynthesisUtterance\(/g) || []).length <= 2, 'app.js has only the two known device spots (story fallback + voice preview)');

// 2) فحص تشغيل
const stop = await startServer(); const browser = await launch();
const {page, errs} = await newPage(browser, {w: 1100, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
function wav(sec) { const sr = 8000, n = sr * sec, b = Buffer.alloc(44 + n); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b.toString('base64'); }
const reqs = []; let mode = 'ok';
await page.route('**/api/**', route => {
  const u = route.request().url();
  if (u.includes('/api/speech')) {
    reqs.push(JSON.parse(route.request().postData() || '{}'));
    if (mode === 'fail') return route.fulfill({status: 502, contentType: 'application/json', body: '{"ok":false}'});
    return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({mode: 'configured', provider: 'gemini', contentType: 'audio/wav', audioBase64: wav(1)})});
  }
  route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', integrations: {speech: 'configured'}, providers: {speech: 'gemini'}})});
});
// نعدّ كل صوت جهاز بيتبني
await page.addInitScript(() => { window.__dev = []; const O = window.SpeechSynthesisUtterance; if (O && window.speechSynthesis) { const sp = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { window.__dev.push(u.text); }; } });
await page.reload();
await page.waitForTimeout(800);
await page.evaluate(() => { window.hikmaBackendHealth = {integrations: {speech: 'configured'}, providers: {speech: 'gemini'}}; });
const entries = {
  'helper line (mascot)': () => window.HikmaBuddy?.speak('أهلاً يا صاحبي', true),
  'HX.say (summary, moral, quiz, meanings)': () => window.HX?.say('العبرة: الصدق منجاة', 'ar'),
  'HX.speak (hub features, keywords, tour, hear game)': () => window.HX?.speak('كلمة مهمة', {lang: 'ar'}),
  'restored say() announcements': () => window.HikmaSpeak.speak('تم الحفظ', {lang: 'ar'}),
  'English line': () => window.HX?.say('Well done', 'en')
};
for (const [name, fn] of Object.entries(entries)) {
  const before = reqs.length, devBefore = await page.evaluate(() => window.__dev.length);
  await page.evaluate(fn);
  await page.waitForTimeout(900);
  const d = await page.evaluate(() => window.__dev.length) - devBefore;
  ok(reqs.length > before && d === 0, `${name}: used the natural voice (server calls +${reqs.length - before}, device voice ${d})`);
}
ok(reqs.every(r => /^[A-Z][a-z]+$/.test(r.voice)), 'each request carries the skin voice name: ' + [...new Set(reqs.map(r => r.voice))].join(','));
// فشل السحابة: لازم يرجع لصوت الجهاز بهدوء
mode = 'fail'; await page.evaluate(() => { window.HikmaSpeak.stop(); });
await page.evaluate(() => window.HikmaSpeak.speak('جملة جديدة تماما للاختبار', {lang: 'ar'}));
await page.waitForTimeout(1500);
ok(await page.evaluate(() => window.__dev.length) >= 1, 'when the server voice fails, the phone voice answers as the last fallback');
// الجهاز بس لما المستخدم يختار صوت الجهاز
mode = 'ok'; await page.evaluate(() => { state.settings.voiceSource = 'device'; });
const rb = reqs.length; await page.evaluate(() => window.HikmaSpeak.speak('تجربة صوت الجهاز', {lang: 'ar'})); await page.waitForTimeout(700);
ok(reqs.length === rb, 'explicit device-voice choice is respected (no server call)');
ok(errs.length === 0, 'no errors ' + errs.join('|'));
await browser.close(); stop(); process.exit(summary('speak-routing') ? 1 : 0);
