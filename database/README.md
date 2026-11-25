# Database (Supabase / Postgres)

- `migrations/` - run in order: `001_init` (tables: profiles, activation_codes, skins, voices, library_items, chapters, translations, audio_cache, reading_progress, pronunciation_entries, jobs, usage_quota, audit_log), `002_seed`, `003_rls_policies`, `004_user_ownership_storage`, `005_api_quotas`.
- `tests/` - static checks that the policies exist. They are NOT proof of live enforcement.

Status: migrations 003-005 have not been applied to a live Supabase project yet. The service-role key is server-only. `002_seed` contains a demo activation code (`DEMO-1234`) that must be removed before real users.
