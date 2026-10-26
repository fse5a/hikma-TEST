# Hikma Reading App

Hikma is a static Vercel app with Vercel Functions under `/api`. The interface supports Arabic, English, French, German, Spanish, and Chinese, detects the first-load locale, and keeps bundled-story translations local. Stories, settings, and user recordings stay in the browser. Optional worker adapters are not configured production services.

## What works locally

- The library, reader, manual translation editor, settings, progress, and backups use browser storage.
- Reading aloud uses the browser's Web Speech API. Recording/uploading a human voice uses browser media APIs and IndexedDB.
- The frontend calls `/api/health`, `/api/translate`, `/api/diacritize`, and `/api/speech` through [api-client.js](api-client.js). Demo fallback is allowed only when health explicitly reports demo mode.
- The local-only onboarding gate accepts `1234` or `admin` in the browser and does not call `/api/activate`. This is only a demo convenience, not authentication; anyone can inspect the code or change browser storage.

## API status

The health endpoint reports integrations and a non-secret language recommendation. Anonymous Supabase sessions and optional email upgrade are implemented when Auth is configured. Activation accepts the demo code only in demo mode; production activation fails closed. Bundled stories have local Arabic, English, French, German, Spanish, and Chinese text. Dynamic translation, speech, and diacritization support optional HTTPS workers; without them, translation stays manual, device speech is used, and original text is preserved. Generated audio is cached in IndexedDB and private Supabase Storage when configured. Provider calls use atomic per-IP and per-user minute/hour/day/month quotas. URL import uses DNS-pinned fetching, robots checks, Readability, and an embedded-JSON fallback. Text-layer PDFs are parsed locally in PDF.js without uploading the original file; scanned-page OCR, library sync, signed book QR, admin, custom licensed skins, parent PIN, account deletion, and monthly alerts remain unimplemented. Migrations `003`-`005` define policies, but have not been applied to a live Supabase project here.

Deploy the repository to Vercel to run its `/api` functions and apply [vercel.json](vercel.json) security headers. A plain static server only serves the frontend and cannot execute those functions. For a static preview, run:

```bash
npm run dev
```

Then open `http://localhost:4173`. Static preview does not make the API routes available; API errors are announced in Arabic and local reading/speech remain available. To run both static files and Vercel Functions locally in Codespaces, run `npm run dev:vercel` from the repository root and forward port `3000`. Enter `1234` at the demo activation screen.

## Installable app

The app includes [manifest.webmanifest](manifest.webmanifest) and [sw.js](sw.js). Serve it over HTTPS or localhost; browsers do not install PWAs from `file://` URLs. Offline support covers the cached app shell, not API responses or all dynamic content.

## Security and setup

See [SECURITY.md](SECURITY.md) for implemented protections and production gaps. Do not add provider secrets to frontend files. Vercel headers are configured in `vercel.json`; the CSP currently permits inline scripts/styles to support the existing page.

## Checks

```powershell
npm test
npm run lint
npm run test:e2e
```

The Playwright suite checks layout at 320, 360, 390, 412, 600, 768, 1024, 1280, and 1920 CSS pixels, plus 740x360 and 844x390 landscape viewports; it checks 200% text, touch targets, dialogs, and keyboard-resized fields. CI uploads viewport screenshots and runs axe-core on the principal views/settings matrix. Automated checks do not replace TalkBack, VoiceOver, or NVDA testing; see [ACCESSIBILITY-TESTING.md](ACCESSIBILITY-TESTING.md).