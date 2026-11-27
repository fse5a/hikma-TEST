import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const seed = {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'};
for (const [w, h, tag] of [[1280, 800, 'd'], [390, 800, 'm']]) {
  const r = await newPage(browser, {w, h, seed});
  await r.page.waitForTimeout(100);
  const started = await r.page.evaluate(() => sessionStorage.getItem('hx-dots'));
  await r.page.waitForTimeout(700);
  const mid = await r.page.evaluate(() => { const c = document.querySelector('.hx-dots'); return c ? {w: c.width, op: getComputedStyle(document.querySelector('.welcome img.owl')).opacity} : null; });
  if (mid) await r.page.screenshot({path: `/tmp/motion-${tag}.png`});
  await r.page.waitForTimeout(4500);
  const end = await r.page.evaluate(() => ({c: !!document.querySelector('.hx-dots'), op: getComputedStyle(document.querySelector('.welcome img.owl')).opacity, h1: getComputedStyle(document.querySelector('.welcome h1')).fontSize}));
  ok(started === '1' || mid, `${tag}: dots animation ran (started=${started}, mid=${!!mid})`);
  ok(!end.c && end.op === '1', `${tag}: dots removed, owl visible again`);
  ok(parseFloat(end.h1) >= 30, `${tag}: big heading ${end.h1}`);
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.page.screenshot({path: `/tmp/motion-end-${tag}.png`});
  const fade = await r.page.evaluate(async () => { const b = document.querySelector('[data-theme-choice="dark"]'); if (!b) return 'nobtn'; b.click(); await new Promise(x => setTimeout(x, 100)); const a = document.documentElement.classList.contains('hx-fade'); await new Promise(x => setTimeout(x, 900)); return a && !document.documentElement.classList.contains('hx-fade'); });
  ok(fade === true, `${tag}: theme fade on then off (${fade})`);
  await r.ctx.close();
}
const rr = await newPage(browser, {w: 1280, h: 800, seed, ctx: {reducedMotion: 'reduce'}});
await rr.page.waitForTimeout(1200);
ok(!(await rr.page.evaluate(() => !!document.querySelector('.hx-dots') || !!sessionStorage.getItem('hx-dots'))), 'reduced motion: no dots');
await rr.ctx.close();
await browser.close(); stop(); process.exit(summary('motion') ? 1 : 0);
