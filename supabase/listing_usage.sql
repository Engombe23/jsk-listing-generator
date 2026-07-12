-- ============================================================================
-- listing_usage — adds usage tracking on top of the existing `profiles`
-- table (see profiles.sql, which already has plan + Stripe fields).
--
-- Run this once in the Supabase SQL editor, after profiles.sql.
-- ============================================================================

alter table public.profiles
  add column if not exists listings_used integer not null default 0;

-- Atomic increment — avoids a read-then-write race if two requests from the
-- same user land at nearly the same time.
create or replace function public.increment_listings_used(user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles
  set listings_used = listings_used + 1,
      updated_at = now()
  where id = user_id;
end;
$$;
