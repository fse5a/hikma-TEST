// فحص سهولة الوصول لقارئات الشاشة ولوحة المفاتيح: كل زرار وحقل له اسم، ومفيش عنصر تفاعلي بره التركيز.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const nameless = page => page.evaluate(() => {
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const bad = [];
  document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button]').forEach(e => {
    if (!vis(e)) return;
    const name = (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || e.textContent || e.value || e.placeholder || (e.id && document.querySelector(`label[for="${e.id}"]`)?.textContent) || e.closest('label')?.textContent || '').trim();
    if (!name) bad.push((e.id || e.className || e.tagName).toString().slice(0, 50));
  });
  return bad;
});
const {page, errs} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
let bad = await nameless(page); ok(bad.length === 0, 'library: every control has a name ' + bad.join(','));
ok(await page.evaluate(() => document.documentElement.lang) === 'ar', 'html lang is set');
ok(await page.evaluate(() => !!document.querySelector('main')), 'main landmark exists');
// الإعدادات
await page.click('#settingsOpen'); await page.waitForTimeout(400);
bad = await nameless(page); ok(bad.length === 0, 'settings dialog: every control has a name ' + bad.join(','));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// القارئ
const id = await page.evaluate(() => state.stories[0].id);
await page.evaluate(id => { const b = document.querySelector('[data-open],[data-read],.story-card button'); b && b.click(); }, id); await page.waitForTimeout(700);
bad = await nameless(page); ok(bad.length === 0, 'reader/story view: every control has a name ' + bad.join(','));
// لوحة المفاتيح: Tab بيتحرك وفيه focus ظاهر
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const seen = new Set();
for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); seen.add(await page.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : ''; })); }
ok(seen.size >= 8, 'Tab key moves through many controls: ' + seen.size);
const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'; });
ok(ring, 'focused control has a visible focus ring');
// الشاشة الأولى: بوابة الدخول
const g = await newPage(browser, {w: 420});
bad = await nameless(g.page); ok(bad.length === 0, 'login gate: every control has a name ' + bad.join(','));
ok(errs.length === 0, 'no errors ' + errs.join('|'));
await browser.close(); stop(); process.exit(summary('a11y-audit') ? 1 : 0);
