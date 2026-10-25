create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists skins (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  slug text not null,
  language text not null check (language in ('en', 'ar')),
  consent boolean not null default false,
  sample_path text,
  created_at timestamptz not null default now()
);

create table if not exists library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  library_item_id uuid not null references library_items(id) on delete cascade,
  title text,
  ordering integer not null default 0,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists translations (
  id uuid primary key default gen_random_uuid(),
  library_item_id uuid not null references library_items(id) on delete cascade,
  source_language text not null,
  target_language text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audio_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_key text not null,
  provider text not null,
  voice text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  library_item_id uuid not null references library_items(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete set null,
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, library_item_id)
);

create table if not exists pronunciation_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  key_text text not null,
  replacement_text text not null,
  language text not null check (language in ('en', 'ar')),
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  progress integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usage_quota (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  metric text not null,
  period_start timestamptz not null,
  counter integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, metric, period_start)
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_library_items_user_id on library_items(user_id);
create index if not exists idx_chapters_library_item_id on chapters(library_item_id);
create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_usage_quota_user_id on usage_quota(user_id);

alter table profiles enable row level security;
alter table activation_codes enable row level security;
alter table skins enable row level security;
alter table voices enable row level security;
alter table library_items enable row level security;
alter table chapters enable row level security;
alter table translations enable row level security;
alter table audio_cache enable row level security;
alter table reading_progress enable row level security;
alter table pronunciation_entries enable row level security;
alter table jobs enable row level security;
alter table usage_quota enable row level security;
alter table audit_log enable row level security;
