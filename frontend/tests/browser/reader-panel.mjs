// لوحة إعدادات القراءة: زر يخفيها ويوسّع النص، والاختيار بيتحفظ.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const seed = {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'};
for (const [w, h, expectOpen] of [[1440, 900, true], [1440, 650, false]]) {
  const {page, errs} = await newPage(browser, {w, h, seed});
  await page.locator('[data-open]:visible').first().click(); await page.waitForTimeout(900);
  const vis = () => page.locator('.voice-panel').isVisible();
  const tw = () => page.locator('#readingText').evaluate(e => Math.round(e.getBoundingClientRect().width));
  ok(await vis() === expectOpen, `${w}x${h}: panel ${expectOpen ? 'open' : 'closed'} by default`);
  const w0 = await tw();
  await page.locator('.reader-panel-toggle').click(); await page.waitForTimeout(200);
  ok(await vis() === !expectOpen, `${w}x${h}: toggle flips the panel`);
  const w1 = await tw();
  ok(expectOpen ? w1 > w0 + 200 : w1 < w0, `${w}x${h}: text width ${w0} -> ${w1}`);
  await page.screenshot({path: `/tmp/reader-${h}.png`});
  await page.reload(); await page.waitForTimeout(800);
  await page.locator('[data-open]:visible').first().click(); await page.waitForTimeout(900);
  ok(await vis() === !expectOpen, `${w}x${h}: choice is remembered`);
  ok(errs.length === 0, 'no errors ' + errs.join('|'));
  await page.context().close();
}
const m = await newPage(browser, {w: 390, h: 800, seed});
await m.page.locator('[data-open]:visible').first().click(); await m.page.waitForTimeout(900);
ok(await m.page.locator('.reader-panel-toggle').count() === 0, 'phone: no toggle (single column)');
await browser.close(); stop(); process.exit(summary('reader-panel') ? 1 : 0);
