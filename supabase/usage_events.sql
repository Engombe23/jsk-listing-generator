-- ============================================================================
-- usage_events — internal product analytics table
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Not applied automatically: there is no Supabase CLI / migration runner wired
-- into this repo, so this file is the source of truth to paste in manually.
-- ============================================================================

create table if not exists usage_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  session_id    text,
  event_name    text not null,
  event_category text,
  plan          text,
  page_url      text,
  source        text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- Lookups the dashboard/queries need most: by event name + time, by user, by session.
create index if not exists idx_usage_events_event_name  on usage_events (event_name);
create index if not exists idx_usage_events_created_at   on usage_events (created_at);
create index if not exists idx_usage_events_user_id      on usage_events (user_id);
create index if not exists idx_usage_events_session_id   on usage_events (session_id);
create index if not exists idx_usage_events_category     on usage_events (event_category);
create index if not exists idx_usage_events_metadata     on usage_events using gin (metadata);

-- Row Level Security: events are written exclusively by the backend using the
-- service-role key (which bypasses RLS), never directly from the browser with
-- the anon/publishable key. So RLS stays enabled with no permissive policies —
-- this blocks any direct client-side read/write of raw event data.
alter table usage_events enable row level security;
