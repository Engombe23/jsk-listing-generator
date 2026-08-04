-- ============================================================================
-- signup_abuse_prevention — two mechanisms to slow down free-tier farming:
--
-- 1. Block known disposable/temp-mail domains at signup, enforced inside the
--    existing handle_new_user_profile trigger. Because it runs in the same
--    transaction as the auth.users insert, raising an exception here rolls
--    back the whole signup — it can't be bypassed by calling Supabase
--    directly instead of going through the app's UI.
--
-- 2. Record the IP + user agent of every signup into signup_fingerprints,
--    so admins can spot clusters of accounts created from the same IP.
--    This is intentionally NOT an automatic block — shared IPs (offices,
--    universities, mobile carriers, VPNs) are common and legitimate, so a
--    hard block would punish real users. It's a review signal, surfaced in
--    the admin dashboard, not an enforcement gate.
--
-- Run this once in the Supabase SQL editor, after profiles.sql.
-- ============================================================================

-- ── 1. Disposable email domain block ────────────────────────────────────────
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  email_domain text;
  blocked_domains text[] := array[
    'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', '10minutemail.com',
    '10minutemail.net', 'tempmail.com', 'temp-mail.org', 'throwawaymail.com',
    'yopmail.com', 'getnada.com', 'trashmail.com', 'fakeinbox.com', 'sharklasers.com',
    'dispostable.com', 'mailnesia.com', 'mintemail.com', 'mytemp.email',
    'maildrop.cc', 'mohmal.com', 'emailondeck.com', 'tempinbox.com', 'spamgourmet.com'
  ];
begin
  email_domain := lower(split_part(new.email, '@', 2));

  if email_domain = any(blocked_domains) then
    raise exception 'Disposable email addresses are not allowed. Please sign up with a permanent email address.';
  end if;

  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- handle_new_user_profile already has its trigger registered (on_auth_user_created_profile
-- in profiles.sql) — replacing the function body above is enough, no need to
-- re-create the trigger itself.

-- ── 2. Signup fingerprints (IP + user agent) for admin review ──────────────
create table if not exists public.signup_fingerprints (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_signup_fingerprints_ip on public.signup_fingerprints (ip_address);
create index if not exists idx_signup_fingerprints_user on public.signup_fingerprints (user_id);

-- Written only by the backend's service-role key — no client-facing policy.
alter table public.signup_fingerprints enable row level security;
