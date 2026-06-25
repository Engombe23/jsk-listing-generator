-- User billing profile — one row per auth.users account.
-- Profiles for users on the app (not service roles).
create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  plan                   text not null default 'free',
  stripe_customer_id     text,
  stripe_subscription_id text,
  subscription_status    text,
  billing_interval       text,
  updated_at             timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Service role (backend webhooks) bypasses RLS. Users read their own row from the client.
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, plan)
  values (new.id, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
