-- Additive migration. NOT applied to the linked production project.
begin;

create table public.club_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 2 and 100),
  status text not null default 'draft' check(status in ('draft','open','vision')),
  confirmed boolean not null default false,
  address text not null default '' check(length(address)<=300),
  latitude numeric check(latitude between -90 and 90),
  longitude numeric check(longitude between -180 and 180),
  hours text not null default '' check(length(hours)<=1000),
  exceptions text not null default '' check(length(exceptions)<=1000),
  amenities text not null default '' check(length(amenities)<=500),
  contact text not null default '' check(length(contact)<=200),
  check(status <> 'open' or (confirmed and length(address)>5 and latitude is not null and longitude is not null))
);
create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  member_number text not null unique default ('LC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
  card_identifier uuid not null unique default gen_random_uuid(),
  status text not null default 'active' check(status in ('active','suspended','closed')),
  joined_at timestamptz not null default now(),
  preferred_location uuid references public.club_locations(id) on delete set null,
  order_notifications boolean not null default true,
  revision bigint not null default 1
);
create table public.club_staff_roles (
  user_id uuid not null references public.staff_members(user_id) on delete cascade,
  location_id uuid not null references public.club_locations(id) on delete cascade,
  role text not null check(role in ('employee','manager')),
  primary key(user_id,location_id)
);
create table public.club_drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 2 and 100),
  description text not null default '' check(length(description)<=500),
  active boolean not null default false
);
-- Each row is an explicitly allowed combination, not independent free-text options.
create table public.club_drink_variants (
  id uuid primary key default gen_random_uuid(),
  drink_id uuid not null references public.club_drinks(id) on delete cascade,
  size text not null check(length(size) between 1 and 40),
  temperature text not null check(length(temperature) between 1 and 40),
  milk text not null check(length(milk) between 1 and 60),
  extras text not null default '' check(length(extras)<=100),
  active boolean not null default true,
  unique(drink_id,size,temperature,milk,extras)
);
create table public.club_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.club_drink_variants(id),
  nickname text not null check(length(nickname) between 1 and 60),
  updated_at timestamptz not null default now(),
  unique(user_id,nickname)
);
create table public.club_rules (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null unique references public.club_locations(id),
  title text not null check(length(title) between 2 and 100),
  cents_per_point integer not null check(cents_per_point between 1 and 100000),
  conditions text not null check(length(conditions) between 5 and 2000),
  active boolean not null default false
);
create table public.club_rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(title) between 2 and 100),
  description text not null default '' check(length(description)<=1000),
  points integer not null check(points between 1 and 1000000),
  conditions text not null check(length(conditions) between 5 and 2000),
  location_id uuid references public.club_locations(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default false,
  check(ends_at is null or ends_at>starts_at)
);
alter table public.loyalty_entries add column kind text not null default 'correction' check(kind in ('award','redemption','correction','reversal'));
alter table public.loyalty_entries add column location_id uuid references public.club_locations(id);
alter table public.loyalty_entries add column source_reference text check(length(source_reference)<=100);
alter table public.loyalty_entries add column reverses_entry uuid unique references public.loyalty_entries(id);
alter table public.loyalty_entries add column input_amount integer;
create unique index club_unique_receipt on public.loyalty_entries(location_id,source_reference) where kind='award';
create table public.club_redemptions (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  reward_id uuid not null references public.club_rewards(id),
  title text not null,
  points integer not null check(points>0),
  conditions text not null,
  location_id uuid references public.club_locations(id),
  expires_at timestamptz,
  status text not null default 'reserved' check(status in ('reserved','fulfilled','cancelled')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  fulfilled_by uuid references auth.users(id) on delete set null
);
create table public.club_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check(kind in ('news','event','promotion')),
  title text not null check(length(title) between 2 and 120),
  body text not null check(length(body) between 5 and 4000),
  image_path text not null default '' check(image_path='' or image_path like '/images/%'),
  location_id uuid references public.club_locations(id),
  published boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  capacity integer check(capacity between 1 and 10000),
  check(ends_at is null or ends_at>starts_at),
  check(kind='event' or capacity is null)
);
create table public.club_event_registrations (
  event_id uuid not null references public.club_content(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(event_id,user_id)
);
create table public.club_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check(category in ('account','order','marketing')),
  title text not null check(length(title)<=120),
  body text not null check(length(body)<=2000),
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id,event_key)
);
create table public.club_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check(status in ('pending','processing','completed')),
  created_at timestamptz not null default now()
);
create unique index club_one_deletion_request on public.club_deletion_requests(user_id) where status<>'completed';
create table public.club_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  location_id uuid references public.club_locations(id),
  operation text not null,
  reference uuid,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- Privileged Club operations require MFA, independently of hidden UI controls.
create table public.club_action_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  bucket timestamptz not null,
  attempts integer not null,
  primary key(user_id,operation)
);
alter table public.club_action_limits enable row level security;
revoke all on public.club_action_limits from public,anon,authenticated;
grant all on public.club_action_limits to service_role;
create function public.club_limit(operation_name text) returns void language plpgsql security definer set search_path='' as $$
declare count_now integer; max_count integer; stamp timestamptz:=date_trunc('minute',clock_timestamp());
begin
  if auth.uid() is null then raise exception 'CLUB_AUTH'; end if;
  max_count:=case operation_name when 'mutation' then 40 when 'lookup' then 60 when 'export' then 10 else 0 end;
  if max_count=0 then raise exception 'CLUB_INPUT'; end if;
  insert into public.club_action_limits(user_id,operation,bucket,attempts) values(auth.uid(),operation_name,stamp,1)
  on conflict(user_id,operation) do update set bucket=excluded.bucket,attempts=case when club_action_limits.bucket=excluded.bucket then club_action_limits.attempts+1 else 1 end
  returning attempts into count_now;
  if count_now>max_count then raise exception 'CLUB_RATE'; end if;
end; $$;

create function public.club_is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select public.portal_is_admin() and coalesce(auth.jwt()->>'aal','')='aal2';
$$;
create function public.club_can_work(location uuid, management boolean default false) returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(auth.jwt()->>'aal','')='aal2' and (
    public.portal_is_admin() or (public.staff_enabled() and exists(
      select 1 from public.club_staff_roles r where r.user_id=auth.uid() and r.location_id=location and (not management or r.role='manager')
    ))
  );
$$;
create function public.club_active_member() returns uuid language sql stable security definer set search_path='' as $$
  select id from public.club_memberships where user_id=auth.uid() and status='active' and public.lacaccino_email_confirmed();
$$;

-- All mutations below are RPCs; no client can write roles, points or card IDs.
do $$ declare t text; begin
  foreach t in array array['club_locations','club_memberships','club_staff_roles','club_drinks','club_drink_variants','club_favourites','club_rules','club_rewards','club_redemptions','club_content','club_event_registrations','club_notifications','club_deletion_requests','club_audit'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
create policy club_own_membership on public.club_memberships for select to authenticated using(user_id=auth.uid());
create policy club_own_roles on public.club_staff_roles for select to authenticated using(user_id=auth.uid());
create policy club_own_favourites on public.club_favourites for select to authenticated using(user_id=auth.uid());
create policy club_own_redemptions on public.club_redemptions for select to authenticated using(user_id=auth.uid());
create policy club_own_events on public.club_event_registrations for select to authenticated using(user_id=auth.uid());
create policy club_own_deletion on public.club_deletion_requests for select to authenticated using(user_id=auth.uid());
create policy club_own_notifications on public.club_notifications for select to authenticated using(user_id=auth.uid() and (category<>'marketing' or exists(select 1 from public.newsletter_preferences p where p.user_id=auth.uid() and p.subscribed)));
create policy club_public_locations on public.club_locations for select to authenticated using(status in ('open','vision'));
create policy club_catalogue on public.club_drinks for select to authenticated using(active);
create policy club_variants on public.club_drink_variants for select to authenticated using(active and exists(select 1 from public.club_drinks d where d.id=drink_id and d.active));
create policy club_public_rules on public.club_rules for select to authenticated using(active);
create policy club_public_rewards on public.club_rewards for select to authenticated using(active and starts_at<=now() and (ends_at is null or ends_at>now()));
create policy club_public_content on public.club_content for select to authenticated using(published and starts_at<=now() and (ends_at is null or ends_at>now()));
create policy club_admin_audit on public.club_audit for select to authenticated using(public.club_is_admin());

create function public.club_join() returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  perform public.club_limit('mutation');
  if auth.uid() is null or not public.lacaccino_email_confirmed() then raise exception 'CLUB_AUTH'; end if;
  if exists(select 1 from public.portal_admins where user_id=auth.uid()) or exists(select 1 from public.staff_members where user_id=auth.uid()) then raise exception 'CLUB_CUSTOMER'; end if;
  insert into public.club_memberships(user_id) values(auth.uid()) on conflict(user_id) do nothing;
  insert into public.loyalty_accounts(user_id) values(auth.uid()) on conflict do nothing;
  select id into result from public.club_memberships where user_id=auth.uid();
  return result;
end; $$;

create function public.club_save_favourite(favourite_id uuid, selected_variant uuid, label text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  perform public.club_limit('mutation');
  if public.club_active_member() is null then raise exception 'CLUB_AUTH'; end if;
  if not exists(select 1 from public.club_drink_variants v join public.club_drinks d on d.id=v.drink_id where v.id=selected_variant and v.active and d.active) then raise exception 'CLUB_VARIANT'; end if;
  if favourite_id is null then
    if (select count(*) from public.club_favourites where user_id=auth.uid())>=30 then raise exception 'CLUB_LIMIT'; end if;
    insert into public.club_favourites(user_id,variant_id,nickname) values(auth.uid(),selected_variant,trim(label)) returning id into result;
  else
    update public.club_favourites set variant_id=selected_variant,nickname=trim(label),updated_at=now() where id=favourite_id and user_id=auth.uid() returning id into result;
    if result is null then raise exception 'CLUB_NOT_FOUND'; end if;
  end if;
  return result;
end; $$;
create function public.club_remove_favourite(favourite_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.club_limit('mutation');
  if public.club_active_member() is null then raise exception 'CLUB_AUTH'; end if;
  delete from public.club_favourites where id=favourite_id and user_id=auth.uid();
end; $$;

create function public.club_save_profile(given_name text,family_name text,telephone text,preferred uuid,order_messages boolean,marketing boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.club_limit('mutation');
  if public.club_active_member() is null then raise exception 'CLUB_AUTH'; end if;
  if length(trim(given_name)) not between 1 and 80 or length(trim(family_name)) not between 1 and 80 or length(telephone)>40 then raise exception 'CLUB_INPUT'; end if;
  if telephone<>'' and (telephone !~ '^[+0-9()[:space:]./-]{5,40}$' or length(regexp_replace(telephone,'[^0-9]','','g'))<5) then raise exception 'CLUB_INPUT'; end if;
  if preferred is not null and not exists(select 1 from public.club_locations where id=preferred and status='open' and confirmed) then raise exception 'CLUB_LOCATION'; end if;
  update public.profiles set first_name=trim(given_name),last_name=trim(family_name),display_name=trim(given_name),phone=trim(telephone) where id=auth.uid();
  update public.club_memberships set preferred_location=preferred,order_notifications=order_messages,revision=revision+1 where user_id=auth.uid();
  perform public.portal_set_newsletter(marketing);
end; $$;

create function public.club_book_points(card text,location uuid,operation text,amount integer,reference_text text,reason_text text,request_id uuid,original_entry uuid default null) returns bigint language plpgsql security definer set search_path='' as $$
declare member public.club_memberships%rowtype; previous public.loyalty_entries%rowtype; balance_now bigint; delta integer; rule public.club_rules%rowtype; original public.loyalty_entries%rowtype;
begin
  perform public.club_limit('mutation');
  if operation not in ('award','correction','reversal') or not public.club_can_work(location,operation<>'award') then raise exception 'CLUB_FORBIDDEN'; end if;
  if request_id is null or length(trim(reason_text)) not between 3 and 200 or length(trim(reference_text)) not between 3 and 100 then raise exception 'CLUB_INPUT'; end if;
  if not exists(select 1 from public.club_locations where id=location and status='open' and confirmed) then raise exception 'CLUB_LOCATION'; end if;
  select * into member from public.club_memberships where member_number=upper(trim(card)) or 'LC1:'||card_identifier::text=trim(card);
  if not found or member.status<>'active' then raise exception 'CLUB_NOT_FOUND'; end if;
  -- Serializes every balance mutation for this account, including concurrent redemption.
  select balance into balance_now from public.loyalty_accounts where user_id=member.user_id for update;
  if not found then raise exception 'CLUB_NOT_FOUND'; end if;
  select * into member from public.club_memberships where id=member.id for update;
  if member.status<>'active' then raise exception 'CLUB_NOT_FOUND'; end if;
  select * into previous from public.loyalty_entries where idempotency_key=request_id;
  if found then
    if previous.user_id<>member.user_id or previous.location_id is distinct from location or previous.kind<>operation or previous.source_reference<>trim(reference_text) or previous.reason<>trim(reason_text) or previous.created_by is distinct from auth.uid() then raise exception 'CLUB_CONFLICT'; end if;
    if previous.input_amount is distinct from amount then raise exception 'CLUB_CONFLICT'; end if;
    if operation='reversal' and previous.reverses_entry is distinct from original_entry then raise exception 'CLUB_CONFLICT'; end if;
    return balance_now;
  end if;
  if operation='award' then
    select * into rule from public.club_rules where location_id=location and active;
    if not found then raise exception 'CLUB_RULE'; end if;
    if amount is null or amount not between 1 and 100000000 then raise exception 'CLUB_INPUT'; end if;
    delta:=floor(amount::numeric/rule.cents_per_point);
    if delta<=0 then raise exception 'CLUB_ZERO'; end if;
  elsif operation='reversal' then
    select * into original from public.loyalty_entries where id=original_entry and user_id=member.user_id and location_id=location and kind in ('award','correction');
    if not found then raise exception 'CLUB_NOT_FOUND'; end if;
    delta:=-original.amount;
  else delta:=amount;
  end if;
  if delta is null or delta=0 or abs(delta::bigint)>1000000 then raise exception 'CLUB_INPUT'; end if;
  if balance_now+delta<0 then raise exception 'CLUB_BALANCE'; end if;
  insert into public.loyalty_entries(user_id,amount,reason,idempotency_key,created_by,kind,location_id,source_reference,reverses_entry,input_amount)
    values(member.user_id,delta,trim(reason_text),request_id,auth.uid(),operation,location,trim(reference_text),case when operation='reversal' then original_entry end,amount);
  update public.loyalty_accounts set balance=balance+delta where user_id=member.user_id returning balance into balance_now;
  insert into public.club_audit(actor_id,location_id,operation,reference,reason) values(auth.uid(),location,operation,request_id,trim(reason_text));
  insert into public.club_notifications(user_id,category,title,body,event_key) values(member.user_id,'account','Dein Punktekonto wurde aktualisiert',delta::text||' Punkte · '||trim(reason_text),'points:'||request_id);
  return balance_now;
end; $$;

create function public.club_reserve_reward(reward uuid,request_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare offer public.club_rewards%rowtype; previous public.club_redemptions%rowtype; balance_now bigint;
begin
  perform public.club_limit('mutation');
  if public.club_active_member() is null then raise exception 'CLUB_AUTH'; end if;
  if request_id is null then raise exception 'CLUB_INPUT'; end if;
  select balance into balance_now from public.loyalty_accounts where user_id=auth.uid() for update;
  perform 1 from public.club_memberships where user_id=auth.uid() and status='active' for update;
  if not found then raise exception 'CLUB_AUTH'; end if;
  select * into previous from public.club_redemptions where id=request_id;
  if found then
    if previous.user_id is distinct from auth.uid() or previous.reward_id<>reward then raise exception 'CLUB_CONFLICT'; end if;
    return previous.id;
  end if;
  select * into offer from public.club_rewards where id=reward and active and starts_at<=now() and (ends_at is null or ends_at>now()) for share;
  if not found then raise exception 'CLUB_REWARD'; end if;
  if balance_now is null or balance_now<offer.points then raise exception 'CLUB_BALANCE'; end if;
  insert into public.club_redemptions(id,user_id,reward_id,title,points,conditions,location_id,expires_at)
    values(request_id,auth.uid(),offer.id,offer.title,offer.points,offer.conditions,offer.location_id,offer.ends_at);
  insert into public.loyalty_entries(user_id,amount,reason,idempotency_key,kind) values(auth.uid(),-offer.points,'Prämie: '||offer.title,request_id,'redemption');
  update public.loyalty_accounts set balance=balance-offer.points where user_id=auth.uid();
  return request_id;
end; $$;

create function public.club_finish_reward(redemption uuid,location uuid,cancel boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare item public.club_redemptions%rowtype;
begin
  perform public.club_limit('mutation');
  select * into item from public.club_redemptions where id=redemption;
  if not found then raise exception 'CLUB_NOT_FOUND'; end if;
  if cancel then
    if item.user_id is distinct from auth.uid() and not public.club_can_work(location,true) then raise exception 'CLUB_FORBIDDEN'; end if;
  elsif not public.club_can_work(location) then raise exception 'CLUB_FORBIDDEN'; end if;
  if not cancel and (not exists(select 1 from public.club_locations where id=location and status='open' and confirmed) or (item.location_id is not null and item.location_id<>location)) then raise exception 'CLUB_LOCATION'; end if;
  -- Same lock order as reserve; never balance after redemption lock.
  perform 1 from public.loyalty_accounts where user_id=item.user_id for update;
  perform 1 from public.club_memberships where user_id=item.user_id for update;
  select * into item from public.club_redemptions where id=redemption for update;
  if item.status=(case when cancel then 'cancelled' else 'fulfilled' end) then return; end if;
  if item.status<>'reserved' then raise exception 'CLUB_CONFLICT'; end if;
  if not cancel and (item.expires_at<=now() or not exists(select 1 from public.club_memberships where user_id=item.user_id and status='active')) then raise exception 'CLUB_REWARD'; end if;
  update public.club_redemptions set status=case when cancel then 'cancelled' else 'fulfilled' end,fulfilled_at=now(),fulfilled_by=auth.uid() where id=redemption;
  if cancel then
    insert into public.loyalty_entries(user_id,amount,reason,idempotency_key,created_by,kind,reverses_entry)
      select item.user_id,item.points,'Prämie storniert: '||item.title,gen_random_uuid(),auth.uid(),'reversal',id from public.loyalty_entries where idempotency_key=item.id;
    update public.loyalty_accounts set balance=balance+item.points where user_id=item.user_id;
  end if;
  insert into public.club_audit(actor_id,location_id,operation,reference) values(auth.uid(),location,case when cancel then 'reward.cancel' else 'reward.fulfil' end,redemption);
end; $$;

create function public.club_event_signup(event uuid,joining boolean) returns void language plpgsql security definer set search_path='' as $$
declare item public.club_content%rowtype;
begin
  perform public.club_limit('mutation');
  if public.club_active_member() is null then raise exception 'CLUB_AUTH'; end if;
  select * into item from public.club_content where id=event for update;
  if not joining then delete from public.club_event_registrations where event_id=event and user_id=auth.uid(); return; end if;
  if not found or item.kind<>'event' or not item.published or item.starts_at>now() or item.ends_at<=now() then raise exception 'CLUB_NOT_FOUND'; end if;
  if exists(select 1 from public.club_event_registrations where event_id=event and user_id=auth.uid()) then return; end if;
  if item.capacity is not null and (select count(*) from public.club_event_registrations where event_id=event)>=item.capacity then raise exception 'CLUB_CAPACITY'; end if;
  insert into public.club_event_registrations(event_id,user_id) values(event,auth.uid());
end; $$;

create function public.club_mark_read(notification uuid) returns void language plpgsql security definer set search_path='' as $$
begin update public.club_notifications set read_at=now() where id=notification and user_id=auth.uid(); end; $$;
create function public.club_set_marketing(subscribed boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.club_limit('mutation');
  perform public.portal_set_newsletter(subscribed);
end; $$;
create function public.club_request_deletion() returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  perform public.club_limit('mutation');
  if not public.lacaccino_email_confirmed() or not exists(select 1 from public.club_memberships where user_id=auth.uid()) then raise exception 'CLUB_AUTH'; end if;
  perform 1 from public.club_memberships where user_id=auth.uid() for update;
  select id into result from public.club_deletion_requests where user_id=auth.uid() and status<>'completed';
  if result is null then
    insert into public.club_deletion_requests(user_id) values(auth.uid()) returning id into result;
    insert into public.club_notifications(user_id,category,title,body,event_key) values(auth.uid(),'account','Löschungsanfrage eingegangen','Die Administration prüft abhängige Daten und meldet sich bei dir. Dein Konto ist noch nicht gelöscht.','deletion:'||result);
  end if;
  return result;
end; $$;

-- Explicit RPC allow-list, no generic dynamic mutation endpoint.
do $$ declare f record; begin
  for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname like 'club\_%' escape '\' loop
    execute 'revoke all on function '||f.signature||' from public,anon';
    execute 'grant execute on function '||f.signature||' to authenticated';
  end loop;
end $$;
commit;
