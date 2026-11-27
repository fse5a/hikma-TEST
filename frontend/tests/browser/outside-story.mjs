// أي نص من بره (مش قصص العرض): العبرة والملخص والأسئلة لازم يشتغلوا من غير ما نكتب حاجة قبل كده.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const TEXT = 'كان في فلاح عنده ثلاثة أولاد دايمًا بيتخانقوا مع بعض. جاب الأب حزمة عصيّان وقال لهم اكسروها مرة واحدة. حاول كل واحد منهم وما قدرش يكسرها. بعدين فكّها وادّى كل ولد عود واحد فكسره بسهولة. قال الأب لازم تفضلوا إيد واحدة عشان محدش يقدر عليكم. ومن يومها بطّلوا الخناق وعاشوا مبسوطين.';
const {page, errs, speech} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
await page.evaluate(t => { HX.addStory({title: 'حزمة العصيان (من بره)', text: t, lang: 'ar'}); }, TEXT);
await page.waitForTimeout(500);
const r = await page.evaluate(t => { const s = state.stories.find(x => x.title.includes('من بره')); return {id: s.id, hasMoral: !!s.moral, m: HX.autoMoral(t), sum: HX.summarize(t, 2), q: HX.quizFor(s).length}; }, TEXT);
ok(!r.hasMoral, 'outside story has no prewritten moral');
ok(r.m.length > 10, 'auto moral generated for outside text: ' + r.m);
ok(/لازم|إيد واحدة/.test(r.m), 'auto moral picks the lesson sentence');
ok(r.sum.length === 2, 'summary gives 2 sentences');
ok(r.q >= 2, 'quiz questions generated for outside text: ' + r.q);
const em = await page.evaluate(() => [HX.autoMoral(''), HX.summarize('', 2).length, HX.summarize('Short one only here.', 2).length]);
ok(em[0] === '' && em[1] === 0, 'empty text is safe');
ok(em[2] <= 1, 'short text is safe');
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech api never called');
await browser.close(); stop(); process.exit(summary('outside-story') ? 1 : 0);
