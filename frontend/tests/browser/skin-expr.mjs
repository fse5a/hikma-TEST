// تعبيرات الشخصيات: الصور بتتحمّل فعلاً، وبتتبدّل مع الأحداث وترجع، ودووم وفيليكس بيفضلوا بصورتهم
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer(); const browser = await launch();
const unlocked = ['cat', 'bot', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom', 'felix'];
const src = p => p.evaluate(() => document.querySelector('#mascotBuddy .buddy-img')?.getAttribute('src') || '');
for (const skin of ['cat', 'bot', 'doraemon', 'mickey', 'anbu', 'uchiha', 'zelda', 'doom', 'felix']) {
  const {page, errs} = await newPage(browser, {w: 1100, h: 800, seed: {activated: true, age: 'o16', a11y: false, skin, theme: 'light', unlockedSkins: unlocked}});
  await page.waitForTimeout(1200);
  const has = !['doom', 'felix'].includes(skin);
  const before = await src(page);
  await page.evaluate(() => dispatchEvent(new Event('hikma:wrong')));
  await page.waitForTimeout(300);
  const during = await src(page);
  if (has) {
    ok(`${skin}: تعبير جرّب تاني ظهر`, /expr\/.*-tryagain\.webp/.test(during));
    const loaded = await page.evaluate(async u => { const i = new Image(); i.src = u; try { await i.decode(); } catch { return 0; } return i.naturalWidth; }, during);
    ok(`${skin}: الصورة اتحمّلت فعلاً (${loaded}px)`, loaded > 100);
    await page.evaluate(() => dispatchEvent(new Event('hikma:finished')));
    await page.waitForTimeout(200);
    ok(`${skin}: احتفال بعد إنهاء القصة`, /-celebrate\.webp/.test(await src(page)));
    await page.evaluate(() => HikmaSkinExpr.restore());
    ok(`${skin}: بترجع للصورة العادية`, await src(page) === before);
  } else ok(`${skin}: من غير تعبيرات، صورتها زي ما هي`, during === before && !/expr/.test(during));
  ok(`${skin}: من غير أخطاء`, errs.length === 0);
  await page.close();
}
await browser.close(); stop && stop(); summary();
