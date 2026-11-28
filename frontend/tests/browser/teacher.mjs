// ملخص للمعلم: على نص خارجي بيطلع تقرير فيه العنوان والتقدم والملخص والكلمات، والتنزيل بيشتغل فعلًا.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 420, h: 900, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}, ctx: {acceptDownloads: true}});
await page.evaluate(() => { state.stories.unshift({id: 'te-t', title: 'رحلة الثعلب', text: 'ذهب الثعلب إلى الغابة في الصباح الباكر. وجد الثعلب نهرًا جميلًا وشرب منه. ثم نام الثعلب تحت شجرة كبيرة. تعلم الثعلب أن الصبر يجلب الراحة.', lang: 'ar', progress: 0, icon: '📖'}); save(); renderLibrary(); chooseStory('te-t'); });
await page.waitForTimeout(700);
await page.evaluate(() => HX.features.find(f => f.id === 'teacher').open());
await page.waitForTimeout(300);
const txt = await page.inputValue('#hxTeachTxt');
ok(/تقرير قراءة: رحلة الثعلب/.test(txt), 'report has the story title');
ok(/التقدم في القصة: \d+%/.test(txt), 'report has progress');
ok(/الملخص: .{15,}/.test(txt), 'report has a summary');
ok(/أهم الكلمات: .*الثعلب/.test(txt), 'report lists the key word الثعلب');
const [dl] = await Promise.all([page.waitForEvent('download', {timeout: 5000}).catch(() => null), page.locator('#hxTeachSave').click()]);
ok(!!dl, 'download starts: ' + (dl ? dl.suggestedFilename() : 'none'));
await page.screenshot({path: '/tmp/teacher.png'});
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech never called');
await browser.close(); stop(); process.exit(summary('teacher') ? 1 : 0);
