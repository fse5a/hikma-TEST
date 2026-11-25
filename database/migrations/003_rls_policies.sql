do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_user_auth_fk') then
    alter table public.profiles add constraint profiles_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
end $$;

create index if not exists idx_translations_library_language on public.translations(library_item_id, target_language);
create index if not exists idx_reading_progress_user_updated on public.reading_progress(user_id, updated_at desc);
create index if not exists idx_voices_user_id on public.voices(user_id);
create index if not exists idx_audio_cache_user_hash on public.audio_cache(user_id, storage_key);
create index if not exists idx_pronunciation_entries_user_language on public.pronunciation_entries(user_id, language);
create index if not exists idx_jobs_user_status on public.jobs(user_id, status, updated_at);
create index if not exists idx_audit_log_user_created on public.audit_log(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.activation_codes enable row level security;
alter table public.skins enable row level security;
alter table public.voices enable row level security;
alter table public.library_items enable row level security;
alter table public.chapters enable row level security;
alter table public.translations enable row level security;
alter table public.audio_cache enable row level security;
alter table public.reading_progress enable row level security;
alter table public.pronunciation_entries enable row level security;
alter table public.jobs enable row level security;
alter table public.usage_quota enable row level security;
alter table public.audit_log enable row level security;

do $$
begin
  drop policy if exists profiles_own_rows on public.profiles;
  create policy profiles_own_rows on public.profiles for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists skins_public_read on public.skins;
  create policy skins_public_read on public.skins for select to anon, authenticated
    using (is_public = true or created_by = auth.uid());

  drop policy if exists voices_own_rows on public.voices;
  create policy voices_own_rows on public.voices for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists library_items_own_rows on public.library_items;
  create policy library_items_own_rows on public.library_items for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists chapters_owned_parent_rows on public.chapters;
  create policy chapters_owned_parent_rows on public.chapters for all to authenticated
    using (exists (select 1 from public.library_items li where li.id = library_item_id and li.user_id = auth.uid()))
    with check (exists (select 1 from public.library_items li where li.id = library_item_id and li.user_id = auth.uid()));

  drop policy if exists translations_owned_parent_rows on public.translations;
  create policy translations_owned_parent_rows on public.translations for all to authenticated
    using (exists (select 1 from public.library_items li where li.id = library_item_id and li.user_id = auth.uid()))
    with check (exists (select 1 from public.library_items li where li.id = library_item_id and li.user_id = auth.uid()));

  drop policy if exists audio_cache_own_rows on public.audio_cache;
  create policy audio_cache_own_rows on public.audio_cache for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists reading_progress_own_rows on public.reading_progress;
  create policy reading_progress_own_rows on public.reading_progress for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists pronunciation_entries_own_rows on public.pronunciation_entries;
  create policy pronunciation_entries_own_rows on public.pronunciation_entries for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists jobs_own_read on public.jobs;
  create policy jobs_own_read on public.jobs for select to authenticated
    using (user_id = auth.uid());

  drop policy if exists usage_quota_own_read on public.usage_quota;
  create policy usage_quota_own_read on public.usage_quota for select to authenticated
    using (user_id = auth.uid());

  drop policy if exists audit_log_own_read on public.audit_log;
  create policy audit_log_own_read on public.audit_log for select to authenticated
    using (user_id = auth.uid());
end $$;
