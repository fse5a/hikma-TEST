import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const all = ['hikma', 'cat', 'bot', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom', 'felix'];
for (const sk of all) {
  const r = await newPage(browser, {w: 1280, h: 700, seed: {activated: true, age: 'o16', a11y: false, skin: sk, theme: 'light', unlockedSkins: all}});
  await r.page.waitForTimeout(600);
  const src = await r.page.evaluate(() => document.querySelector('.brand-mark img')?.getAttribute('src') || 'none');
  ok(sk === 'hikma' ? src.includes('owl/logo') : src.includes(`mascots/${sk}.webp`), `${sk}: header icon matches the skin (${src})`);
  if (sk === 'felix') {
    const v = await r.page.evaluate(() => { window.hikmaBackendHealth = {integrations: {showcaseVoice: 'configured'}}; const a = HikmaSpeak.skinVoice(); window.hikmaReader = {story: {id: 'myth-thor'}}; const b = HikmaSpeak.skinVoice(); window.hikmaReader = {story: {id: 'bk-twain-fence'}}; const c = HikmaSpeak.skinVoice(); return [a, b, c]; });
    ok(v[0] === 'Achird' && v[1] === 'Eleven' && v[2] === 'Achird', 'showcase voice only for flagged stories ' + JSON.stringify(v));
  }
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('brand-icon') ? 1 : 0);
