# Setup guide

Hikma is deployed on Vercel as a static frontend with Vercel Functions in `/api` and a Supabase project for auth, storage, and private data. The app must run in demo mode without any keys, and the real integrations are optional upgrades.

## 1. Create the Vercel project

1. Push this repo to GitHub.
2. Open Vercel and import the repository as a new project.
3. Use the same project and same domain for every environment.
4. Set the Root Directory to the repository root, use the **Other** framework preset, and leave the Build Command and Output Directory unset. The root `index.html` is served as the static home page, and Vercel automatically discovers functions in the root `api/` directory.
5. Do not set a custom Development Command for this project; `vercel.json` disables one so `vercel dev` can serve static files and API functions itself.

## 2. Add the environment variables

For `npx vercel dev`, create `.env.local` in the repository root and add the variables you need. Create the same integration keys in Vercel Project Settings > Environment Variables.

Required for a local demo:

- `APP_MODE=demo`

Optional for the server-side demo activation endpoint (defaults to `1234`):

- `DEMO_ACTIVATION_CODE=1234`

The browser onboarding gate is a frontend-only demo shortcut (`1234` or `admin`) and works with static servers such as `npx serve`. It does not protect content; do not use it for private data.

Vercel CLI sets `VERCEL_ENV=development` during local development; it does not need to be added to `.env.local`.

Required for real Supabase integration:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The app's server routes use `SUPABASE_URL` and `SUPABASE_ANON_KEY` for anonymous sessions and bearer-token verification. `SUPABASE_SERVICE_ROLE_KEY` must stay server-only; it is used for the quota RPC and private audio writes.

Optional providers:

- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL`
- `TRANSLATION_PROVIDER`
- `TRANSLATION_API_KEY`
- `TRANSLATION_MODEL`
- `TRANSLATION_WORKER_URL` (HTTPS endpoint accepting `{text, targetLanguage, instruction}` and returning `{translatedText}`)
- `SPEECH_PROVIDER`
- `SPEECH_API_KEY`
- `SPEECH_WORKER_URL` (HTTPS endpoint accepting a short JSON request and returning `{ "audioBase64": "...", "contentType": "audio/mpeg" }`)
- `DIACRITIZATION_WORKER_URL` (HTTPS endpoint returning `{ "text": "..." }`; output is rejected if letters differ)
- `DIACRITIZATION_API_KEY`
- `UPSTREAM_TIMEOUT_MS` (defaults to 8000)
- `RENDER_WORKER_URL`
- `OCR_WORKER_URL`
- `PDF_WORKER_URL`

Rate limiting and quotas:

- `RATE_LIMIT_REQUESTS_PER_MINUTE`
- `RATE_LIMIT_REQUESTS_PER_HOUR`
- `DAILY_QUOTA_FREE`
- `MONTHLY_QUOTA_FREE`
- `URL_IMPORT_TIMEOUT_MS`
- `URL_IMPORT_MAX_BYTES`
- `URL_IMPORT_MAX_REDIRECTS`

Do not expose service-role or secret provider keys in browser code. The frontend only receives anonymous/public values.

## 3. Create the Supabase project

1. Create a Supabase project and copy its URL, anon key, and service-role key from Project Settings > API.
2. In Authentication > Providers, enable Anonymous Sign-Ins and Email; configure email confirmation.
3. Open SQL Editor and run migrations `001_init.sql` through `005_api_quotas.sql` in numeric order; `002_seed.sql` inserts demo/public metadata.
4. Migration 004 creates the private `hikma-private-audio` bucket and per-user object path policies. Migration 005 creates atomic per-IP/per-user-minute and per-user-daily quota checks. Do not make the bucket public.
5. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Project Settings > Environment Variables for the same project/domain, then redeploy.
6. Set `IP_RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_REQUESTS_PER_MINUTE`, and `DAILY_QUOTA_FREE` below intended free-tier limits.
7. Open `/api/health`; check auth/provider status and language recommendation, which never displays key values.

Anonymous sign-in and email upgrade are implemented. Library synchronization, account deletion, and real activation-code lookup are not implemented yet. Production activation intentionally rejects the demo code. Configured provider calls fail closed if auth, quota RPC, or required credentials are unavailable.

## 4. Local run

Install dependencies with `npm install`, then start a local static preview:

```bash
npm run dev
```

Open http://localhost:4173. The preview serves the app and vendored PDF.js assets but does not execute `/api` routes. For both the static files and API functions, run this from the repository root in Codespaces:

```bash
npm run dev:vercel
```

Open or forward port `3000` in Codespaces. Enter `1234` at the demo activation screen. `npm run dev` is only a static preview on port `4173`; it does not run the `/api` functions. `dev:vercel` sets `APP_MODE=demo` for this local command only; the deployed app remains fail-closed unless explicitly configured. Vercel supplies `VERCEL_ENV` during local development, and no provider or Supabase keys are required for the demo.

For optional workers, add worker URLs and keys in Vercel Project Settings > Environment Variables, then redeploy. Use only free/self-hosted services. `/api/health` reports configuration without returning URLs or keys. Speech chunks are cached in browser IndexedDB (50 MB cap) and private Storage, keyed by user/provider/voice/text/language/rate/pitch when storage is configured.

## 4b. Built-in providers (no separate worker needed)

Two providers are built into the functions; configure either one instead of hosting a worker:

- Neural speech: set `SPEECH_PROVIDER=google` and `GOOGLE_TTS_API_KEY` (Google Cloud Text-to-Speech API key). Arabic defaults to the WaveNet voice `ar-XA-Wavenet-B` (Google has no Arabic Neural2 voice); each language maps to a natural voice and explicit voice names are accepted only for the requested language. Speech still requires Supabase auth and quota when configured, and generated audio is cached as before.
- Contextual translation: set `OPENAI_API_KEY` (any OpenAI-compatible chat API; optional `OPENAI_BASE_URL`, default `https://api.openai.com/v1`, and `OPENAI_MODEL`, default `gpt-4o-mini`), or use a free Google AI Studio key: set `GEMINI_API_KEY` (optional `GEMINI_MODEL`, default `gemini-2.5-flash-lite`). Translation is instructed to be natural and contextual rather than literal, with a child-appropriate tone. `TRANSLATION_WORKER_URL` takes precedence when both are set.
- Free neural speech via AI Studio: set `SPEECH_PROVIDER=gemini` with the same `GEMINI_API_KEY` (optional `GEMINI_TTS_MODEL`, default `gemini-2.5-flash-preview-tts`, and `GEMINI_TTS_VOICE`, default `Kore`; voices are multilingual and Arabic is supported). The free tier caps TTS at a small number of calls per day, so the device voice stays the default and the app falls back to it when the cap is reached.

- Edge neural voices (no key, no signup): on Vercel, when no other speech provider is configured, the app automatically uses Microsoft Edge's read-aloud neural voices. Arabic defaults to the Egyptian voice `ar-EG-SalmaNeural` (male alternative: `ar-EG-ShakirNeural`); other languages map to their own neural voices. This needs no API key and works without Supabase (no login, quota, or server cache in that case; the browser's per-story IndexedDB cache still avoids repeat calls). Control it with `EDGE_TTS=on`/`EDGE_TTS=off`, or force it with `SPEECH_PROVIDER=edge`. IMPORTANT: this is an unofficial, undocumented endpoint intended for DEMO AND TESTING ONLY. Before any commercial sale or public launch, swap it for an official provider (Azure Speech F0 free tier, 500K neural chars/month, or Google Cloud TTS WaveNet free tier, 4M chars/month) by setting the variables above; the code path is already in place.

When none of these is configured the app keeps working in demo mode with the device voice and manual translation.

## 4c. Book and QR scanner

The camera scanner starts only from an explicit tap. QR codes open a saved story or import a linked page through `/api/import/url`. Page capture runs OCR in the browser (Tesseract.js loaded from a CDN on first use) and routes the text into the add-story form for review; photos never leave the device. Browsers without `BarcodeDetector` or camera access show a fallback message.

## 5. Health route

Check whether the deployment is configured by opening:

- `/api/health`

This route shows enabled integrations and missing services without returning secret values.
It may include a supported `recommendedLanguage` derived from `x-vercel-ip-country` or `Accept-Language`. The browser uses it only while the user's locale preference is still automatic.

The interface currently ships Arabic, English, French, German, Spanish, and Chinese labels and bundled-story text. Additional locales require dictionary entries and bundled story translations; a configured free worker may translate user-added stories.

## 6. Activation

The app includes demo activation only when `APP_MODE=demo` or `DEMO_MODE=true`. Production activation is not implemented and fails closed; merely creating the activation table does not enable it.

## 7. Worker setup and limits

Optional speech, translation, and diacritization workers must be HTTPS endpoints you control or have verified as free. Configure their URL and any key in Vercel Project Settings > Environment Variables, then redeploy. The expected request/response formats are:

- Speech: `{text, language, voice, rate, pitch}` returns `{audioBase64, contentType}`.
- Translation: `{text, targetLanguage, instruction}` returns `{translatedText}`.
- Diacritization: `{text, instruction}` returns `{text}` with original letters unchanged; the API validates this.
- All upstream requests use `UPSTREAM_TIMEOUT_MS` (default 8000 ms).

`/api/health` reports only whether each worker is configured. Configured calls use per-IP per-minute and per-user minute/hour/day/month limits. Monthly usage alerts are not implemented; do not point workers at paid or uncapped services.

## 8. URL import

URL previews require Supabase Auth, migration 005, and the server-only service-role key. The function accepts HTTP/HTTPS on ports 80/443, resolves and pins public IPs, blocks private/reserved ranges on each redirect, checks `robots.txt`, uses a 10-second timeout by default, and limits responses to 5 MB and three redirects. It uses Readability and embedded article JSON; JS-rendered pages use the Send to Hikma bookmarklet/paste fallback. The imported story is editable before saving locally. Add only text you are allowed to read; it stays private to the local library.

## 9. PDF text import

Text-layer PDFs are parsed in the browser by the vendored PDF.js worker. Files are limited to 50 MB and 1000 pages and are never sent to a server; parsing reports page progress and uses the document outline when present. Scanned pages are detected, but OCR is not bundled yet; the app reports this and does not silently claim those pages were extracted.

## 10. Free-tier guardrails

- Vercel Hobby is used for hosting and function execution.
- Supabase Free is used for a low-volume personal project.
- Provider quotas are enforced when Supabase is configured; budget alerts and scheduled project keep-alive are not implemented.
- Audio, PDFs, and imported content stay private to the user and are not mixed into shared public caches.
