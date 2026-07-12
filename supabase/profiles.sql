-- ============================================================================
-- profiles — per-user plan, listing limit, and usage tracking
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Same pattern as usage_events.sql: no migration runner wired into this repo,
-- so this file is the source of truth to paste in manually.
-- ============================================================================

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  plan          text not null default 'free',
  listing_limit integer not null default 10,   -- -1 means unlimited (Scale plan)
  listings_used integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_profiles_plan on profiles (plan);

-- ── Auto-create a default Free profile for every new signup ────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, plan, listing_limit, listings_used)
  values (new.id, new.email, 'free', 10, 0)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Backfill profiles for any existing users who signed up before this ─────
insert into public.profiles (id, email, plan, listing_limit, listings_used)
select id, email, 'free', 10, 0 from auth.users
on conflict (id) do nothing;

-- ── Atomic usage increment — avoids a read-then-write race if two requests
--    from the same user land at nearly the same time.
create or replace function public.increment_listings_used(user_id uuid)
returns void as $$
begin
  update public.profiles
  set listings_used = listings_used + 1,
      updated_at = now()
  where id = user_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── RLS: users can read their own profile; all writes go through the
--    backend's service-role key (checkAndConsumeListingCredit etc), never
--    directly from the browser — so there is no update/insert policy here.
alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);
