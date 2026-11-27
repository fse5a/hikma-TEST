import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const {page, errs, speech} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
ok(await page.evaluate(() => !HX.religiousOn()), 'religious section off by default');
await page.evaluate(() => HX.features.find(f => f.id === 'adhkar').open()); await page.waitForTimeout(150);
ok(!(await page.$('#hxAdhAudio')), 'adhkar does not open while religious section is off');
await page.click('.profile-chip'); await page.waitForTimeout(300);
const hubOff = await page.evaluate(() => { const o = document.getElementById('hxHub'); return o ? !!o.querySelector('[data-hx-feature=adhkar]') : false; });
ok(hubOff === false, 'adhkar/quran tiles hidden in hub when off');
await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); document.getElementById('settingsOverlay').classList.add('open'); });
await page.waitForTimeout(200);
await page.check('#hxReligiousOn'); await page.waitForTimeout(150);
ok(await page.evaluate(() => HX.religiousOn()), 'settings toggle turns religious section on');
const r = await page.evaluate(() => ({
  feats: ['adhkar', 'quran', 'big', 'table', 'mine', 'memories', 'changelog'].map(id => !!HX.features.find(f => f.id === id)),
  tbl: HX.tableToSpeech('الاسم، السعر\nتفاح، 10\nموز، 7'),
  url: HX.quranUrl('Alafasy_128kbps', 1, 2)
}));
ok(r.feats.every(Boolean), 'all elder features registered');
ok(r.tbl === 'الصف 1: الاسم تفاح، السعر 10. الصف 2: الاسم موز، السعر 7', 'table read in order from any pasted text: ' + r.tbl);
ok(r.url === 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3', 'quran url ' + r.url);
await page.evaluate(() => HX.features.find(f => f.id === 'mine').open()); await page.waitForTimeout(200);
await page.fill('#hxMName', 'عم أحمد'); await page.fill('#hxMPhone', '0123'); await page.fill('#hxMAddr', 'شارع النيل'); await page.click('#hxMSave');
ok(await page.evaluate(() => HX.mineText()) === 'اسمي عم أحمد. رقمي 0 1 2 3. عنواني شارع النيل', 'my info saved and spoken text built');
await page.evaluate(() => HX.features.find(f => f.id === 'adhkar').open()); await page.waitForTimeout(200);
ok(await page.isVisible('#hxAdhAudio') && !(await page.$('#hxAdhSay')), 'adhkar uses a real recording, no synthetic voice button');
ok(await page.evaluate(() => /archive\.org\/download\/AZKAR_MICHARY/.test(HX.adhkarAudio.morning)), 'adhkar audio source');
await page.evaluate(() => HX.features.find(f => f.id === 'quran').open()); await page.waitForTimeout(200);
ok((await page.$$('button[data-hx-sura]')).length >= 10, 'quran surah buttons shown');
await page.evaluate(() => HX.features.find(f => f.id === 'big').open()); await page.waitForTimeout(200);
ok(await page.isVisible('#hxBigRead'), 'big button dialog');
const m = await page.evaluate(async () => { await HX.memories.put({id: 't1', name: 'ذكرى', blob: new Blob(['a'])}); const a = await HX.memories.all(); await HX.memories.del('t1'); return a.length + ':' + (await HX.memories.all()).length; });
ok(m === '1:0', 'family memories stored then deleted on device: ' + m);
ok(errs.length === 0, 'no errors ' + errs.join('|')); ok(speech.length === 0, 'speech api never called');
await browser.close(); stop(); process.exit(summary('elder') ? 1 : 0);
