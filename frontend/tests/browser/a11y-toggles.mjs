// كل خيار إمكانية وصول: شغّله ثم أطفيه ونتأكد إنه رجع زي ما كان. على شاشة الدخول وجوه التطبيق.
import {launch, newPage, ok, summary, startServer} from './helpers.mjs';
const stop = await startServer();
const browser = await launch();
const root = (page, k) => page.evaluate(k => document.documentElement.dataset[k], k);
const setting = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem('hikma-library-v2') || '{}').settings?.[k], k);

// ---------- شاشة الدخول ----------
{
  const {page, errs} = await newPage(browser);
  const icon = await page.evaluate(() => { const b = document.querySelector('#a11yToggle'); const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); const sv = b.querySelector('svg'); return {w: Math.round(r.width), h: Math.round(r.height), tr: cs.transform, rot: cs.rotate, hasSvg: !!sv}; });
  ok(icon.w === icon.h, `gate a11y button is square (${icon.w}x${icon.h})`);
  ok(icon.tr === 'none' && icon.rot === 'none', 'gate a11y button is not rotated/tilted');
  ok(icon.hasSvg, 'gate a11y icon is an inline SVG');
  ok(await root(page, 'a11y') !== 'on', 'gate starts with a11y off');
  for (let i = 1; i <= 4; i++) {
    await page.click('#a11yToggle'); await page.waitForTimeout(350);
    const on = i % 2 === 1;
    ok(await root(page, 'a11y') === (on ? 'on' : 'off'), `gate toggle #${i}: a11y ${on ? 'on' : 'off'}`);
    ok(await root(page, 'hc') === (on ? 'on' : 'off'), `gate toggle #${i}: high contrast ${on ? 'on' : 'off'}`);
    ok(await page.getAttribute('#a11yToggle', 'aria-pressed') === String(on), `gate toggle #${i}: aria-pressed`);
    const ink = await page.evaluate(() => document.documentElement.style.getPropertyValue('--ink').trim());
    ok(on ? ink === '#fff' : ink !== '#fff', `gate toggle #${i}: colours ${on ? 'high-contrast' : 'back to normal'}`);
  }
  // الضغط في أي مكان تاني على البوابة ما يشغّلش الوضع
  await page.click('.gate-brand h1, #onboarding h1, #onboarding p', {timeout: 3000}).catch(() => {});
  ok(await root(page, 'a11y') === 'off', 'clicking elsewhere on the gate does not switch a11y on');
  ok(errs.length === 0, 'gate: no console errors ' + errs.join('|'));
}

// ---------- جوه التطبيق ----------
{
  const {page, errs} = await newPage(browser, {w: 1100, seed: {activated: true, age: 'o16', a11y: false, skin: 'hikma', theme: 'light'}});
  await page.click('#a11yToggle'); await page.waitForTimeout(300);
  ok(await root(page, 'a11y') === 'on', 'app: helper button on');
  await page.click('#a11yToggle'); await page.waitForTimeout(300);
  ok(await root(page, 'a11y') === 'off' && await root(page, 'hc') === 'off', 'app: helper button off again, contrast back to normal');
  await page.click('#settingsOpen'); await page.waitForTimeout(400);
  // زر الإعدادات «المساعدة»
  for (const want of [true, false, true, false]) {
    await page.click('#settingsA11y'); await page.waitForTimeout(250);
    ok(await root(page, 'a11y') === (want ? 'on' : 'off'), `settings helper button -> ${want ? 'on' : 'off'}`);
  }
  // الصناديق: شغّل ثم أطفي
  const boxes = {a11yHighContrast: 'highContrast', a11yDyslexiaFont: 'dyslexiaFont', a11yReducedMotion: 'reducedMotion', a11yVoiceGuidance: 'voiceGuidance', a11ySimpleMode: 'simpleMode', a11yHaptics: 'haptics'};
  for (const [id, key] of Object.entries(boxes)) {
    const start = await page.isChecked('#' + id);
    await page.evaluate(id => { const e = document.getElementById(id); e.scrollIntoView(); }, id);
    await page.evaluate(id => document.getElementById(id).click(), id); await page.waitForTimeout(200);
    ok(await page.isChecked('#' + id) === !start && await setting(page, key) === !start, `${id}: toggled ${!start}`);
    if (id === 'a11yHighContrast') ok(await root(page, 'hc') === (!start ? 'on' : 'off'), 'high contrast applies');
    if (id === 'a11yDyslexiaFont') ok((await page.evaluate(() => document.documentElement.style.fontFamily)).includes('Dyslexic') === !start, 'dyslexia font applies');
    await page.evaluate(id => document.getElementById(id).click(), id); await page.waitForTimeout(200);
    ok(await page.isChecked('#' + id) === start && await setting(page, key) === start, `${id}: back to ${start}`);
    if (id === 'a11yHighContrast') ok(await root(page, 'hc') === (start ? 'on' : 'off'), 'high contrast removed');
    if (id === 'a11yDyslexiaFont') ok((await page.evaluate(() => document.documentElement.style.fontFamily)).includes('Dyslexic') === start, 'dyslexia font removed');
  }
  // القوائم والمنزلقات
  await page.selectOption('#a11yHighlightStyle', {index: 1}); await page.waitForTimeout(150);
  const hs = await setting(page, 'highlightStyle');
  await page.selectOption('#a11yHighlightStyle', {index: 0}); await page.waitForTimeout(150);
  ok(hs !== undefined && await setting(page, 'highlightStyle') !== hs, 'highlight style changes and returns');
  await page.evaluate(() => { const e = document.getElementById('a11yLineSpacing'); e.value = e.options ? e.options[e.options.length - 1].value : e.max; e.dispatchEvent(new Event('change', {bubbles: true})); });
  await page.waitForTimeout(150);
  const big = await page.evaluate(() => document.documentElement.style.getPropertyValue('--reading-line-height'));
  await page.evaluate(() => { const e = document.getElementById('a11yLineSpacing'); e.value = e.options ? e.options[0].value : e.min; e.dispatchEvent(new Event('change', {bubbles: true})); });
  await page.waitForTimeout(150);
  ok(big !== await page.evaluate(() => document.documentElement.style.getPropertyValue('--reading-line-height')), 'line spacing changes and returns');
  await page.click('[data-close=appSettingsOverlay]'); await page.waitForTimeout(300);

  // نافذة «سهولة القراءة والاستخدام»
  await page.evaluate(() => HX.features.find(f => f.id === 'access').open()); await page.waitForTimeout(300);
  for (const [id, key] of [['hxDys', 'dyslexia'], ['hxFocus', 'focusMode'], ['hxAnnounce', 'announce'], ['hxScan', 'switchScan']]) {
    await page.evaluate(id => document.getElementById(id).click(), id); await page.waitForTimeout(150);
    ok(await page.evaluate(k => HX.prefs[k], key) === true, `${id} on`);
    await page.evaluate(id => document.getElementById(id).click(), id); await page.waitForTimeout(150);
    ok(!await page.evaluate(k => HX.prefs[k], key), `${id} off`);
  }
  ok(await root(page, 'dyslexia') === 'off' && await root(page, 'focusMode') === 'off' && await root(page, 'switchScan') === 'off', 'all a11y modes are back off on the page');
  for (const v of ['light', 'dark', 'off']) {
    await page.selectOption('#hxContrast', v); await page.waitForTimeout(150);
    ok(await root(page, 'contrast') === v, `contrast ${v}`);
  }
  ok(errs.length === 0, 'app: no console errors ' + errs.join('|'));
}
await browser.close(); stop();
process.exit(summary('a11y-toggles') ? 1 : 0);
