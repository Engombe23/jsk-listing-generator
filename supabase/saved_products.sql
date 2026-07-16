-- ============================================================================
-- saved_products — per-user saved products from the price calculator
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Same pattern as profiles.sql: no migration runner wired into this repo,
-- so this file is the source of truth to paste in manually.
-- ============================================================================

create table if not exists public.saved_products (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  name            text        not null default 'Unnamed Product',
  item_cost       double precision not null default 0,
  shipping_cost   double precision not null default 0,
  selling_price   double precision not null default 0,
  fvf_pct         double precision not null default 0,
  fixed_fee       double precision not null default 0,
  promo_pct       double precision not null default 0,
  vat_registered  boolean     not null default false,
  profit          double precision not null default 0,
  margin          double precision not null default 0,
  markup          double precision not null default 0,
  ebay_fvf        double precision not null default 0,
  ebay_promo      double precision not null default 0,
  vat_amount      double precision not null default 0,
  saved_at        timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_saved_products_user_saved_at
  on public.saved_products (user_id, saved_at desc);

alter table public.saved_products enable row level security;

drop policy if exists "Users can select own saved products" on public.saved_products;
create policy "Users can select own saved products"
  on public.saved_products for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved products" on public.saved_products;
create policy "Users can insert own saved products"
  on public.saved_products for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved products" on public.saved_products;
create policy "Users can update own saved products"
  on public.saved_products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved products" on public.saved_products;
create policy "Users can delete own saved products"
  on public.saved_products for delete
  using (auth.uid() = user_id);
