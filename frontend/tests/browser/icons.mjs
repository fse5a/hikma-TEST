import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
for (const [w, h, tag] of [[1280, 800, 'd'], [390, 800, 'm']]) {
  const r = await newPage(browser, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  await r.page.waitForTimeout(2200);
  const res = await r.page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img.hx-paint')];
    await Promise.all(imgs.map(i => i.decode().catch(() => {})));
    return {n: imgs.length, broken: imgs.filter(i => !i.naturalWidth).length, tiny: imgs.filter(i => { const b = i.getBoundingClientRect(); return b.width && b.width < 10; }).length};
  });
  ok(res.n > 3, `${tag}: painted icons shown (${res.n})`);
  ok(res.broken === 0, `${tag}: none broken`);
  ok(res.tiny === 0, `${tag}: none tiny`);
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.page.screenshot({path: `/tmp/icons-${tag}.png`});
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('icons') ? 1 : 0);
