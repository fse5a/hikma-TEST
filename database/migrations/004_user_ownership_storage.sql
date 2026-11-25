do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'voices_user_auth_fk') then
    alter table public.voices add constraint voices_user_auth_fk foreign key (user_id) references auth.users(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'library_items_user_auth_fk') then
    alter table public.library_items add constraint library_items_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audio_cache_user_auth_fk') then
    alter table public.audio_cache add constraint audio_cache_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reading_progress_user_auth_fk') then
    alter table public.reading_progress add constraint reading_progress_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pronunciation_entries_user_auth_fk') then
    alter table public.pronunciation_entries add constraint pronunciation_entries_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobs_user_auth_fk') then
    alter table public.jobs add constraint jobs_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'usage_quota_user_auth_fk') then
    alter table public.usage_quota add constraint usage_quota_user_auth_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audit_log_user_auth_fk') then
    alter table public.audit_log add constraint audit_log_user_auth_fk foreign key (user_id) references auth.users(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'skins_created_by_auth_fk') then
    alter table public.skins add constraint skins_created_by_auth_fk foreign key (created_by) references auth.users(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activation_codes_created_by_auth_fk') then
    alter table public.activation_codes add constraint activation_codes_created_by_auth_fk foreign key (created_by) references auth.users(id) on delete set null not valid;
  end if;
end $$;

create unique index if not exists idx_translations_unique_language on public.translations(library_item_id, source_language, target_language);
create unique index if not exists idx_pronunciation_entries_unique on public.pronunciation_entries(user_id, language, key_text);
create unique index if not exists idx_audio_cache_unique_storage_key on public.audio_cache(user_id, storage_key);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hikma-private-audio', 'hikma-private-audio', false, 52428800, array['audio/mpeg','audio/ogg','audio/wav','audio/webm','audio/mp4'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists hikma_audio_select_own on storage.objects;
create policy hikma_audio_select_own on storage.objects for select to authenticated
  using (bucket_id = 'hikma-private-audio' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists hikma_audio_insert_own on storage.objects;
create policy hikma_audio_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'hikma-private-audio' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists hikma_audio_update_own on storage.objects;
create policy hikma_audio_update_own on storage.objects for update to authenticated
  using (bucket_id = 'hikma-private-audio' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'hikma-private-audio' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists hikma_audio_delete_own on storage.objects;
create policy hikma_audio_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'hikma-private-audio' and split_part(name, '/', 1) = auth.uid()::text);
