begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy "Read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- The address lives in auth.users. This avoids stale addresses and prevents
-- callers from subscribing someone else's email address.
create table public.waitlist_entries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_version text not null check (consent_version = 'launch-2026-09-17'),
  created_at timestamptz not null default now()
);
alter table public.waitlist_entries enable row level security;
revoke all on public.waitlist_entries from anon, authenticated;
grant select, insert, delete on public.waitlist_entries to authenticated;
grant all on public.waitlist_entries to service_role;

create function public.lacaccino_email_confirmed()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null); $$;
revoke all on function public.lacaccino_email_confirmed() from public, anon;
grant execute on function public.lacaccino_email_confirmed() to authenticated;
create policy "Read own waitlist entry" on public.waitlist_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "Join with a confirmed address" on public.waitlist_entries for insert to authenticated with check ((select auth.uid()) = user_id and (select public.lacaccino_email_confirmed()));
create policy "Leave own waitlist" on public.waitlist_entries for delete to authenticated using ((select auth.uid()) = user_id);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  message text not null check (char_length(message) between 10 and 4000),
  consent_version text not null check (consent_version = 'contact-2026-09-17'),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;
revoke all on public.contact_requests from anon, authenticated;
grant all on public.contact_requests to service_role;
-- No public policy: only the server and the project owner can access inquiries.

create table public.lacaccino_rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  attempts integer not null default 1,
  primary key (bucket, window_start)
);
alter table public.lacaccino_rate_limits enable row level security;
revoke all on public.lacaccino_rate_limits from anon, authenticated;
grant all on public.lacaccino_rate_limits to service_role;

-- Atomic across all Vercel instances; raw IP addresses are never stored.
create function public.lacaccino_take_rate_limit(bucket_key text, request_limit integer)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare current_attempts integer;
begin
  if bucket_key !~ '^[a-f0-9]{64}$' or request_limit < 1 or request_limit > 100 then
    raise exception 'Invalid rate limit arguments';
  end if;
  delete from public.lacaccino_rate_limits where window_start < now() - interval '2 hours';
  insert into public.lacaccino_rate_limits (bucket, window_start, attempts)
    values (bucket_key, date_trunc('hour', now()), 1)
    on conflict (bucket, window_start) do update
      set attempts = public.lacaccino_rate_limits.attempts + 1
    returning attempts into current_attempts;
  return current_attempts <= request_limit;
end;
$$;
revoke all on function public.lacaccino_take_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.lacaccino_take_rate_limit(text, integer) to service_role;

commit;
