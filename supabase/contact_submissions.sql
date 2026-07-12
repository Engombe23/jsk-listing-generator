-- ============================================================================
-- contact_submissions — stores messages from the /contact page.
--
-- Run this once in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.contact_submissions (
  id              uuid        primary key default gen_random_uuid(),
  reference       text        not null unique,
  name            text        not null,
  email           text        not null,
  subject         text        not null,
  message         text        not null,
  user_id         uuid        references auth.users(id) on delete set null,
  has_attachment  boolean     not null default false,
  status          text        not null default 'open'
                              check (status in ('open', 'in_progress', 'resolved')),
  created_at      timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- Only the service-role key (backend) may insert or read submissions.
-- Disable row-level security for service-role; deny anon/authenticated.
alter table public.contact_submissions enable row level security;

create policy "service role only"
  on public.contact_submissions
  for all
  using (false)
  with check (false);
