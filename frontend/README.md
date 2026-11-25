# Frontend

What users see in the browser. Plain HTML and JavaScript, no build framework.

- `index.html` - page markup. `app.js` - core library and reader logic.
- `restored-features.js` - onboarding gate, theme switching, settings, dashboard, backups (largest file, next split candidate). `skins.js` - skin palettes and mascot art. `features-styles.js` - runtime stylesheets.
- `scanner.js` - book / QR scanner. `pdf-import.js` - local PDF text import (PDF.js and self-hosted tesseract OCR in `vendor/`).
- `api-client.js` - the only code that talks to `/api/*`. `settings.js`, `public-data.js`, `i18n.js` (6 languages).
- `sw.js` - service worker (offline app shell). Bump `CACHE_NAME` whenever shipped files change.
- `manifest.webmanifest`, `voices.json`, `test-sentences.json` - public metadata (no secrets).
- `tests/` - unit tests and Playwright specs. Styles and the icon live in `/design` and are merged into `dist/` by `scripts/build.js`.
