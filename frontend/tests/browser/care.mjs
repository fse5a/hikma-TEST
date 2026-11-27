import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const r = await page.evaluate(() => ({
  t: HX.timeText(),
  fx: HX.detectFx('نزل المطر وسمعوا الرعد وطرق حد الباب').map(f => f.k).join(','),
  none: HX.detectFx('قصة عادية جدا').length,
  feats: ['time', 'cap', 'rec'].map(id => !!HX.features.find(f => f.id === id)),
  cap0: HX.volumeCap()
}));
ok(/النهارده/.test(r.t) && /الساعة/.test(r.t), 'time text: ' + r.t);
ok(r.fx === 'rain,thunder,door', 'sound effects detected from any outside text: ' + r.fx);
ok(r.none === 0, 'no effects for plain text');
ok(r.feats.every(Boolean), 'time, cap and record features registered');
ok(r.cap0 === 1, 'no volume cap by default');
await page.evaluate(() => HX.features.find(f => f.id === 'cap').open()); await page.waitForTimeout(200);
await page.click('[data-hx-cap=low]'); await page.waitForTimeout(200);
ok(await page.evaluate(() => HX.volumeCap()) === 0.35, 'low volume cap applies (child hearing)');
const vol = await page.evaluate(() => { const u = new SpeechSynthesisUtterance('x'); u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); speechSynthesis.cancel(); return u.volume; });
ok(vol <= 0.35, 'speech volume is capped: ' + vol);
await page.evaluate(() => HX.features.find(f => f.id === 'rec').open()); await page.waitForTimeout(200);
ok(await page.isVisible('#hxRecGo') || await page.isVisible('#hxRec'), 'record dialog opens');
const sl = await page.evaluate(() => { const r0 = state.settings.rate; HX.toggleSlow(); const on = state.settings.rate; HX.toggleSlow(); return [r0, on, state.settings.rate]; });
ok(sl[1] === 0.5 && sl[2] === sl[0], 'very slow reading on then back to original: ' + sl.join('>'));
const ch = await page.evaluate(() => { try { HX.cheer(true); HX.emit('quizdone', {score: 3, total: 3}); return typeof HX.cheer === 'function'; } catch (e) { return String(e); } });
ok(ch === true, 'cheer sound plays without errors: ' + ch);
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech api never called');
await browser.close(); stop(); process.exit(summary('care') ? 1 : 0);
