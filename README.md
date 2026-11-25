# Hikma (حِكمة) reading app

A reading library for children and adults (Arabic first, 6 UI languages). Static frontend plus Vercel Functions, Supabase for data. Live: https://hekma-pearl.vercel.app

## Repository map (one folder per concern)

| Folder | What is inside | Who reviews it |
| --- | --- | --- |
| [`backend/`](backend/README.md) | API logic: request handlers, auth, quotas, speech/translation providers, URL import. Tests included. | Backend developer |
| [`frontend/`](frontend/README.md) | Pages, scripts, PWA service worker, i18n, scanner, PDF import. Tests included. | Frontend developer |
| [`database/`](database/README.md) | Supabase SQL migrations, seed, row-level security. Tests included. | Database / security reviewer |
| [`iot/`](iot/README.md) | Smart pen / device part (reserved, no firmware yet). | Hardware developer |
| [`design/`](design/README.md) | Stylesheet, icon, skins and palettes (owl, cat, robot; light and dark). | Designer |
| [`docs/`](docs/) | Security notes, setup, assumptions, licenses, accessibility testing, [audit](docs/AUDIT.md). | Everyone |
| `api/` | Vercel requires functions here. One-line files that re-export `backend/handlers/*`. No logic. | Nobody (do not edit) |
| `scripts/` | `build.js` (frontend + design into `dist/`), `dev-server.js`. | |

## Commands

```bash
npm test        # backend + database + frontend unit tests
npm run lint    # syntax check of every source file
npm run build   # creates dist/ (what Vercel serves)
npm run dev     # static preview at http://localhost:4173
npm run test:e2e   # Playwright layout and accessibility checks
```

Secrets never go in this repo. Copy `.env.example` to `.env.local` locally; production values live in Vercel Project Settings.
