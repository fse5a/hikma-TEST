// نص القارئ لازم يكون كبير ومقروء، وعمود الإعدادات ما يخرجش برا الشاشة (قياس حقيقي بالمتصفح)
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
for (const [w, h, min, tag] of [[1100, 800, 22, 'desktop'], [390, 800, 22, 'mobile']]) {
  const {page, errs} = await newPage(browser, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  await page.getByText('اقرأ القصة').nth(1).click(); await page.waitForTimeout(800);
  const m = await page.evaluate(() => { const t = document.querySelector('.reading-text'); const r = t.getBoundingClientRect(); const v = document.querySelector('.voice-panel'); const vr = v.getBoundingClientRect(); return {fs: parseFloat(getComputedStyle(t).fontSize), tw: r.width, vw: vr.width, vh: vr.height, sw: document.documentElement.scrollWidth, iw: innerWidth}; });
  ok(`${tag}: حجم النص ${m.fs}px`, m.fs >= min);
  ok(`${tag}: ما فيش تمرير أفقي`, m.sw <= m.iw + 1);
  ok(`${tag}: عرض النص مقروء (${Math.round(m.tw)}px)`, m.tw > (tag === 'mobile' ? 300 : 500));
  if (tag === 'desktop') { ok('desktop: النص أعرض من الإعدادات', m.tw > m.vw * 2); ok('desktop: الإعدادات ليها تمرير جوا مش بتطوّل الصفحة', m.vh <= h * 0.72); }
  const ov = await page.evaluate(() => { const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; const t = document.querySelector('.reading-text').getBoundingClientRect(); const out = {}; const mb = document.getElementById('mascotBuddy'); out.mascot = !mb || getComputedStyle(mb).display === 'none' || !hit(mb.getBoundingClientRect(), t); const f = document.getElementById('hxReadPage'); const fr = f.getBoundingClientRect(); out.fab = !hit(fr, t) || fr.bottom <= t.top; out.fabVisible = fr.width > 20 && fr.top >= 0 && fr.left >= 0 && fr.right <= innerWidth; const hd = document.querySelector('#readerOverlay .dialog-head').getBoundingClientRect(); out.fabInHead = fr.top >= hd.top - 2 && fr.bottom <= hd.bottom + 2; const btns = [...document.querySelectorAll('#readerOverlay .dialog-head button, #readerOverlay .dialog-head a')].map(e => e.getBoundingClientRect()); const h2 = document.querySelector('#readerOverlay .dialog-head h2'); if (h2) { const rg = document.createRange(); rg.selectNodeContents(h2); btns.push(...[...rg.getClientRects()]); } out.fabFree = btns.every(b => !hit(fr, b)); return out; });
  ok(`${tag}: الشخصية مبتغطيش النص`, ov.mascot); ok(`${tag}: زر اقرأ لي الصفحة مبيغطيش النص`, ov.fab); ok(`${tag}: الزر ظاهر وجوا الشاشة`, ov.fabVisible); ok(`${tag}: الزر في شريط القارئ ومش فوق زراير تانية`, ov.fabInHead && ov.fabFree);
  await page.screenshot({path: `/downloads/reader-size-${tag}.png`});
  ok(`${tag}: من غير أخطاء`, errs.length === 0);
  await page.close();
}
await browser.close(); stop && stop(); summary();
