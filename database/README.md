# Database (Supabase / Postgres)

- `migrations/`: run in order, 001 to 005 (tables, seed, RLS policies, ownership + storage, quotas).
- `tests/`: only check that the policies exist in the files. They don't prove anything on a live database.

Migrations 003-005 haven't been applied to a real Supabase project yet. `002_seed` has a demo code (`DEMO-1234`), delete it before real users. The service-role key stays on the server.
