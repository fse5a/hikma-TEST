// شاشات تجربة القلم: لازم تكون مكتوب عليها إنها تجربة، تشتغل للـ٤ فئات، وبدون صوت أو شبكة.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 420, h: 900, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
await page.evaluate(() => HX.penDemo());
await page.waitForTimeout(300);
for (const k of ['kid', 'blind', 'student', 'school']) {
  await page.click(`[data-pen-aud="${k}"]`); await page.waitForTimeout(150);
  const tag = await page.evaluate(() => document.querySelector('#hxPen .dialog-body').innerText.includes('تجربة، القلم تحت التطوير'));
  await page.click('#hxPenTry'); await page.waitForTimeout(150);
  const out = await page.evaluate(() => document.getElementById('hxPenOut').textContent);
  ok(tag && out.length > 10, `${k}: labelled as demo and shows result`);
}
await page.screenshot({path: '/tmp/pen.png'});
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech never called');
await browser.close(); stop(); process.exit(summary('pen-demo') ? 1 : 0);
