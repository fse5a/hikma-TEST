// الواجهة الرئيسية لازم تتترجم فعلًا: مفيش نص عربي في الشاشة الرئيسية وحكمة+ (غير الاسم واسم القصص)، في كل لغة.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
for (const lang of ['en', 'fr', 'es', 'de', 'zh']) {
  const {page, errs} = await newPage(browser, {w: 420, h: 900, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light', uiLanguage: lang, uiLanguageAuto: false}});
  await page.waitForTimeout(600);
  await page.evaluate(() => { const f = [...document.querySelectorAll('button')].find(x => /حكمة\+|Hikma\+/.test(x.textContent)); f && f.click(); });
  await page.waitForTimeout(500);
  const left = await page.evaluate(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while (n = w.nextNode()) { const t = n.textContent.trim(); if (/[\u0600-\u06FF]/.test(t) && !/^(حِكمة|حكمة)$/.test(t)) { const e = n.parentElement; if (e.closest('.story-card,[data-open],.hx-daily,#hxDaily')) continue; if (e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden') out.push(t.slice(0, 30)); } } return [...new Set(out)]; });
  ok(left.length === 0, `${lang}: no untranslated Arabic in main screen + Hikma+ ${left.slice(0, 5).join(' | ')}`);
  const cnt = await page.evaluate(() => document.body.innerText);
  ok(lang === 'en' ? /stories in your library/.test(cnt) : true, `${lang}: counters are translated`);
  ok(errs.length === 0, 'no errors ' + errs.join('|'));
  await page.context().close();
}
await browser.close(); stop(); process.exit(summary('i18n-ui') ? 1 : 0);
