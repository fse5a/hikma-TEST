import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const all = ['hikma', 'cat', 'bot', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom', 'felix'];
// locked skins visible as locked cards for a normal user
let r = await newPage(browser, {w: 390, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
await r.page.evaluate(() => { document.getElementById('settingsButton')?.click?.(); const t = [...document.querySelectorAll('button')].find(b => /الإعدادات/.test(b.textContent) && b.offsetParent); t?.click(); });
await r.page.waitForTimeout(700);
let info = await r.page.evaluate(() => ({open: [...document.querySelectorAll('#settingsSkins [data-skin]')].map(b => b.dataset.skin), locked: [...document.querySelectorAll('#settingsSkins [data-locked-skin]')].map(b => b.dataset.lockedSkin), imgs: [...document.querySelectorAll('#settingsSkins .skin-ico')].map(i => i.getAttribute('src')), text: document.getElementById('settingsSkins').innerText}));
ok(info.open.length + info.locked.length === 10 && info.locked.length === 6, 'all 10 cards shown, 6 locked: ' + info.open + ' | ' + info.locked);
ok(new Set(info.imgs).size === 10 && info.imgs.every(s => /skinicons\/\w+\.webp/.test(s)), 'every card has its own painted icon');
ok(!/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(info.text.replace(/🔒/g, '')), 'no emoji icon text on cards');
await r.page.locator('#settingsSkins').screenshot({path: '/downloads/skin-cards-390.png'});
await r.page.evaluate(() => document.querySelector('[data-locked-skin]').click());
ok(await r.page.evaluate(() => document.activeElement && document.activeElement.id === 'skinCode'), 'tapping a locked card goes to the code box');
ok(await r.page.evaluate(() => state.settings.skin === 'hikma'), 'locked card does not switch skin');
ok(r.errs.length === 0, 'no errors ' + r.errs.join('|')); await r.ctx.close();
// per-skin hero text and lines are unique
const heroes = [];
for (const sk of all) {
  r = await newPage(browser, {w: 390, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: sk, theme: 'light', unlockedSkins: all}});
  await r.page.waitForTimeout(600);
  const m = await r.page.evaluate(() => { const i = document.querySelector('.welcome img.owl'); return i ? {nw: i.naturalWidth, op: getComputedStyle(i).opacity, dots: !!document.querySelector('.hx-dots')} : null; });
  ok(m && m.nw > 0 && m.op === '1' && !m.dots, sk + ' hero mascot is a loaded image, fully visible, no dot placeholder ' + JSON.stringify(m));
  const h = await r.page.evaluate(() => [document.querySelector('.welcome h1')?.textContent, document.querySelector('.welcome p')?.textContent]);
  heroes.push(h.join('|'));
  await r.page.screenshot({path: `/downloads/hero-${sk}-390.png`});
  ok(r.errs.length === 0, sk + ' no errors ' + r.errs.join('|')); await r.ctx.close();
}
ok(new Set(heroes).size === 10 && heroes.every(x => !/يا بطل/.test(x)), 'each skin has its own hero text');
r = await newPage(browser, {w: 800, h: 600, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const dup = await r.page.evaluate(() => { const L = HikmaMascotLines.lines, seen = {}, d = []; const cats = ['click', 'reading', 'cheer', 'done', 'right', 'wrong', 'great', 'ok', 'hello', 'idle']; for (const [k, s] of Object.entries(L)) for (const c of cats) { if (!s[c]) d.push('missing ' + k + ' ' + c); (s[c] || []).forEach(t => { (seen[t] = seen[t] || []).push(k); }); } for (const [t, a] of Object.entries(seen)) if (a.length > 1) d.push(t + ' ' + a); return d; });
ok(dup.length === 0, 'no missing or shared mascot lines ' + JSON.stringify(dup));
await r.ctx.close(); await browser.close(); stop(); process.exit(summary('skin-cards') ? 1 : 0);
