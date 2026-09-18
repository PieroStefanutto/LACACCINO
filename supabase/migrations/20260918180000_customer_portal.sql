begin;

alter table public.profiles
  add column first_name text not null default '' check (char_length(first_name) <= 80),
  add column last_name text not null default '' check (char_length(last_name) <= 80),
  add column phone text not null default '' check (char_length(phone) <= 40);

-- Customers cannot assign roles, points or consent timestamps to themselves.
create table public.portal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  must_change_password boolean not null default true
);
alter table public.portal_admins enable row level security;
revoke all on public.portal_admins from anon, authenticated;
grant all on public.portal_admins to service_role;

create function public.portal_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.portal_admins where user_id = (select auth.uid()) and not must_change_password); $$;
revoke all on function public.portal_is_admin() from public, anon;
grant execute on function public.portal_is_admin() to authenticated, service_role;

create table public.newsletter_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscribed boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.newsletter_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscribed boolean not null,
  consent_version text not null default 'newsletter-2026-09-18',
  source text not null check(source in ('registration', 'portal')),
  created_at timestamptz not null default now()
);
alter table public.newsletter_preferences enable row level security;
alter table public.newsletter_events enable row level security;
revoke all on public.newsletter_preferences, public.newsletter_events from anon, authenticated;
grant select on public.newsletter_preferences, public.newsletter_events to authenticated;
grant all on public.newsletter_preferences, public.newsletter_events to service_role;
create policy "Own newsletter preference" on public.newsletter_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own newsletter history" on public.newsletter_events for select to authenticated using ((select auth.uid()) = user_id);

create function public.portal_set_newsletter(wants_newsletter boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare current_user_id uuid := auth.uid(); old_value boolean;
begin
  if current_user_id is null or not public.lacaccino_email_confirmed() or wants_newsletter is null then raise exception 'Verified account required'; end if;
  -- Serialize requests for this user, including the first preference insert.
  perform 1 from auth.users where id = current_user_id for update;
  select subscribed into old_value from public.newsletter_preferences where user_id = current_user_id;
  if old_value is distinct from wants_newsletter then
    insert into public.newsletter_preferences(user_id, subscribed) values(current_user_id, wants_newsletter)
      on conflict(user_id) do update set subscribed = excluded.subscribed, updated_at = now();
    insert into public.newsletter_events(user_id, subscribed, source) values(current_user_id, wants_newsletter, 'portal');
  end if;
end; $$;
revoke all on function public.portal_set_newsletter(boolean) from public, anon;
grant execute on function public.portal_set_newsletter(boolean) to authenticated;

create table public.loyalty_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check(balance >= 0)
);
create table public.loyalty_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check(amount <> 0 and amount between -1000000 and 1000000),
  reason text not null check(char_length(reason) between 3 and 200),
  idempotency_key uuid not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_entries enable row level security;
revoke all on public.loyalty_accounts, public.loyalty_entries from anon, authenticated;
grant select on public.loyalty_accounts, public.loyalty_entries to authenticated;
grant all on public.loyalty_accounts, public.loyalty_entries to service_role;
create policy "Own points balance" on public.loyalty_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own points entries" on public.loyalty_entries for select to authenticated using ((select auth.uid()) = user_id);

create function public.portal_adjust_points(target_user uuid, points_delta integer, booking_reason text, request_key uuid)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare current_balance bigint; existing public.loyalty_entries%rowtype;
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  if points_delta is null or points_delta = 0 or abs(points_delta::bigint) > 1000000
    or booking_reason is null or char_length(trim(booking_reason)) not between 3 and 200 or request_key is null then
    raise exception 'Invalid booking';
  end if;
  if not exists(select 1 from auth.users where id = target_user and email_confirmed_at is not null)
    or exists(select 1 from public.portal_admins where user_id = target_user) then raise exception 'Customer required'; end if;
  insert into public.loyalty_accounts(user_id) values(target_user) on conflict do nothing;
  select balance into current_balance from public.loyalty_accounts where user_id = target_user for update;
  select * into existing from public.loyalty_entries where idempotency_key = request_key;
  if found then
    if existing.user_id <> target_user or existing.amount <> points_delta or existing.reason <> trim(booking_reason) then raise exception 'Booking key already used'; end if;
    return current_balance;
  end if;
  if current_balance + points_delta < 0 then raise exception 'Insufficient points'; end if;
  insert into public.loyalty_entries(user_id,amount,reason,idempotency_key,created_by)
    values(target_user,points_delta,trim(booking_reason),request_key,auth.uid());
  update public.loyalty_accounts set balance = balance + points_delta where user_id = target_user returning balance into current_balance;
  return current_balance;
end; $$;
revoke all on function public.portal_adjust_points(uuid,integer,text,uuid) from public, anon;
grant execute on function public.portal_adjust_points(uuid,integer,text,uuid) to authenticated;

-- Only the initial account creation/confirmation imports registration fields.
-- Later user-editable metadata can never grant admin rights or points.
create function public.portal_initialize_customer()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op = 'UPDATE' then
    if old.email_confirmed_at is not null then return new; end if;
  end if;
  insert into public.profiles(id,first_name,last_name,phone,display_name)
    values(new.id,left(coalesce(new.raw_user_meta_data->>'first_name',''),80),
      left(coalesce(new.raw_user_meta_data->>'last_name',''),80),
      left(coalesce(new.raw_user_meta_data->>'phone',''),40),
      left(coalesce(new.raw_user_meta_data->>'first_name',''),100))
    on conflict(id) do nothing;
  insert into public.loyalty_accounts(user_id) values(new.id) on conflict do nothing;
  if new.raw_user_meta_data->>'newsletter' = 'true' and new.raw_user_meta_data->>'newsletter_version' = 'newsletter-2026-09-18' then
    insert into public.newsletter_preferences(user_id,subscribed) values(new.id,true) on conflict do nothing;
    if found then insert into public.newsletter_events(user_id,subscribed,source) values(new.id,true,'registration'); end if;
  end if;
  return new;
end; $$;
revoke all on function public.portal_initialize_customer() from public, anon, authenticated;
create trigger portal_customer_initialized after insert or update of email_confirmed_at on auth.users
  for each row execute function public.portal_initialize_customer();
insert into public.profiles(id) select id from auth.users where email_confirmed_at is not null on conflict do nothing;
insert into public.loyalty_accounts(user_id) select id from auth.users where email_confirmed_at is not null on conflict do nothing;

create function public.portal_customer_list(search_term text default '', page_offset integer default 0)
returns table(id uuid, email text, first_name text, last_name text, phone text, balance bigint, subscribed boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  return query select u.id, u.email::text, p.first_name, p.last_name, p.phone,
    coalesce(a.balance,0), coalesce(n.subscribed,false), u.created_at
    from auth.users u join public.profiles p on p.id = u.id
    left join public.loyalty_accounts a on a.user_id = u.id
    left join public.newsletter_preferences n on n.user_id = u.id
    where not exists(select 1 from public.portal_admins ad where ad.user_id = u.id)
    and (coalesce(u.email,'') || ' ' || p.first_name || ' ' || p.last_name) ilike '%' || left(coalesce(search_term,''),80) || '%'
    order by u.created_at desc, u.id limit 50 offset greatest(0,least(coalesce(page_offset,0),100000));
end; $$;
revoke all on function public.portal_customer_list(text,integer) from public, anon;
grant execute on function public.portal_customer_list(text,integer) to authenticated;

commit;
