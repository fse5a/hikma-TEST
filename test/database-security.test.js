import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migrationUrl = new URL('../db/migrations/003_rls_policies.sql', import.meta.url);

test('database migration has owner policies and protects parent-owned rows', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  const policyTables = [
    'profiles', 'skins', 'voices', 'library_items', 'chapters', 'translations',
    'audio_cache', 'reading_progress', 'pronunciation_entries', 'jobs',
    'usage_quota', 'audit_log'
  ];

  for (const table of policyTables) {
    assert.match(sql, new RegExp(`create policy [a-z_]+ on public\\.${table}\\b`, 'i'), `${table} policy`);
  }
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /exists \(select 1 from public\.library_items/i);
  assert.doesNotMatch(sql, /create policy [a-z_]+ on public\.activation_codes/i);
});

test('ownership migration adds user foreign keys and a private audio bucket', async () => {
  const sql = await readFile(new URL('../db/migrations/004_user_ownership_storage.sql', import.meta.url), 'utf8');
  for (const table of ['library_items', 'audio_cache', 'reading_progress', 'pronunciation_entries', 'jobs', 'usage_quota']) {
    assert.match(sql, new RegExp(`${table} add constraint ${table}_user_auth_fk foreign key \\(user_id\\) references auth\\.users`, 'i'));
  }
  assert.match(sql, /values \('hikma-private-audio', 'hikma-private-audio', false/i);
  assert.match(sql, /split_part\(name, '\/', 1\) = auth\.uid\(\)::text/i);
});

test('quota migration restricts event access and RPC execution to service role', async () => {
  const sql = await readFile(new URL('../db/migrations/005_api_quotas.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.api_rate_events/i);
  assert.match(sql, /alter table public\.api_rate_events enable row level security/i);
  assert.match(sql, /revoke all on function public\.consume_api_quota[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.consume_api_quota[\s\S]+to service_role/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /if p_user_id is not null then/i);
});
