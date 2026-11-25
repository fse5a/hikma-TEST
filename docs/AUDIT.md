# Audit, 25 Nov 2026

Scope: whole repo and live site (https://hekma-pearl.vercel.app). Checked: code read-through, `npm test` (53/53 pass), `npm audit` (0 vulnerabilities), live headers, live `/api/health`, mobile layout in all skins and themes.

## Fixed in this pass
1. **Mobile header overlap** (bot and cat skins): scan label wrapped on top of the theme toggle. Fixed, icons are now SVG (emoji showed as empty boxes on devices without an emoji font).
2. **No security headers.** Docs said `vercel.json` set a CSP, but it set none. Added nosniff, frame deny, referrer policy, permissions policy (camera/mic only for this site) and a CSP.
3. **Repo layout** split into backend, frontend, database, iot, design, docs. Tests moved next to their section. CI workflow added (template in `docs/ci-template/ci.yml`; the current GitHub token lacks workflow scope, so copy it to `.github/workflows/` from the GitHub web UI). `.env.example` added.

## Fixed in the follow-up pass
- OCR (tesseract.js 5.1.1) is now self-hosted in `frontend/vendor/tesseract/` (about 20 MB, loaded only when the user scans). No third-party requests; verified OCR works offline under the CSP.
- Google Fonts replaced by self-hosted Cairo and Tajawal (`design/fonts/`, OFL licence).
- Inline script moved to `frontend/app.js`. CSP no longer allows inline scripts or any external origin. It keeps `style-src 'unsafe-inline'` (inline style attributes and runtime stylesheets).
- `restored-features.js` shrunk: skins/palettes moved to `skins.js`, runtime stylesheets to `features-styles.js`. The rest still shares one closure and is the next split candidate.

## Open findings, by priority
**High**
- **Fake onboarding gate.** The browser accepts `1234` / `admin` / `demo-1234` (`frontend/restored-features.js`, search `'1234'`). Anyone can read it. Fine for a demo, not for private data or a kids product. Needs real activation through the server (`/api/activate`) once Supabase is configured.
- **Supabase not configured in production** (`/api/health`: supabase, auth, quotas, private audio storage all "missing"; database "demo-mode"). Quotas and auth do not protect anything yet. Migrations 003-005 never applied to a live project. Setting up Supabase is free-tier, but needs the user's decision and keys.
- **Seed contains a demo activation code** (`database/migrations/002_seed.sql`, `DEMO-1234`). Remove before real users.
- **Children's data / legal.** Kids mode exists with no parent PIN, no account deletion, no privacy policy. Collecting data from children triggers COPPA/GDPR-K style duties. Needs a decision from the owner before launch.

**Medium**
- **`restored-features.js` is still ~100 KB in one closure.** Split further into modules (settings, onboarding, dashboard, reader) with tests.
- **CSP keeps `style-src 'unsafe-inline'`.** Low risk, removing it needs all inline styles moved to classes.
- **`Access-Control-Allow-Origin: *`** on static files (Vercel default). Harmless for static assets; API CORS allow-list is listed as unimplemented in `docs/SECURITY.md`.
- **Free-tier keep-alive missing**: Supabase free projects pause after inactivity.
- `.git` history: confirm no tokens were ever committed (a quick scan of the current tree found none).

**Low**
- Emoji still used in skin chip, nav bar, welcome text. Fine on phones, may show boxes on old Linux/desktop browsers.
- Accessibility: automated checks only (axe via Playwright). No real TalkBack/VoiceOver test yet.
- `npm run test:e2e` is not run in CI (needs browsers). Add when budget allows (free).

## Not done on purpose
Anything that costs money (paid Supabase/Vercel plans, paid TTS/AI providers, domain) or has legal impact (child-data policy, voice-cloning consent, XTTS license). These need the owner's decision.


## Follow-up, 25 Nov (evening)
- **Activation is now checked on the server** (`/api/activate` calls `redeem_activation_code` in Supabase with a hash). The browser has no code in it. The demo code only works while the server is in demo mode, and `/api/health` no longer shows it. Migration `006` deletes the `DEMO-1234` seed row and removes it from `002_seed`. Needs Supabase to be configured to take effect (see SETUP).
- **Parent PIN for kids mode** (4-6 digits, stored as a salted hash on the device). It locks Settings, which covers age change, reset and backup restore. It is a local lock, so it stops a child but not someone who clears browser data or edits storage.
- **Privacy policy and terms pages** (`/privacy.html`, `/terms.html`) in Arabic and English, clearly marked draft, not legal advice. Open points are listed at the bottom of each page.
- **Pen simulator** in `iot/simulator/` with a protocol doc in Arabic (`iot/PROTOCOL.md`).
- favicon 404 fixed.
