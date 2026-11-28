// مصفوفة: كل الثيمات x الوضعين x اللغات x الموبايل/الديسكتوب. بتفحص أخطاء الكونسول والـ overflow وأزرار صغيرة. شغّلها بـ ONLY=cat,bot
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const all = ['hikma', 'cat', 'bot', 'felix', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom'];
const stop = await startServer(); const b = await launch();
for (const skin of (process.env.ONLY || all.join(',')).split(','))
  for (const theme of ['light', 'dark']) for (const lang of ['ar', 'en', 'es', 'fr']) for (const [w, h] of [[390, 800], [1280, 800]]) {
    const {page, errs, ctx} = await newPage(b, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin, theme, uiLanguage: lang, uiLanguageAuto: false, unlockedSkins: all}});
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({
      ov: document.documentElement.scrollWidth - innerWidth, lang: document.documentElement.lang,
      small: [...document.querySelectorAll('button,a,select')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 && getComputedStyle(e).visibility != 'hidden' && (q.width < 32 || q.height < 32); }).map(e => (e.id || e.className || e.tagName).toString().slice(0, 30) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 4)}));
    const tag = `${skin}/${theme}/${lang}/${w}`;
    ok(errs.length === 0 && r.ov <= 0 && r.small.length === 0 && r.lang === lang, `${tag} ${errs[0] || ''} ov=${r.ov} lang=${r.lang} small=${r.small}`);
    await ctx.close();
  }
await b.close(); stop(); process.exit(summary('matrix') ? 1 : 0);
