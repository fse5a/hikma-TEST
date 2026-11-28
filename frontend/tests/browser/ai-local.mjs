// دفعة ٧ (ذكاء على الجهاز): الأسئلة والكلمات المهمة ومستوى النص على نص خارجي، والنتيجة اللي بتظهر فعلًا.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 420, h: 900, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const AR = 'ذهب سامي إلى السوق مع أمه في الصباح. اشترى سامي تفاحًا أحمر وخبزًا طازجًا. بعد ذلك عاد سامي إلى البيت وهو سعيد. جلس سامي في الحديقة يأكل التفاح.';
const EN = 'The fox walked into the forest at dawn. The fox found a hidden river and drank some water. Then the fox slept under a big tree.';
const r = await page.evaluate(([ar, en]) => ({
  k: HX.keywords(ar).map(x => x.word), ke: HX.keywords(en).map(x => x.word),
  la: HX.textLevel(ar), le: HX.textLevel(en), short: HX.textLevel('كلمتين بس'),
  q: HX.makeQuiz(ar, [en], () => 0.3).map(q => [q.kind, q.options.length, q.options.includes(q.answer)]),
  q2: HX.makeQuiz('جملة وحدة قصيرة بس.', [], () => .1).length
}), [AR, EN]);
ok(r.k[0] === 'سامي' && r.k.includes('التفاح') === false ? true : r.k.includes('سامي'), 'Arabic keywords found the main character: ' + r.k.slice(0, 4).join(','));
ok(r.ke[0] === 'fox', 'English keywords: ' + r.ke.slice(0, 3).join(','));
ok(r.la && r.le && r.short === null, `levels computed, too-short text gives none: ${r.la?.name}/${r.le?.name}`);
const hard = await page.evaluate(() => HX.textLevel('تعتبر الاستراتيجيات التسويقية المعاصرة مجموعة متكاملة من الأنشطة التحليلية والتنظيمية التي تستهدف تحقيق التوافق بين احتياجات المستهلكين وقدرات المؤسسات الإنتاجية، وتستلزم دراسة معمقة لسلوك الأسواق المتغيرة باستمرار. كما تتطلب المؤسسات الحديثة مواءمة مستمرة بين الموارد البشرية والإمكانات التكنولوجية المتاحة لديها.'));
ok(r.la.key === 'easy' && hard.key === 'hard', `kid text is easy, academic text is hard: ${r.la.name} (${r.la.score}) / ${hard.name} (${hard.score})`);
ok(r.q.length === 2 && r.q.every(x => x[2]), 'quiz has order + odd-one-out questions, answer is among options: ' + JSON.stringify(r.q));
ok(r.q2 === 0, 'text with fewer than 3 sentences produces no questions');
// تجربة حقيقية في الشاشة
await page.evaluate(([t]) => { state.stories.unshift({id: 'ai-t', title: 'اختبار', text: t, lang: 'ar', progress: 0, icon: '📖'}); save(); renderLibrary(); chooseStory('ai-t'); }, [AR]);
await page.waitForTimeout(800);
await page.evaluate(() => HX.features.find(f => f.id === 'aiquiz').open());
await page.waitForTimeout(400);
const qtext = await page.locator('#hxAiQ, [id=hxAiQ]').innerText().catch(() => '');
ok(/سؤال 1 من/.test(qtext) && /إيه اللي حصل الأول/.test(qtext), 'quiz dialog shows question 1');
const stars0 = await page.evaluate(() => HX.profile.stars || 0);
const right = await page.evaluate(() => { const o = [...document.querySelectorAll('button[data-hx-aiq]')].map(b => b.textContent.trim()); return o; });
ok(right.length === 3, 'three options shown: ' + right.length);
// أول جملة في النص هي الصح
const idx = await page.evaluate(t => { const bs = [...document.querySelectorAll('button[data-hx-aiq]')].map(b => b.textContent.trim()); const pos = bs.map(x => t.indexOf(x.replace(/[.]$/, ''))); return pos.indexOf(Math.min(...pos)); }, AR);
await page.locator('button[data-hx-aiq]').nth(idx).click();
await page.waitForTimeout(300);
const msg = await page.locator('#hxAiMsg').innerText().catch(() => '');
const stars1 = await page.evaluate(() => HX.profile.stars || 0);
ok(/صح!/.test(msg), 'feedback shown: ' + msg.slice(0, 40));
ok(!/مش دي/.test(msg) ? stars1 === stars0 + 1 : true, `a correct answer adds a star (${stars0} -> ${stars1})`);
await page.screenshot({path: '/tmp/ai-quiz.png'});
await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); HX.features.find(f => f.id === 'aikeys').open(); });
await page.waitForTimeout(300);
ok((await page.locator('[data-hx-say]').count()) >= 3, 'keywords dialog lists tappable words');
await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); HX.features.find(f => f.id === 'ailevel').open(); });
await page.waitForTimeout(300);
ok(/مستوى النص: (سهل|متوسط|صعب)/.test(await page.locator('body').innerText()), 'level dialog shows a level');
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech never called');
await browser.close(); stop(); process.exit(summary('ai-local') ? 1 : 0);
