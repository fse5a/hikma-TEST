# Frontend

What runs in the browser. Plain HTML + JS, no framework.

- `index.html` is the page, `app.js` is library + reader.
- `restored-features.js`: login gate, themes, settings, dashboard, backup, natural voice, translation, tap-a-word. Biggest file, still one closure.
- `skins.js` (palettes, mascots), `features-styles.js` (runtime CSS).
- `scanner.js` (QR + OCR), `pdf-import.js` (PDF text). OCR files are in `vendor/tesseract`.
- `api-client.js`: the only code that calls `/api/*`.
- `settings.js`, `public-data.js`, `i18n.js`.
- `sw.js`: service worker for offline. The build stamps its cache name.
- `auto-update.js`: picks up new versions by itself (safe reload, or a «تحديث جديد» banner).
- `manifest.webmanifest`, `voices.json`, `test-sentences.json`: public data, no secrets.
- `tests/`: unit tests and Playwright specs.
