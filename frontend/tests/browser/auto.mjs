import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const seed = {activated: true, age: 'o16', a11y: false, skin: 'hikma'};
const theme = p => p.evaluate(() => document.documentElement.dataset.theme);
let r = await newPage(browser, {seed, ctx: {colorScheme: 'dark'}}); let page = r.page;
await page.waitForTimeout(1200);
ok(await theme(page) === 'dark', 'dark device opens dark');
await page.emulateMedia({colorScheme: 'light'}); await page.waitForTimeout(500);
ok(await theme(page) === 'light', 'theme follows device live to light');
await page.evaluate(() => document.querySelector('[data-theme-choice=dark]').click()); await page.waitForTimeout(200);
await page.emulateMedia({colorScheme: 'dark'}); await page.emulateMedia({colorScheme: 'light'}); await page.waitForTimeout(500);
ok(await theme(page) === 'dark', 'manual choice overrides device');
ok(r.errs.length === 0, 'no errors ' + r.errs.join('|')); ok(r.speech.length === 0, 'no speech api');
await r.ctx.close();
for (const [loc, code] of [['es-ES', 'es'], ['fr-FR', 'fr'], ['en-US', 'en']]) {
  r = await newPage(browser, {seed, ctx: {locale: loc}});
  ok(await r.page.evaluate(() => document.documentElement.lang) === code, loc + ' device opens in ' + code);
  await r.ctx.close();
}
r = await newPage(browser, {seed, ctx: {locale: 'es-ES'}}); page = r.page;
ok(await page.evaluate(() => HikmaI18n.dictionaries.es['شاراتي'] === 'Mis insignias' && HikmaI18n.dictionaries.fr['شاراتي'] === 'Mes badges' && HikmaI18n.dictionaries.en['شاراتي'] === 'My badges'), 'new feature strings translated');
ok(await page.evaluate(() => !!document.getElementById('uiLanguage')), 'manual language switch exists');
const w = await page.evaluate(() => [HX.dhikrWindow(5), HX.dhikrWindow(12), HX.dhikrWindow(18), HX.dhikrWindow(23)].join());
ok(w === 'morning,,evening,', 'dhikr windows: ' + w);
await r.ctx.close();
// prompt appears when enabled, in-window; not when disabled
for (const on of [false, true]) {
  r = await newPage(browser, {seed});
  await r.page.addInitScript(on => { localStorage.setItem('hikma-elder-v1', JSON.stringify({religious: on})); const D = Date; const h = 6; globalThis.Date = class extends D { constructor(...a) { if (a.length) super(...a); else { super(); this.getHours = () => h; } } }; Date.now = D.now; }, on);
  await r.page.reload(); await r.page.waitForTimeout(4500);
  const shown = await r.page.evaluate(() => !!document.querySelector('#hxAdhPrompt.open'));
  ok(shown === on, 'morning prompt ' + (on ? 'shown when enabled' : 'hidden when disabled'));
  if (on) { await r.page.screenshot({path: '/tmp/adh-prompt.png'}); await r.page.click('#hxAdhPromptGo'); await r.page.waitForTimeout(300); ok(await r.page.isVisible('#hxAdhAudio'), 'prompt opens the adhkar'); }
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('auto') ? 1 : 0);
