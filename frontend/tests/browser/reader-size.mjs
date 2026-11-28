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
  await page.screenshot({path: `/downloads/reader-size-${tag}.png`});
  ok(`${tag}: من غير أخطاء`, errs.length === 0);
  await page.close();
}
await browser.close(); stop && stop(); summary();
