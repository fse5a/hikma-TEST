create table if not exists public.api_rate_events (
  event_id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  ip_hash text not null,
  metric text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_rate_events_ip_metric_time on public.api_rate_events(ip_hash, metric, created_at desc);
create index if not exists idx_api_rate_events_user_metric_time on public.api_rate_events(user_id, metric, created_at desc);

alter table public.api_rate_events enable row level security;
revoke all on public.api_rate_events from anon, authenticated;
grant select, insert, delete on public.api_rate_events to service_role;
grant usage, select on sequence public.api_rate_events_event_id_seq to service_role;

create or replace function public.consume_api_quota(
  p_user_id uuid,
  p_ip_hash text,
  p_metric text,
  p_ip_per_minute integer default 30,
  p_user_per_minute integer default 20,
  p_user_per_hour integer default 300,
  p_user_per_day integer default 200,
  p_user_per_month integer default 2000
)
returns table (allowed boolean, reason text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  ip_count integer;
  user_minute_count integer;
  user_hour_count integer;
  user_day_count integer;
  user_month_count integer;
  ip_lock bigint;
  user_lock bigint;
begin
  if p_ip_hash is null or length(p_ip_hash) <> 64 or p_metric is null then
    return query select false, 'invalid_quota_subject';
    return;
  end if;

  ip_lock := hashtextextended(p_ip_hash || ':' || p_metric, 0);
  perform pg_advisory_xact_lock(ip_lock);
  if p_user_id is not null then
    user_lock := hashtextextended(p_user_id::text || ':' || p_metric, 0);
    perform pg_advisory_xact_lock(user_lock);
  end if;

  select count(*)::integer into ip_count
    from public.api_rate_events
    where ip_hash = p_ip_hash and metric = p_metric and created_at > now() - interval '1 minute';
  if ip_count >= greatest(p_ip_per_minute, 1) then
    return query select false, 'ip_rate_limit';
    return;
  end if;

  if p_user_id is not null then
    select count(*)::integer into user_minute_count
      from public.api_rate_events
      where user_id = p_user_id and metric = p_metric and created_at > now() - interval '1 minute';
    if user_minute_count >= greatest(p_user_per_minute, 1) then
      return query select false, 'user_rate_limit';
      return;
    end if;

    select count(*)::integer into user_hour_count
      from public.api_rate_events
      where user_id = p_user_id and metric = p_metric and created_at > now() - interval '1 hour';
    if user_hour_count >= greatest(p_user_per_hour, 1) then
      return query select false, 'user_hour_limit';
      return;
    end if;

    select count(*)::integer into user_day_count
      from public.api_rate_events
      where user_id = p_user_id and metric = p_metric and created_at > date_trunc('day', now());
    if user_day_count >= greatest(p_user_per_day, 1) then
      return query select false, 'daily_quota';
      return;
    end if;

    select count(*)::integer into user_month_count
      from public.api_rate_events
      where user_id = p_user_id and metric = p_metric and created_at > date_trunc('month', now());
    if user_month_count >= greatest(p_user_per_month, 1) then
      return query select false, 'monthly_quota';
      return;
    end if;
  end if;

  insert into public.api_rate_events(user_id, ip_hash, metric) values (p_user_id, p_ip_hash, p_metric);
  delete from public.api_rate_events where created_at < now() - interval '35 days';
  return query select true, null::text;
end;
$function$;

revoke all on function public.consume_api_quota(uuid, text, text, integer, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_quota(uuid, text, text, integer, integer, integer, integer, integer) to service_role;
