// اختبارات سلوك حقيقي: بنقيس اللي المستخدم بيشوفه (أرقام، نوافذ، ألوان)، مش بس إن مفيش أخطاء.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
for (const [w, h, tag] of [[1280, 800, 'd'], [390, 800, 'm']]) {
  const r = await newPage(browser, {w, h, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  const p = r.page;
  await p.route('https://api.mymemory.translated.net/**', route => route.fulfill({status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify({responseStatus: 200, responseData: {translatedText: 'fence'}})}));
  await p.waitForTimeout(1500);
  const stat = label => p.evaluate(l => { const e = [...document.querySelectorAll('.dashboard-stat')].find(x => x.innerText.includes(l)); return e ? parseInt(e.querySelector('strong').textContent) : null; }, label);
  // 1) المفضلة
  ok(await stat('قصص مفضلة') === 0, `${tag}: favorites stat starts 0`);
  const fillBefore = await p.evaluate(() => document.querySelector('.favorite-toggle path').getAttribute('fill'));
  await p.click('.favorite-toggle'); await p.waitForTimeout(300);
  ok(await stat('قصص مفضلة') === 1, `${tag}: favoriting makes stat 1`);
  const fillAfter = await p.evaluate(() => document.querySelector('.favorite-toggle path').getAttribute('fill'));
  ok(fillBefore === 'none' && fillAfter !== 'none', `${tag}: star looks different when favorited (${fillBefore} -> ${fillAfter})`);
  await p.selectOption('#filter', 'favorites'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => [...document.querySelectorAll('.story-card')].filter(c => !c.hidden).length) === 1, `${tag}: favorites filter shows exactly 1`);
  await p.selectOption('#filter', 'all'); await p.waitForTimeout(200);
  await p.click('.favorite-toggle[aria-pressed="true"]'); await p.waitForTimeout(300);
  ok(await stat('قصص مفضلة') === 0, `${tag}: un-favoriting makes stat 0`);
  // 2) العداد
  await p.evaluate(() => { const d = n => { const c = new Date(); c.setDate(c.getDate() - n); return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, '0')}-${String(c.getDate()).padStart(2, '0')}`; }; state.activity.days = [d(2), d(1)]; save(); renderLibrary(); });
  await p.waitForTimeout(300);
  ok(await stat('أيام متتالية') === 2, `${tag}: streak shows 2 for yesterday + day before`);
  await p.click('.story-card [data-open]'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('#readerOverlay [data-close]')?.click()); await p.waitForTimeout(400);
  const s3 = await stat('أيام متتالية'); const hx = await p.evaluate(() => HX.streak());
  ok(s3 === 3 && hx === 3, `${tag}: opening a story today makes streak 3 on the card stats and in Hikma+ (${s3}/${hx})`);
  // 3) معنى الكلمة والجملة
  await p.click('.story-card [data-open]'); await p.waitForTimeout(600);
  await p.locator('#readingText [data-line="1"]').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  const pt = await p.evaluate(() => { const sp = document.querySelector('#readingText [data-line="1"]'); const tn = sp.firstChild; const rg = document.createRange(); rg.setStart(tn, 4); rg.setEnd(tn, 8); const b = rg.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; });
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(900);
  const pop = await p.evaluate(() => document.querySelector('.word-pop')?.innerText || '');
  ok(/fence/.test(pop), `${tag}: tapping a word shows its meaning (${JSON.stringify(pop.slice(0, 40))})`);
  await p.click('.word-pop-sentence'); await p.waitForTimeout(900);
  const pop2 = await p.evaluate(() => document.querySelector('.word-pop-sent-out')?.innerText || '');
  ok(/fence/.test(pop2), `${tag}: sentence meaning shown (${JSON.stringify(pop2.slice(0, 30))})`);
  await p.screenshot({path: `/tmp/behavior-${tag}.png`});
  await p.mouse.click(10, 10); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector('.word-pop')), `${tag}: popup closes on outside tap`);
  ok(r.errs.length === 0, 'no errors ' + r.errs.join('|'));
  await r.ctx.close();
}
await browser.close(); stop(); process.exit(summary('behavior') ? 1 : 0);
