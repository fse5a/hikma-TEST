# Audit, 25 Nov 2026

Scope: whole repo and live site (https://hekma-pearl.vercel.app). Checked: code read-through, `npm test` (53/53 pass), `npm audit` (0 vulnerabilities), live headers, live `/api/health`, mobile layout in all skins and themes.

## Fixed in this pass
1. **Mobile header overlap** (bot and cat skins): scan label wrapped on top of the theme toggle. Fixed, icons are now SVG (emoji showed as empty boxes on devices without an emoji font).
2. **No security headers.** Docs said `vercel.json` set a CSP, but it set none. Added nosniff, frame deny, referrer policy, permissions policy (camera/mic only for this site) and a CSP.
3. **Repo layout** split into backend, frontend, database, iot, design, docs. Tests moved next to their section. CI workflow added (template in `docs/ci-template/ci.yml`; the current GitHub token lacks workflow scope, so copy it to `.github/workflows/` from the GitHub web UI). `.env.example` added.

## Open findings, by priority
**High**
- **Fake onboarding gate.** The browser accepts `1234` / `admin` / `demo-1234` (`frontend/restored-features.js`, search `'1234'`). Anyone can read it. Fine for a demo, not for private data or a kids product. Needs real activation through the server (`/api/activate`) once Supabase is configured.
- **Supabase not configured in production** (`/api/health`: supabase, auth, quotas, private audio storage all "missing"; database "demo-mode"). Quotas and auth do not protect anything yet. Migrations 003-005 never applied to a live project. Setting up Supabase is free-tier, but needs the user's decision and keys.
- **Seed contains a demo activation code** (`database/migrations/002_seed.sql`, `DEMO-1234`). Remove before real users.
- **Children's data / legal.** Kids mode exists with no parent PIN, no account deletion, no privacy policy. Collecting data from children triggers COPPA/GDPR-K style duties. Needs a decision from the owner before launch.

**Medium**
- **OCR loads `tesseract.js` from cdn.jsdelivr.net at runtime** (`frontend/scanner.js`). Third-party script, no integrity hash, and the docs say OCR is "not bundled". Pin a version with SRI or vendor it.
- **CSP still allows `unsafe-inline`** because `index.html` has a large inline script. Move it to a file, then drop `unsafe-inline` and add nonces.
- **`restored-features.js` is 112 KB in one file** and `index.html` holds ~25 KB of inline JS. Hard to review and slow to parse. Split into modules (skins, settings, onboarding, dashboard).
- **`Access-Control-Allow-Origin: *`** on static files (Vercel default). Harmless for static assets; API CORS allow-list is listed as unimplemented in `docs/SECURITY.md`.
- **Free-tier keep-alive missing**: Supabase free projects pause after inactivity.
- `.git` history: confirm no tokens were ever committed (a quick scan of the current tree found none).

**Low**
- Emoji still used in skin chip, nav bar, welcome text. Fine on phones, may show boxes on old Linux/desktop browsers.
- Accessibility: automated checks only (axe via Playwright). No real TalkBack/VoiceOver test yet.
- `npm run test:e2e` is not run in CI (needs browsers). Add when budget allows (free).
- Fonts load from Google Fonts: privacy and offline cost. Self-host Cairo/Tajawal.

## Not done on purpose
Anything that costs money (paid Supabase/Vercel plans, paid TTS/AI providers, domain) or has legal impact (child-data policy, voice-cloning consent, XTTS license). These need the owner's decision.
