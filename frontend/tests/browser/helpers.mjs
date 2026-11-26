// أدوات مشتركة لاختبارات المتصفح (playwright-core + Chrome). التشغيل: npm run test:browser
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';

export const BASE = process.env.BASE || 'http://127.0.0.1:4173';
export const CHROME = process.env.CHROME || '/opt/google/chrome/chrome';
let fails = 0, checks = 0;
export const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
export const summary = name => { console.log(`${name}: ${checks} checks, ${fails} failures`); return fails; };
export const launch = () => chromium.launch({executablePath: CHROME, args: ['--no-sandbox']});
export async function startServer() {
  if (process.env.BASE) return () => {};
  const child = spawn('node', ['scripts/dev-server.js'], {stdio: 'ignore'});
  await new Promise(r => setTimeout(r, 1500));
  return () => child.kill();
}
// صفحة جديدة بـ API مقلّد (ما بنكلّمش خدمات الكلام أبدًا)
export async function newPage(browser, {w = 420, h = 900, seed, api = {}} = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, locale: 'ar-EG'});
  const page = await ctx.newPage();
  const errs = [], speech = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  if (seed) await page.addInitScript(s => { if (!localStorage.getItem('__seeded')) { localStorage.setItem('hikma-library-v2', JSON.stringify({settings: s})); localStorage.setItem('__seeded', '1'); } }, seed);
  await page.route('**/api/**', route => {
    const url = route.request().url();
    if (url.includes('/api/speech')) { speech.push(url); return route.fulfill({status: 503, body: '{}'}); }
    for (const [k, fn] of Object.entries(api)) if (url.includes(k)) return fn(route);
    route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', integrations: {}})});
  });
  await page.goto(BASE + '/');
  await page.waitForTimeout(800);
  return {page, ctx, errs, speech};
}
