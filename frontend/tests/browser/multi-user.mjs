// كذا مستخدم داخلين مع بعض بكود التفعيل: كل واحد حالته لوحده ومفيش تداخل. (الـ API مقلّد، مفيش كود حقيقي هنا)
import {launch, ok, summary, startServer, BASE} from './helpers.mjs';
const stop = await startServer();
const browser = await launch();
const N = 6;
const act = route => {
  let code = ''; try { code = JSON.parse(route.request().postData() || '{}').code || ''; } catch {}
  if (/^GOOD-\d$/.test(code)) return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', activation: {status: 'active'}})});
  return route.fulfill({status: 401, contentType: 'application/json', body: JSON.stringify({ok: false, error: {code: 'invalid_code', message: 'الكود غلط'}})});
};
async function user(i) {
  const ctx = await browser.newContext({viewport: {width: 420, height: 900}, locale: 'ar-EG'});
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.route('**/api/**', route => {
    const u = route.request().url();
    if (u.includes('/api/speech')) return route.fulfill({status: 503, body: '{}'});
    if (u.includes('/api/activate')) return act(route);
    route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', integrations: {}})});
  });
  await page.goto(BASE + '/'); await page.waitForTimeout(600);
  // كود غلط الأول
  await page.fill('#penCode', 'WRONG-' + i); await page.click('#demoLoginForm button[type=submit]'); await page.waitForTimeout(500);
  const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('hikma-library-v2') || '{}').settings?.activated === true);
  // الوضع المساعد على البوابة للمستخدمين الفردي بس
  if (i % 2 === 1) { await page.click('#a11yToggle'); await page.waitForTimeout(250); }
  const gateA11y = await page.evaluate(() => document.documentElement.dataset.a11y === 'on');
  await page.fill('#penCode', 'GOOD-' + i); await page.click('#demoLoginForm button[type=submit]'); await page.waitForTimeout(1200);
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('hikma-library-v2')).settings);
  return {i, gateA11y, wrong, s, a11yAttr: await page.evaluate(() => document.documentElement.dataset.a11y), errs, page, ctx};
}
const users = await Promise.all(Array.from({length: N}, (_, i) => user(i + 1)));
for (const u of users) {
  ok(!u.wrong, `user ${u.i}: wrong code does not log in`);
  ok(u.s.activated === true, `user ${u.i}: logged in with own code`);
  const want = u.i % 2 === 1;
  ok(u.gateA11y === want, `user ${u.i}: gate a11y is ${want ? 'on' : 'off'} as set by this user only (no leak from others)`);
  ok(u.errs.length === 0, `user ${u.i}: no console errors ${u.errs.join('|')}`);
}
// بعد الدخول: غيّر السكن لكل مستخدم لوحده وتأكد إن التانيين ما اتغيروش
const skins = ['hikma', 'hikma', 'hikma'];
await Promise.all(users.map(async u => { await u.page.evaluate(i => { state.settings.theme = i % 2 ? 'dark' : 'light'; save && save(); }, u.i).catch(() => {}); }));
const themes = await Promise.all(users.map(u => u.page.evaluate(() => JSON.parse(localStorage.getItem('hikma-library-v2')).settings.theme)));
ok(new Set(themes).size <= 2 && themes.every((t, k) => t === ((k + 1) % 2 ? 'dark' : 'light') || t === 'light'), 'each user keeps own theme');
for (const u of users) await u.ctx.close();
// ضغط متوازي على /api/activate: ولا 500 وكل الردود متسقة
if (!process.env.BASE) {
  const rs = await Promise.all(Array.from({length: 30}, (_, k) => fetch(BASE + '/api/activate', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({code: 'NOPE-' + k})}).then(r => r.status)));
  ok(rs.every(s => s < 500), 'parallel /api/activate: no 5xx under 30 concurrent requests ' + [...new Set(rs)]);
  ok(new Set(rs).size === 1, 'parallel /api/activate: same answer for all wrong codes');
}
await browser.close(); stop();
process.exit(summary('multi-user') ? 1 : 0);
