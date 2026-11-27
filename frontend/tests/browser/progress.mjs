import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
for (const [w, h, tag] of [[1280, 800, 'd'], [390, 800, 'm']]) {
  const r = await newPage(browser, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  const p = r.page; await p.waitForTimeout(1500);
  const card = () => p.evaluate(() => { const c = document.querySelector('.story-card'); return {id: c.querySelector('[data-open]').dataset.open, pct: parseInt(c.querySelector('.progress-row>span:last-child').textContent), w: c.querySelector('.progress span').style.width}; });
  const c0 = await card(); ok(c0.pct === 0, `${tag}: starts at 0%`);
  await p.click('.story-card [data-open]'); await p.waitForTimeout(400);
  for (let i = 0; i < 3; i++) await p.click('[data-step="1"]');
  await p.waitForTimeout(300);
  const rp = await p.evaluate(() => ({bar: document.getElementById('readProg')?.firstElementChild.style.width, c: document.getElementById('counter').textContent}));
  ok(rp.c.startsWith('4 /') && parseInt(rp.bar) > 0, `${tag}: reader bar moves (${rp.c}, ${rp.bar})`);
  await p.evaluate(() => document.querySelector('#readerOverlay .close, #readerOverlay [data-close]')?.click());
  await p.waitForTimeout(400);
  const c1 = await card(); ok(c1.pct > 0 && c1.w === c1.pct + '%', `${tag}: card shows ${c1.pct}% after reading 3 sentences`);
  await p.reload({waitUntil: 'load'}); await p.waitForTimeout(1200);
  const c2 = await card(); ok(c2.pct === c1.pct, `${tag}: progress survives reload (${c2.pct}%)`);
  await p.click('.story-card [data-open]'); await p.waitForTimeout(400);
  ok((await p.evaluate(() => document.getElementById('counter').textContent)).startsWith('4 /'), `${tag}: resumes at sentence 4`);
  await p.evaluate(() => { window.hikmaReader.setIndex(0); dispatchEvent(new CustomEvent('hikma:finished')); }); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('#readerOverlay .close, #readerOverlay [data-close]')?.click()); await p.waitForTimeout(400);
  const c3 = await card(); ok(c3.pct === 100, `${tag}: finished story shows 100% (${c3.pct})`);
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('progress') ? 1 : 0);
