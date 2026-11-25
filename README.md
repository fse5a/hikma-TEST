# Hikma (حِكمة)

Reading app for kids and adults. Arabic first, 6 UI languages. Static frontend, Vercel Functions for the API, Supabase for data.

Live: https://hekma-pearl.vercel.app

## Folders

| Folder | What's in it |
| --- | --- |
| [`backend/`](backend/README.md) | API handlers, auth, quotas, speech/translation, URL import, tests |
| [`frontend/`](frontend/README.md) | pages, scripts, service worker, i18n, scanner, PDF import, tests |
| [`database/`](database/README.md) | Supabase SQL: tables, seed, row-level security |
| [`iot/`](iot/README.md) | smart pen, nothing here yet |
| [`design/`](design/README.md) | stylesheet, icon, fonts, skins |
| [`docs/`](docs/) | setup, security, assumptions, licenses, [audit](docs/AUDIT.md) |
| `api/` | one-line files Vercel needs, they just re-export `backend/handlers/*`. Don't edit. |
| `scripts/` | `build.js` makes `dist/`, `dev-server.js` for local preview |

## Commands

```bash
npm test          # unit tests (backend, database, frontend)
npm run lint      # syntax check
npm run build     # makes dist/ (what Vercel serves)
npm run dev       # preview on http://localhost:4173
npm run test:e2e  # Playwright layout + accessibility
```

No secrets in the repo. Copy `.env.example` to `.env.local`; real values live in Vercel settings.

بتدوّر على حاجة في الكود؟ بص في [docs/ابحث-عن.md](docs/ابحث-عن.md).
