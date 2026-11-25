-- مسؤول عن: تفعيل حقيقي بالكود على السيرفر (الهاش بس مخزّن) وحذف كود التجربة DEMO-1234
alter table public.activation_codes alter column code drop not null;
alter table public.activation_codes add column if not exists code_hash text unique;
alter table public.activation_codes add column if not exists use_count integer not null default 0;
alter table public.activation_codes add column if not exists max_uses integer not null default 1;
alter table public.activation_codes add column if not exists expires_at timestamptz;

-- كود التجربة القديم لازم يتحذف
delete from public.activation_codes where code = 'DEMO-1234';

revoke all on public.activation_codes from anon, authenticated;

-- بيستهلك استخدام واحد من الكود لو صالح (ذرّي، عشان محدش يستخدمه مرتين)
create or replace function public.redeem_activation_code(p_code_hash text)
returns table (redeemed boolean, expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  hit public.activation_codes%rowtype;
begin
  update public.activation_codes
     set use_count = use_count + 1, used_at = coalesce(used_at, now())
   where code_hash = p_code_hash
     and use_count < max_uses
     and (activation_codes.expires_at is null or activation_codes.expires_at > now())
  returning * into hit;
  if hit.id is null then
    return query select false, null::timestamptz;
  else
    return query select true, hit.expires_at;
  end if;
end;
$function$;

revoke all on function public.redeem_activation_code(text) from public, anon, authenticated;
grant execute on function public.redeem_activation_code(text) to service_role;
