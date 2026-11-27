// الرسم التلقائي لازم يطابق شخصيات القصة وأماكنها، ولو مفيش شخصيات يطلع مشهد محايد (مفيش بومة ولا شخصية غلط).
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const d = await page.evaluate(() => { const s = state.stories.find(x => x.id === 'cart-doraemon'); const r = HX.scene(s.text, s.title); return {found: !!s, names: r.names, chars: r.chars, alt: r.alt}; });
ok(d.found, 'Doraemon story exists');
ok(d.chars.includes('doraemon'), 'Doraemon story art includes Doraemon: ' + d.alt);
ok(d.chars.includes('boy'), 'Doraemon story art includes a boy (Nobita)');
ok(!d.alt.includes('البومة') && !d.names.includes('مزرعة'), 'no owl and no farm in the Doraemon art');
const outs = await page.evaluate(() => ['كان في يوم هادي. مشي الراوي في طريق طويل وفكر في أيامه.', 'The quiet afternoon passed slowly and nothing happened.'].map(t => HX.scene(t, 'نص من بره')));
ok(outs.every(o => o.chars.length === 0), 'outside text with no characters: neutral scene, no character at all');
ok(outs.every(o => !o.alt.includes('البومة') && !o.alt.includes('أرنب')), 'outside text never gets owl or rabbit by default');
const sea = await page.evaluate(() => HX.scene('نزل الولد إلى البحر ليلا ورأى القمر والنجوم', 'البحر').names);
ok(sea.includes('ماء') && sea.includes('ليل'), 'places detected from text: ' + sea.join(','));
// رسم فعلي وصورة
await page.evaluate(() => HX.features); 
await page.evaluate(async () => { const s = state.stories.find(x => x.id === 'cart-doraemon'); window.__r = HX.scene(s.text, s.title); });
await page.screenshot({path: '/tmp/rel/scene-doraemon-page.png'});
ok(errs.length === 0, 'no errors ' + errs.join('|'));
await browser.close(); stop(); process.exit(summary('scene-art') ? 1 : 0);
