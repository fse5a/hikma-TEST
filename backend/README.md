# Backend

Server code only (Vercel Functions, Node ESM). Nothing here goes to the browser.

- `handlers/`: one file per endpoint (`health`, `activate`, `speech`, `translate`, `diacritize`, `auth/*`, `import/url`, `jobs/job`).
- `lib/`: shared stuff. `response.js` (JSON, errors, request ids), `supabase-auth.js` (token check), `quota.js` (rate limits), `url-extractor.js` (safe URL import), the speech and translation providers, `audio-cache.js`.
- `tests/`: run with `npm test`.

Vercel only picks up functions from the root `/api`, so each file there is a one-line re-export of a handler. New handler = new file here + its one-liner in `/api`.

Config is env vars only (`/.env.example`, `/docs/SETUP.md`).

For a reviewer, check these: input validation, auth on every provider route, quotas, SSRF protection in `url-extractor.js`, no secrets in logs.
