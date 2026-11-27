import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
const outside = 'ذهب الولد الصغير إلى السوق القديم واشترى تفاحا أحمر وخبزا طازجا ثم عاد إلى البيت سعيدا بما جمع';
const r = await page.evaluate(t => ({
  feats: ['board', 'cloze', 'timer', 'map', 'badges', 'family'].map(id => !!HX.features.find(f => f.id === id)),
  lv: [HX.levelOf(0).name, HX.levelOf(12).name, HX.levelOf(150).name],
  c: HX.makeCloze(t), none: HX.makeCloze('كلمتين بس'),
  board: HX.leaderboard().length, fam: HX.familyWeek().goal, map: HX.adventure().length
}), outside);
ok(r.feats.every(Boolean), 'game features registered');
ok(r.lv.join() === 'مبتدئ,قارئ,بطل الكتب', 'levels ' + r.lv.join());
ok(r.c && r.c.options.includes(r.c.answer) && r.c.sentence.includes('_____') && r.c.options.length === 3, 'cloze built from ANY outside text: ' + (r.c && r.c.sentence));
ok(r.none === null, 'cloze refuses text too short');
ok(r.board >= 1 && r.fam === 5 && r.map >= 1, 'leaderboard, family challenge and adventure map data');
await page.evaluate(() => HX.features.find(f => f.id === 'cloze').open()); await page.waitForTimeout(300);
const n = (await page.$$('button[data-hx-cl]')).length;
ok(n === 3, 'cloze dialog shows 3 choices: ' + n);
await page.evaluate(() => HX.features.find(f => f.id === 'board').open()); await page.waitForTimeout(200);
await page.check('#hxBoardOk'); await page.waitForTimeout(300);
ok((await page.$$('#hxBoard li')).length >= 1, 'leaderboard shows only after parent consent');
await page.evaluate(() => HX.features.find(f => f.id === 'timer').open()); await page.waitForTimeout(200);
ok(await page.isVisible('#hxTmGo'), 'timer dialog');
const away = await page.evaluate(() => { HX.profile.days = ['2020-01-01']; return HX.daysAway() > 3; });
ok(away, 'comeback detects days away');
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech api never called');
await browser.close(); stop(); process.exit(summary('games') ? 1 : 0);
