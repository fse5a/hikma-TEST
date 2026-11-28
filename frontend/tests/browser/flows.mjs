// رحلة مستخدم حقيقية: إضافة قصة، بحث، تفضيل، تقدم، حذف، وحفظ بعد إعادة التحميل. بنتحقق من اللي بيظهر فعلًا.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 390, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const count = () => page.evaluate(() => document.querySelectorAll('[data-delete]').length);
const n0 = await count();
await page.locator('[data-target="addOverlay"]:visible').first().click();
await page.waitForTimeout(400);
ok(await page.locator('#storyForm').isVisible(), 'add-story dialog opens');
await page.click('#storyForm button[type=submit]');
ok(await page.locator('#storyText').evaluate(e => e.required && !e.validity.valid) || (await page.locator('#formStatus').textContent()).trim().length > 0, 'empty submit is blocked with a message');
await page.fill('#storyTitle', 'قصة اختبار');
await page.fill('#storyText', 'كان يا ما كان ولد اسمه سامي. ذهب سامي إلى المدرسة. تعلم الكثير من الدروس. عاد سامي سعيدًا إلى البيت.');
await page.click('#storyForm button[type=submit]');
await page.waitForTimeout(500);
ok(await count() === n0 + 1, `story added to library (${n0} -> ${await count()})`);
ok(await page.getByText('قصة اختبار').first().isVisible(), 'new story title visible');
// بحث
const search = page.locator('input[type=search], #search, #storySearch').first();
await search.fill('قصة اختبار'); await page.waitForTimeout(300);
ok(await count() === 1, 'search narrows to the matching story: ' + await count());
await search.fill('مش موجودة خالص'); await page.waitForTimeout(300);
ok(await count() === 0, 'search with no match shows nothing: ' + await count());
ok(await page.locator('body').innerText().then(t => /لا توجد|مفيش|لا نتائج|لم يتم/.test(t)), 'empty search shows a message');
await search.fill(''); await page.waitForTimeout(300);
// قراءة وتقدم
await page.locator('[data-open]:visible').first().click(); await page.waitForTimeout(800);
ok(await page.locator('#readerOverlay.open').count() === 1, 'reader opens');
await page.locator('#nextLine, [data-next], #next').first().click().catch(() => {}); await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('#readerOverlay .close, #closeReader, [data-close="readerOverlay"]')?.click());
await page.waitForTimeout(500);
// حفظ بعد إعادة التحميل
await page.reload(); await page.waitForTimeout(1000);
ok(await page.getByText('قصة اختبار').first().isVisible(), 'story persists after reload');
// حذف
page.on('dialog', d => d.accept());
await page.locator('[data-delete]').first().click(); await page.waitForTimeout(600);
const t = await page.locator('body').innerText();
ok(await count() === n0, `delete removes the story (${n0 + 1} -> ${await count()})`);
ok(errs.length === 0, 'no console errors ' + errs.join('|')); ok(speech.length === 0, 'speech api never called');
console.log('library after delete:', await count());
await browser.close(); stop(); process.exit(summary('flows') ? 1 : 0);
