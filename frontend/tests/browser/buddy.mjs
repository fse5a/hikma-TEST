import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const skins = ['hikma', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom', 'cat', 'bot', 'felix'];
const un = ['doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom', 'cat', 'bot', 'felix', 'robot'];
for (const [w, h] of [[1280, 700], [1280, 560], [1920, 1000], [1024, 640], [800, 600], [390, 800]]) for (const sk of (w === 1280 && h === 700 ? skins : ['hikma', 'doraemon'])) {
  const r = await newPage(browser, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin: sk, theme: 'dark', unlockedSkins: un}});
  await r.page.waitForTimeout(1800);
  const res = await r.page.evaluate(() => {
    const b = document.getElementById('mascotBuddy'); const img = b?.querySelector('.buddy-img');
    if (!b || getComputedStyle(b).display === 'none' || getComputedStyle(b).visibility === 'hidden') return {hidden: true};
    const a = img.getBoundingClientRect(); const hit = [];
    document.querySelectorAll('button,a,input,select,textarea,[role=button],h1,h2,h3,p,label,.story-card').forEach(e => {
      if (b.contains(e) || e.closest('.overlay:not(.open)')) return; const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return;
      if (a.left < r.right - 1 && a.right > r.left + 1 && a.top < r.bottom - 1 && a.bottom > r.top + 1) hit.push((e.id || e.className || e.tagName).toString().slice(0, 30));
    });
    return {hit, rect: [a.left | 0, a.top | 0, a.width | 0]};
  });
  ok(res.hidden || res.hit.length === 0, `${sk} ${w}x${h}: ${res.hidden ? 'helper hidden' : 'no overlap ' + JSON.stringify(res.hit)}`);
  if (sk === 'doraemon' && w === 1280 && h === 700) await r.page.screenshot({path: '/tmp/buddy-doraemon.png'});
  if (sk === 'doraemon' && w === 1280 && h === 560) await r.page.screenshot({path: '/tmp/buddy-short.png'});
  if (sk === 'hikma' && w === 1920) await r.page.screenshot({path: '/tmp/buddy-hikma-wide.png'});
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('buddy') ? 1 : 0);
