// أصوات الشخصيات (كل شخصية صوتها ثابت ومختلف) وجو المشهد (بيتحدد من أي نص وبيتغيّر مع القصة).
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const v = await page.evaluate(() => {
  const s = state.stories.find(x => x.id === 'cart-doraemon');
  const segs = s.text.split(/\n|(?<=[.!؟])\s+/).flatMap(l => HX.roleSegments(l)).filter(x => x.who !== 'narrator');
  const who = [...new Set(segs.map(x => x.who))];
  const n = HX.charVoice('نوبيتا'), d = HX.charVoice('دورايمون'), n2 = HX.charVoice('نوبيتا');
  const out = HX.roleSegments('«أنا جعان» قال سامي وهو يضحك.').map(x => x.who);
  const colon = HX.roleSegments('ليلى: يلا نلعب').map(x => x.who);
  return {who, n, d, same: JSON.stringify(n) === JSON.stringify(n2), out, colon, fem: HX.charVoice('منى', true).p > HX.charVoice('سامي', false).p};
});
ok(v.who.includes('نوبيتا') && v.who.includes('دورايمون'), 'dialogue speakers found in the Doraemon story: ' + v.who.join(','));
ok(v.n.p !== v.d.p, `Nobita and Doraemon have different pitch (${v.n.p} vs ${v.d.p})`);
ok(v.d.role === 'روبوت' && v.n.role === 'طفل', 'roles labelled: ' + v.d.role + ' / ' + v.n.role);
ok(v.same, 'same character keeps the same voice every time');
ok(v.out.includes('سامي'), 'speaker after the quote is detected: ' + v.out.join(','));
ok(v.colon.includes('ليلى'), 'Name: text dialogue detected');
ok(v.fem, 'feminine speaker gets higher pitch');
const sc = await page.evaluate(() => ({
  a: HX.detectScene('نزل الولد إلى البحر وسمع صوت الموج'), b: HX.detectScene('دخل الغابة وسمع الطيور'), c: HX.detectScene('في السوق نادى البائع'),
  d: HX.detectScene('بدأت المعركة وسلّوا السيوف'), e: HX.detectScene('كان يمشي في الصحراء'), f: HX.detectScene('جلسة هادية'), g: HX.detectScene('ذهب إلى المدرسة')
}));
ok(sc.a === 'sea' && sc.b === 'forest' && sc.c === 'market' && sc.d === 'battle' && sc.e === 'desert' && sc.g === 'school', 'scenes detected from any text: ' + JSON.stringify(sc));
ok(sc.f === null, 'neutral text has no scene');
const eng = await page.evaluate(async () => { const seq = []; for (const n of ['sea', 'forest', 'battle', 'house', 'market', 'night', 'rain', 'desert', 'city', 'school']) { HX.scene2.set(n); seq.push(HX.scene2.current); await new Promise(r => setTimeout(r, 150)); } HX.scene2.stop(); return seq.join(','); });
ok(eng === 'sea,forest,battle,house,market,night,rain,desert,city,school', 'ambience engine switches between all 10 scenes: ' + eng);
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech api never called');
await browser.close(); stop(); process.exit(summary('voices-scenes') ? 1 : 0);
