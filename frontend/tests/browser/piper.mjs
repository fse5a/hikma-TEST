import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
// صوت Piper الاحتياطي: بيشتغل فعلًا في المتصفح (بينزّل النموذج من النت مرة واحدة)، ومش بيتعمل له أي طلب لخدمة الكلام
const stop = await startServer(); const browser = await launch();
const r = await newPage(browser, {w: 1280, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const p = r.page;
ok(await p.evaluate(() => window.HikmaPiper && !HikmaPiper.ready()), 'Piper is off until the user downloads it');
const res = await p.evaluate(async () => {
  const t0 = performance.now();
  await HikmaPiper.download();
  const blob = await HikmaPiper.synth('مرحبا يا صديقي، تعالى نقرأ قصة جميلة.');
  const buf = new Uint8Array(await blob.arrayBuffer()); let peak = 0;
  for (let i = 44; i < buf.length - 1; i += 2) { const v = ((buf[i] | (buf[i + 1] << 8)) << 16) >> 16; if (Math.abs(v) > peak) peak = Math.abs(v); }
  return {ms: Math.round(performance.now() - t0), bytes: buf.length, peak, ready: HikmaPiper.ready()};
});
ok(res.bytes > 50000 && res.peak > 1000, `Piper made real audio (${res.bytes} bytes, peak ${res.peak}, ${res.ms} ms)`);
ok(res.ready, 'ready flag set after download');
// المسار: لو السحابة مش متاحة وPiper جاهز، الكلام بيعدّي على Piper مش على صوت الجهاز
const route = await p.evaluate(async () => {
  let device = 0, played = 0;
  const OrigU = window.SpeechSynthesisUtterance; window.SpeechSynthesisUtterance = function (t) { device++; return new OrigU(t); };
  const OrigPlay = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { played++; setTimeout(() => this.onended?.(), 50); return Promise.resolve(); };
  state.settings.voiceSource = 'cloud'; window.hikmaBackendHealth = {integrations: {speech: 'down'}};
  HikmaSpeak.speak('أهلاً بيك', {lang: 'ar'});
  await new Promise(r => setTimeout(r, 6000));
  return {device, played};
});
ok(route.played >= 1 && route.device === 0, 'with no cloud voice, Piper speaks and the device voice is not used ' + JSON.stringify(route));
ok(r.speech.length === 0, 'speech service never called');
ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
await HikmaPiper_cleanup(p);
async function HikmaPiper_cleanup(page) { await page.evaluate(() => HikmaPiper.remove()); }
await browser.close(); stop(); process.exit(summary('piper') ? 1 : 0);
