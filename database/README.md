# Database (Supabase / Postgres)

- `migrations/`: run in order, 001 to 006 (tables, seed, RLS policies, ownership + storage, quotas, server-side activation).
- `tests/`: only check that the policies exist in the files. They don't prove anything on a live database.

Migrations 003-005 haven't been applied to a real Supabase project yet. Run `006` to get rid of the old demo code and use `scripts/make-activation-code.mjs` for real codes. The service-role key stays on the server.
