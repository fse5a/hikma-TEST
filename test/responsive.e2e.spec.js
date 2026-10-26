import test, {expect} from '@playwright/test';
import axe from 'axe-core';

const viewports = [320, 360, 390, 412, 600, 768, 1024, 1280, 1920];
const skins = ['hikma', 'cat', 'bot'];
const ages = ['o16', 'u16'];
const accessibilityStates = [false, true];

async function mockApi(page, calls = []) {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const body = route.request().postDataJSON?.() || {};
    calls.push({path: url.pathname, body});
    let result = {ok: true, mode: 'demo'};
    if (url.pathname === '/api/health') result = {ok: true, mode: 'demo', integrations: {}};
    if (url.pathname === '/api/activate') result = {ok: true, mode: 'demo', activation: {status: 'demo'}};
    if (url.pathname === '/api/translate') result = {...result, text: body.text, translatedText: body.text};
    if (url.pathname === '/api/diacritize') result = {...result, text: body.text};
    if (url.pathname === '/api/speech') result = {...result, audioUrl: null};
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(result)});
  });
}

async function openReadyApp(page, settings) {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/');
  await page.evaluate(value => {
    localStorage.setItem('hikma-library-v2', JSON.stringify({
      settings: {activated: true, age: value.age, a11y: value.a11y, skin: value.skin, theme: 'light'},
      stories: value.stories || [{id: 'test-story', title: 'قصة الاختبار', lang: 'ar', text: 'هذه قصة قصيرة للاختبار.', progress: 0, icon: '📖'}]
    }));
  }, settings);
  await page.reload();
  await expect(page.locator('#onboarding')).toBeHidden();
}

async function audit(page, label) {
  await page.addScriptTag({content: axe.source});
  const violations = await page.evaluate(async () => {
    const results = await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']}});
    return results.violations
      .filter(item => ['serious', 'critical'].includes(item.impact))
      .map(item => `${item.id}: ${item.nodes.map(node => `${node.target.join(', ')} (${node.failureSummary || ''})`).join('; ')}`);
  });
  expect(violations, `serious/critical axe violations in ${label}`).toEqual([]);
}

function silentWavBase64() {
  const wav = Buffer.alloc(46);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(2, 40);
  return wav.toString('base64');
}

function minimalPdf() {
  const stream = 'BT /F1 18 Tf 40 250 Td (A small PDF story for testing.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

test('responsive layout, accessibility control, and mobile navigation', async ({page}, testInfo) => {
  await mockApi(page);
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});

  for (const width of viewports) {
    await page.setViewportSize({width, height: 850});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const button = page.locator('#a11yToggle');
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    expect(bounds?.width).toBe(64);
    expect(bounds?.height).toBe(64);
    const overlaps = await page.evaluate(() => {
      const buttonRect = document.querySelector('#a11yToggle').getBoundingClientRect();
      return [...document.querySelectorAll('.brand, .top-actions, main')].some(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && buttonRect.left < rect.right && buttonRect.right > rect.left && buttonRect.top < rect.bottom && buttonRect.bottom > rect.top;
      });
    });
    expect(overlaps, `accessibility control overlaps page content at ${width}px`).toBe(false);
    const interactiveOverlap = await page.evaluate(() => {
      const control = document.querySelector('#a11yToggle').getBoundingClientRect();
      return [...document.querySelectorAll('button,input,select,textarea,a[href],[role="button"]')]
        .filter(element => element.id !== 'a11yToggle' && element.getClientRects().length)
        .filter(element => {
          const rect = element.getBoundingClientRect();
          return control.left < rect.right && control.right > rect.left && control.top < rect.bottom && control.bottom > rect.top;
        })
        .map(element => element.id || element.getAttribute('aria-label') || element.tagName);
    });
    expect(interactiveOverlap, `accessibility control overlaps an interactive element at ${width}px`).toEqual([]);
    if (width <= 600) await expect(page.locator('.mobile-nav')).toBeVisible();
    else await expect(page.locator('.mobile-nav')).toBeHidden();

    const clippedText = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p,button,label,a,[role="status"]')]
      .filter(element => element.textContent?.trim() && !element.closest('.sr-only') && element.getClientRects().length)
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return [...document.querySelectorAll('body *')].some(ancestor => {
          if (!ancestor.contains(element)) return false;
          const style = getComputedStyle(ancestor);
          const ancestorRect = ancestor.getBoundingClientRect();
          return ((style.overflowX === 'hidden' || style.overflowX === 'clip') && (rect.left < ancestorRect.left - 1 || rect.right > ancestorRect.right + 1))
            || ((style.overflowY === 'hidden' || style.overflowY === 'clip') && (rect.top < ancestorRect.top - 1 || rect.bottom > ancestorRect.bottom + 1));
        });
      })
      .map(element => `${element.tagName.toLowerCase()}.${element.className?.baseVal || element.className}`));
    expect(clippedText, `clipped content at ${width}px`).toEqual([]);
    await page.screenshot({path: testInfo.outputPath(`responsive-${width}.png`)});
  }

  for (const {width, height} of [{width: 740, height: 360}, {width: 844, height: 390}]) {
    await page.setViewportSize({width, height});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path: testInfo.outputPath(`landscape-${width}x${height}.png`)});
  }

  await page.setViewportSize({width: 390, height: 844});
  await page.locator('.mobile-nav [data-target="appSettingsOverlay"]').click();
  await page.locator('#a11yTextScale').evaluate(input => {
    input.value = '200';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('200%');
  const settingsDialog = await page.locator('#appSettingsOverlay .dialog').boundingBox();
  expect(settingsDialog.y + settingsDialog.height).toBeLessThanOrEqual(844);
  await page.locator('#appSettingsOverlay [data-close="appSettingsOverlay"]').click();
});

test('PWA manifest and service worker are available', async ({page}) => {
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  const manifest = await page.evaluate(async () => {
    const response = await fetch(document.querySelector('link[rel="manifest"]').href);
    return response.json();
  });
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some(icon => icon.src === 'icon.svg' && icon.sizes === 'any')).toBe(true);
  expect((await page.request.get('/icon.svg')).status()).toBe(200);
  const serviceWorker = await page.evaluate(async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      const worker = registration.installing || registration.waiting || registration.active;
      if (!worker) return {scope: registration.scope, state: 'no-worker'};
      await Promise.race([
        new Promise(resolve => {
          if (worker.state === 'activated' || worker.state === 'redundant') return resolve();
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated' || worker.state === 'redundant') resolve();
          });
        }),
        new Promise(resolve => setTimeout(resolve, 8000))
      ]);
      return {scriptURL: worker.scriptURL, state: worker.state, scope: registration.scope};
    } catch (error) {
      return {error: String(error)};
    }
  });
  expect(serviceWorker.error).toBeUndefined();
  expect(serviceWorker.scriptURL, JSON.stringify(serviceWorker)).toContain('/sw.js');
  expect(serviceWorker.state, JSON.stringify(serviceWorker)).toBe('activated');
  const cachedAssets = await page.evaluate(() => caches.open('hikma-shell-v6').then(cache => cache.keys().then(keys => keys.map(key => new URL(key.url).pathname))));
  expect(cachedAssets).toContain('/api-client.js');
  expect(cachedAssets).toContain('/manifest.webmanifest');
  expect(cachedAssets).toContain('/style.css');
  expect(cachedAssets).toContain('/pdf-import.js');
  expect(cachedAssets).toContain('/vendor/pdf.worker.min.mjs');
});

test('frontend demo code unlocks onboarding without an activation API request', async ({page}) => {
  const calls = [];
  await mockApi(page, calls);
  await page.goto('/');
  await page.locator('#penCode').fill('wrong');
  const alertMessage = new Promise(resolve => page.once('dialog', async dialog => {
    resolve(dialog.message());
    await dialog.accept();
  }));
  await page.getByRole('button', {name: 'دخول'}).click();
  await expect(alertMessage).resolves.toBe('Wrong Password');

  await page.locator('#penCode').fill('1234');
  await page.getByRole('button', {name: 'دخول'}).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#onboarding')).toBeHidden();
  expect(calls.some(call => call.path === '/api/activate')).toBe(false);
});

test('reader calls translation, diacritization, and speech APIs with honest demo status', async ({page}) => {
  const calls = [];
  await mockApi(page, calls);
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('#library [data-open]').first().click();

  await page.locator('#readLang').selectOption('en');
  await expect.poll(() => calls.some(call => call.path === '/api/translate')).toBe(true);
  await expect(page.locator('#cloudStatus')).toContainText('الوضع التجريبي');
  await expect(page.locator('#readLang')).toHaveValue('original');

  await page.locator('#diacritizeText').click();
  await expect.poll(() => calls.some(call => call.path === '/api/diacritize')).toBe(true);
  await expect(page.locator('#cloudStatus')).toContainText('غير مهيأ');

  await page.locator('#neuralSpeech').click();
  await expect.poll(() => calls.some(call => call.path === '/api/speech')).toBe(true);
  expect(calls.find(call => call.path === '/api/speech').body.language).toBe('ar');
});

test('axe finds no serious or critical violations across R6 views and settings matrix', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await mockApi(page);
  await page.goto('/');
  await audit(page, 'onboarding');

  for (const skin of skins) {
    for (const age of ages) {
      for (const a11y of accessibilityStates) {
        const state = {skin, age, a11y};
        await openReadyApp(page, state);
        await audit(page, `library ${skin}/${age}/a11y-${a11y}`);

        await page.locator('#library [data-open]').first().click();
        await expect(page.locator('#readerOverlay')).toHaveClass(/open/);
        await audit(page, `reader ${skin}/${age}/a11y-${a11y}`);
        await page.locator('[data-close="readerOverlay"]').click();

        await page.locator('#addOpen').click();
        await audit(page, `add story ${skin}/${age}/a11y-${a11y}`);
        await page.locator('#addOverlay').getByRole('button', {name: 'إلغاء'}).click();

        await page.locator('#voiceOpen').click();
        await audit(page, `voice settings ${skin}/${age}/a11y-${a11y}`);
        await page.locator('[data-close="settingsOverlay"]').click();

        await page.locator('#settingsOpen').click();
        await audit(page, `app settings ${skin}/${age}/a11y-${a11y}`);
      }
    }
  }
});

test('frontend demo login works when the API is unreachable', async ({page}) => {
  await page.route('**/api/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.mobile-nav')).toBeHidden();
  await page.locator('#penCode').fill('admin');
  await page.getByRole('button', {name: 'دخول'}).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#onboarding')).toBeHidden();
  await expect(page.locator('.shell')).toBeVisible();
});

test('phone header, modal navigation, accessibility placement, and touch targets', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await mockApi(page);
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.locator('#voiceOpen')).toBeHidden();
  await expect(page.locator('#addOpen')).toBeHidden();
  await expect(page.locator('#settingsOpen')).toBeHidden();
  await expect(page.locator('#themeToggle')).toBeVisible();

  const undersized = await page.evaluate(() => [...document.querySelectorAll('button,select,summary,input:not([type="hidden"]),textarea,[role="button"]')]
    .filter(element => element.getClientRects().length)
    .map(element => ({name: element.getAttribute('aria-label') || element.textContent.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height}))
    .filter(element => element.width < 48 || element.height < 48));
  expect(undersized).toEqual([]);

  await page.locator('#library [data-open]').first().click();
  await expect(page.locator('.mobile-nav')).toBeHidden();
  await expect(page.locator('#readerOverlay .dialog-head #a11yToggle')).toBeVisible();
  await expect(page.locator('#readerContent [data-step="-1"]')).toContainText('Previous');
  await expect(page.locator('#readerContent [data-step="1"]')).toContainText('Next');
  await expect(page.locator('#readerSpeedChip')).toBeVisible();
  await page.locator('#readerSpeedChip').click();
  await expect(page.locator('#readerSpeedPresets')).toBeVisible();
  const readerUndersized = await page.evaluate(() => [...document.querySelectorAll('button,select,summary,input:not([type="hidden"]),textarea,[role="button"]')]
    .filter(element => element.getClientRects().length)
    .map(element => ({name: element.getAttribute('aria-label') || element.textContent.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height}))
    .filter(element => element.width < 48 || element.height < 48));
  expect(readerUndersized).toEqual([]);
});

test('focused input remains visible after a phone viewport resize simulates the keyboard', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await mockApi(page);
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('.mobile-nav [data-target="addOverlay"]').click();
  await page.setViewportSize({width: 390, height: 360});
  await page.locator('#storyText').focus();
  const field = await page.locator('#storyText').boundingBox();
  expect(field.y).toBeGreaterThanOrEqual(0);
  expect(field.y + field.height).toBeLessThanOrEqual(360);
  const dialog = await page.locator('#addOverlay .dialog').boundingBox();
  expect(dialog.y + dialog.height).toBeLessThanOrEqual(360);
});

test('configured diacritization toggles cached text without changing the source story', async ({page}) => {
  const calls = [];
  await mockApi(page, calls);
  await page.route('**/api/diacritize', route => {
    calls.push({path: '/api/diacritize', body: route.request().postDataJSON()});
    return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'configured', text: 'هَذِهِ قِصَّةٌ قَصِيرَةٌ لِلِاخْتِبَارِ.'})});
  });
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('#library [data-open]').first().click();
  const sourceText = await page.locator('#readingText').textContent();

  await page.locator('#diacritizeText').click();
  await expect(page.locator('#readingText')).toContainText('هَذِهِ');
  await expect(page.locator('#diacritizeText')).toHaveAttribute('aria-pressed', 'true');
  expect(calls.filter(call => call.path === '/api/diacritize')).toHaveLength(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hikma-library-v2')).stories[0].text)).toBe(sourceText.trim());

  await page.locator('#diacritizeText').click();
  await expect(page.locator('#readingText')).toContainText(sourceText.trim());
  await page.locator('#diacritizeText').click();
  await expect(page.locator('#readingText')).toContainText('هَذِهِ');
  expect(calls.filter(call => call.path === '/api/diacritize')).toHaveLength(1);
});

test('configured speech worker audio is cached by chunk and reused', async ({page}) => {
  let speechRequests = 0;
  await page.route('**/api/health', route => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'demo', integrations: {speech: 'configured'}, providers: {speech: 'worker'}})}));
  await page.route('**/api/speech', route => {
    speechRequests++;
    return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'configured', provider: 'worker', contentType: 'audio/wav', audioBase64: silentWavBase64()})});
  });
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await expect.poll(() => page.evaluate(() => window.hikmaBackendHealth?.integrations?.speech)).toBe('configured');
  await page.locator('#library [data-open]').first().click();
  await page.locator('#neuralSpeech').click();
  await expect.poll(() => speechRequests).toBe(1);
  await expect.poll(() => page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('hikma-human-audio', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise(resolve => {
      const request = database.transaction('speechCache').objectStore('speechCache').count();
      request.onsuccess = () => resolve(request.result);
    });
  })).toBe(1);
  await page.locator('#neuralSpeech').click();
  await expect.poll(() => speechRequests).toBe(1);
});

test('configured translation switches text, lang, direction, and current voice language together', async ({page}) => {
  const calls = [];
  await mockApi(page, calls);
  await page.route('**/api/translate', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ok: true, mode: 'configured', targetLanguage: 'en', translatedText: 'A short test story.'})
  }));
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('#library [data-open]').first().click();
  await page.locator('#readLang').selectOption('en');
  await expect(page.locator('#readingText')).toContainText('A short test story.');
  await expect(page.locator('#readingText')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#readingText')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('#readerOverlay [role="dialog"]')).toHaveAttribute('lang', 'en');
  await page.locator('#neuralSpeech').click();
  await expect.poll(() => calls.some(call => call.path === '/api/speech')).toBe(true);
  expect(calls.find(call => call.path === '/api/speech').body.language).toBe('en');
});

test('language selector localizes the interface and switches the story language and direction', async ({page}) => {
  await mockApi(page);
  await page.route('**/api/translate', route => {
    const {targetLanguage} = route.request().postDataJSON();
    const text = targetLanguage === 'fr' ? 'Une courte histoire.' : 'A short test story.';
    return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'configured', targetLanguage, translatedText: text})});
  });
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('#settingsOpen').click();
  await page.locator('#uiLanguage').selectOption('fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('main h2')).toHaveText('Votre bibliothèque');
  await page.locator('[data-close="appSettingsOverlay"]').click();
  await page.locator('#library [data-open]').first().click();
  await page.locator('#readLang').selectOption('fr');
  await expect(page.locator('#readingText')).toContainText('Une courte histoire.');
  await expect(page.locator('#readingText')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('#readingText')).toHaveAttribute('dir', 'ltr');
});

test('first load detects a supported browser locale', async ({browser}) => {
  const context = await browser.newContext({locale: 'de-DE', serviceWorkers: 'block'});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await context.close();
});

test('health language recommendation overrides browser locale on first load', async ({browser}) => {
  const context = await browser.newContext({locale: 'ar-EG', serviceWorkers: 'block'});
  const page = await context.newPage();
  await page.route('**/api/health', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ok: true, mode: 'demo', recommendedLanguage: 'fr', integrations: {}})
  }));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await context.close();
});

test('built-in French translation is cached locally and never calls the translation worker', async ({page}) => {
  const calls = [];
  await mockApi(page, calls);
  await openReadyApp(page, {
    age: 'o16', a11y: false, skin: 'hikma',
    stories: [{id: 'seed-1', title: 'حكمة والأرنب الصغير', lang: 'ar', text: 'في ليلة هادئة.', translation: 'On a quiet night.', translations: {fr: 'Par une nuit calme.'}, progress: 0, icon: '🌙'}]
  });
  await page.locator('#library [data-open]').first().click();
  await page.locator('#readLang').selectOption('fr');
  await expect(page.locator('#readingText')).toContainText('Par une nuit calme.');
  await expect(page.locator('#readingText')).toHaveAttribute('lang', 'fr');
  expect(calls.some(call => call.path === '/api/translate')).toBe(false);
});

test('configured Supabase gets an anonymous session and sends its bearer token to protected APIs', async ({page}) => {
  let authorization = '';
  await page.route('**/api/health', route => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'production', integrations: {supabase: 'configured'}, providers: {}})}));
  await page.route('**/api/auth/anonymous', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({access_token: 'test-user-access-token', refresh_token: 'test-refresh', expires_in: 3600})
  }));
  await page.route('**/api/translate', route => {
    authorization = route.request().headers().authorization || '';
    return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, mode: 'configured', translatedText: 'A translated story.'})});
  });
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('#library [data-open]').first().click();
  await page.locator('#readLang').selectOption('en');
  await expect.poll(() => authorization).toBe('Bearer test-user-access-token');
  await expect(page.locator('#readingText')).toContainText('A translated story.');
});

test('URL import clipboard fallback trims, saves, and starts reading locally', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockApi(page);
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  await page.locator('#addOpen').click();
  await page.evaluate(() => navigator.clipboard.writeText(JSON.stringify({title: 'Private story', text: 'The approved story text stays on this device.'})));
  await page.locator('#pasteSendToHikma').click();
  await expect(page.locator('#urlPreviewTitle')).toHaveValue('Private story');
  await page.locator('#urlPreviewText').fill('Only the selected story paragraph.');
  await page.locator('#saveUrlStory').click();
  await expect(page.locator('#readerOverlay')).toHaveClass(/open/);
  await expect(page.locator('#readingText')).toContainText('Only the selected story paragraph.');
});

test('PDF.js extracts text in-browser and the add-story flow stores only extracted text', async ({page}) => {
  await mockApi(page);
  await openReadyApp(page, {age: 'o16', a11y: false, skin: 'hikma'});
  const parsed = await page.evaluate(async source => {
    const file = new File([source], 'sample.pdf', {type: 'application/pdf'});
    return window.HikmaPdf.parse(file, {mode: 'prose'});
  }, minimalPdf());
  expect(parsed.pages).toBe(1);
  expect(parsed.chapters[0].text).toContain('A small PDF story for testing.');
  expect(parsed.needsOcr).toBe(false);

  await page.locator('#addOpen').click();
  await page.locator('#pdfFile').setInputFiles({name: 'sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from(minimalPdf())});
  await page.locator('#parsePdf').click();
  await expect(page.locator('#pdfChapterPanel')).toBeVisible();
  await page.locator('#savePdfChapter').click();
  await expect(page.locator('#readerOverlay')).toHaveClass(/open/);
  await expect(page.locator('#readingText')).toContainText('A small PDF story for testing.');
  const storedPdfKeys = await page.evaluate(() => JSON.stringify(localStorage.getItem('hikma-library-v2')).includes('sample.pdf'));
  expect(storedPdfKeys).toBe(false);
});