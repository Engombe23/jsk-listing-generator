-- ============================================================================
-- usage_period_reset — fixes a real bug: listings_used was a lifetime
-- counter, but plans are advertised as "N listings / month". Nothing ever
-- reset it.
--
-- The reset logic lives in ONE Postgres function so the backend (service
-- role, for limit checks) and the frontend (anon key, for the usage display
-- in Account.jsx) both see the same numbers — if each side reimplemented
-- "has a month passed?" separately in JS, they'd drift out of sync.
--
-- Run this once in the Supabase SQL editor, after profiles.sql and
-- listing_usage.sql.
-- ============================================================================

alter table public.profiles
  add column if not exists usage_period_start timestamptz not null default now();

create or replace function public.get_or_create_profile_with_reset(p_user_id uuid)
returns table (
  plan                   text,
  listings_used          integer,
  usage_period_start     timestamptz,
  stripe_customer_id     text,
  stripe_subscription_id text,
  subscription_status    text,
  billing_interval       text
)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  select * into v_row from public.profiles where id = p_user_id;

  if v_row.id is null then
    insert into public.profiles (id, plan, usage_period_start)
    values (p_user_id, 'free', now())
    returning * into v_row;
  elsif now() >= v_row.usage_period_start + interval '1 month' then
    update public.profiles
    set listings_used = 0,
        usage_period_start = now(),
        updated_at = now()
    where id = p_user_id
    returning * into v_row;
  end if;

  return query select
    v_row.plan, v_row.listings_used, v_row.usage_period_start,
    v_row.stripe_customer_id, v_row.stripe_subscription_id,
    v_row.subscription_status, v_row.billing_interval;
end;
$$;

-- Callable by the anon/authenticated role (frontend, RLS-bypassed via
-- security definer) and the service role (backend).
grant execute on function public.get_or_create_profile_with_reset(uuid) to authenticated, anon, service_role;
