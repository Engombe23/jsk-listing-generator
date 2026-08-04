-- ============================================================================
-- saved_listings — per-user saved / generated listings from the listing generator
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Same pattern as profiles.sql: no migration runner wired into this repo,
-- so this file is the source of truth to paste in manually.
-- ============================================================================

create table if not exists public.saved_listings (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,
  status               text        not null default 'Draft',
  title                text        not null default '',
  article_number       text        not null default '',
  description_html     text        not null default '',
  item_specifics       jsonb       not null default '[]'::jsonb,
  specifications       jsonb       not null default '[]'::jsonb,
  oem_numbers          jsonb       not null default '[]'::jsonb,
  k_number_list        jsonb       not null default '[]'::jsonb,
  engine_codes         jsonb       not null default '[]'::jsonb,
  custom_specifics     jsonb,
  compatibility_count  integer     not null default 0,
  product_type         text        not null default '',
  sku                  text        not null default '',
  bin_price            text        not null default '',
  article_image        text        not null default '',
  saved_at             timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_saved_listings_user_saved_at
  on public.saved_listings (user_id, saved_at desc);

create index if not exists idx_saved_listings_user_article
  on public.saved_listings (user_id, article_number);

alter table public.saved_listings enable row level security;

drop policy if exists "Users can select own saved listings" on public.saved_listings;
create policy "Users can select own saved listings"
  on public.saved_listings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved listings" on public.saved_listings;
create policy "Users can insert own saved listings"
  on public.saved_listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved listings" on public.saved_listings;
create policy "Users can update own saved listings"
  on public.saved_listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved listings" on public.saved_listings;
create policy "Users can delete own saved listings"
  on public.saved_listings for delete
  using (auth.uid() = user_id);
