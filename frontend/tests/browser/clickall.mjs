// بيدوس على كل زرار ظاهر في الشاشات الرئيسية وبيتأكد إن مفيش أخطاء ولا شاشة بيضاء.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
for (const [w, h] of [[390, 800], [1280, 800]]) {
  const {page, errs, speech} = await newPage(browser, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  page.on('dialog', d => d.dismiss());
  const labels = await page.evaluate(() => [...document.querySelectorAll('button,a[href]')].filter(e => e.getBoundingClientRect().width > 0 && !e.closest('[data-delete]') && !e.matches('[data-delete]')).map(e => (e.getAttribute('aria-label') || e.textContent || e.id).trim().slice(0, 30)));
  const uniq = [...new Set(labels)].filter(Boolean);
  const bad = [];
  for (const l of uniq) {
    const before = errs.length;
    const loc = page.locator('button:visible,a[href]:visible').filter({hasText: l}).first();
    const loc2 = page.locator(`[aria-label="${l.replace(/"/g, '')}"]:visible`).first();
    try { await ((await loc.count()) ? loc : loc2).click({timeout: 1500, noWaitAfter: true}); } catch { continue; }
    await page.waitForTimeout(250);
    const blank = await page.evaluate(() => document.body.innerText.trim().length < 20);
    if (errs.length > before || blank) bad.push(l + (blank ? ' [blank]' : ' ' + errs[errs.length - 1].slice(0, 80)));
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
    if (page.url().includes('#') === false && !page.url().startsWith('http')) await page.goBack();
    if (!page.url().replace(/#.*/, '').endsWith('/') && !/index|\/$|:\d+$/.test(page.url().replace(/#.*/, ''))) await page.goto(page.url().split('/').slice(0, 3).join('/') + '/');
  }
  ok(bad.length === 0, `${w}px: clicked ${uniq.length} controls, problems: ${bad.join(' || ') || 'none'}`);
  ok(speech.length === 0, 'speech never called');
  await page.context().close();
}
await browser.close(); stop(); process.exit(summary('clickall') ? 1 : 0);
