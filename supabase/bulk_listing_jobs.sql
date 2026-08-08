-- Bulk listing generation: job header + per-item status tracking.
-- Run once in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).

create table if not exists public.bulk_listing_jobs (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  status              text        not null default 'pending',
  total_items         integer     not null default 0,
  completed_count     integer     not null default 0,
  failed_count        integer     not null default 0,
  needs_review_count  integer     not null default 0,
  not_found_count     integer     not null default 0,
  options             jsonb       not null default '{}',
  created_at          timestamptz not null default now(),
  started_at          timestamptz,
  completed_at        timestamptz
);

create index if not exists idx_bulk_jobs_user
  on public.bulk_listing_jobs (user_id, created_at desc);

create table if not exists public.bulk_listing_items (
  id                      uuid        primary key default gen_random_uuid(),
  job_id                  uuid        not null references public.bulk_listing_jobs(id) on delete cascade,
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  row_index               integer     not null,
  input_number            text        not null,
  sku                     text        not null default '',
  bin_price               text        not null default '',
  status                  text        not null default 'queued',
  resolved_article_number text,
  resolved_supplier       text,
  product_name            text,
  error_message           text,
  candidates              jsonb,
  listing_id              uuid        references public.saved_listings(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_bulk_items_job
  on public.bulk_listing_items (job_id, row_index);

create index if not exists idx_bulk_items_user
  on public.bulk_listing_items (user_id);

-- RLS

alter table public.bulk_listing_jobs enable row level security;

drop policy if exists "Users own bulk jobs" on public.bulk_listing_jobs;
create policy "Users own bulk jobs"
  on public.bulk_listing_jobs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.bulk_listing_items enable row level security;

drop policy if exists "Users own bulk items" on public.bulk_listing_items;
create policy "Users own bulk items"
  on public.bulk_listing_items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
