# Security

## Current protections

- Vercel responses use the headers and Content Security Policy in [vercel.json](vercel.json). The policy allows inline scripts and styles because the current single-page frontend contains inline code; it is not a strict nonce-based CSP.
- API handlers validate required fields and HTTP methods and return JSON errors with request IDs.
- The browser bundle contains no provider or service-role secrets. Public JSON files contain metadata only.
- CI runs `npm audit --audit-level=moderate`.
- Story data and human recordings are stored in browser local storage and IndexedDB. The current app does not upload these files.

## Important limitations

- There is no parent PIN, account authentication, or server-enforced child lock. Age and accessibility choices are local preferences, not access controls.
- Anonymous session creation and optional email upgrade use Supabase Auth. Worker, URL preview, and job routes verify bearer tokens when Supabase is configured; explicit no-provider demo mode remains local.
- Strict CORS allow-listing, activation-code lookup, library sync, account deletion, and storage cleanup are not implemented. Configured provider requests require verified Supabase tokens and use the quota RPC; speech chunks are also written to private Storage when configured. Do not treat static migration tests as proof of live RLS enforcement.
- Translation, diacritization, and speech use optional HTTPS workers; no provider is bundled or configured by default. URL import uses pinned public-IP fetches, redirect checks, robots checks, response bounds, and Readability extraction, but has only synthetic fixture coverage.
- Generated speech is stored in browser IndexedDB and, when configured, private Supabase Storage under the verified user ID. Account-level deletion is not implemented.
- PDF text parsing runs locally in a PDF.js worker and does not upload the original file. Scanned-page OCR is not currently bundled.
- The CSP includes `unsafe-inline`; deployment headers should be reviewed before exposing sensitive or authenticated features.

## Before production use

Complete strict CORS, activation-code lookup, data deletion, and live Supabase policy validation. Review provider free-tier terms, monthly costs, Vercel headers, and the CSP independently before deployment. Never put secrets in frontend code or public data files.