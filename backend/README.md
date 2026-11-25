# Backend

Everything that runs on the server (Vercel Functions, Node ESM). Nothing here ships to the browser.

- `handlers/` - one file per endpoint: `health`, `activate`, `speech`, `translate`, `diacritize`, `auth/anonymous|refresh|upgrade`, `import/url`, `jobs/job` (served as `/api/jobs/:id`).
- `lib/` - shared code: `response.js` (JSON, errors, request ids), `supabase-auth.js` (bearer verification), `quota.js` (per-IP/user rate limits through a Supabase RPC), `url-extractor.js` (DNS-pinned, robots-aware import), `speech-provider.js`, `gemini-provider.js`, `edge-provider.js`, `translation-provider.js`, `audio-cache.js` (private Storage).
- `tests/` - `npm test` runs them (fixtures in `tests/fixtures`).

Routing: Vercel only serves functions from the root `/api` folder, so `/api/*.js` files are one-line re-exports of `backend/handlers/*`. Add a handler here, then add its one-line re-export in `/api`.

Config comes from environment variables only (see `/.env.example`, `/docs/SETUP.md`). Review checklist: input validation, auth on every provider route, quota enforcement, SSRF protection in `url-extractor.js`, no secrets in logs.
