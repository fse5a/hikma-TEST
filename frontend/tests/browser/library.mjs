import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const seed = {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'};
const n = p => p.evaluate(() => [state.stories.length, document.querySelectorAll('.story-card').length]);
// 1) fresh profile gets sample stories
let r = await newPage(browser, {seed}); await r.page.waitForTimeout(800);
let c = await n(r.page); ok(c[0] >= 5 && c[1] === c[0], 'fresh profile shows sample stories ' + c);
// 2) old broken state: flag set, no stories (what "reset" used to leave)
await r.page.evaluate(() => { state.stories = []; state.settings.realStoriesV2 = true; save(); });
await r.page.reload(); await r.page.waitForTimeout(1200);
c = await n(r.page); ok(c[0] >= 5 && c[1] === c[0], 'empty library with old flag is re-seeded ' + c);
// 3) existing stories are never touched
await r.page.evaluate(() => { state.stories = state.stories.slice(0, 2).concat([{id: 'mine1', title: 'قصتي', text: 'جملة واحدة.', lang: 'ar', translation: '', progress: 0}]); save(); });
await r.page.reload(); await r.page.waitForTimeout(1200);
c = await n(r.page); ok(c[0] === 3 && c[1] === 3, 'existing stories kept as is ' + c);
// 4) reset app brings samples back at once
r.page.on('dialog', d => d.accept());
await r.page.evaluate(() => { document.getElementById('appSettingsOverlay')?.classList.add('open'); });
await r.page.evaluate(() => document.getElementById('resetApp')?.click()); await r.page.waitForTimeout(800);
c = await n(r.page); ok(c[0] >= 5, 'after reset samples are back ' + c);
ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
await r.ctx.close();
// 5) helper character follows the skin
for (const sk of ['doraemon', 'robot', 'cat']) {
  r = await newPage(browser, {w: 1280, h: 700, seed: {...seed, skin: sk, unlockedSkins: ['doraemon', 'robot', 'cat']}}); await r.page.waitForTimeout(9000);
  const s = await r.page.evaluate(() => { const i = document.querySelector('#mascotBuddy .buddy-img'); return [getComputedStyle(document.getElementById('mascotBuddy')).display, i && i.getAttribute('src')].join(); });
  ok(!/assets\/owl\//.test(s), sk + ' helper is not the owl: ' + s);
  if (sk === 'doraemon') await r.page.screenshot({path: '/tmp/after-doraemon.png'});
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('library') ? 1 : 0);
