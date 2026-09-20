-- Storage/queue preparation only. No provider calls, no unsigned pass delivery.
begin;
create table public.club_wallet_passes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club_memberships(id),
  provider text not null check(provider in ('apple','google')),
  provider_identifier text not null unique,
  authentication_token_encrypted text,
  delivered_revision bigint not null default 0,
  created_at timestamptz not null default now(),
  unique(member_id,provider),
  check(provider<>'apple' or authentication_token_encrypted is not null)
);
create table public.club_wallet_devices (
  id uuid primary key default gen_random_uuid(),
  device_identifier_hash text not null unique,
  push_token_encrypted text not null,
  created_at timestamptz not null default now()
);
create table public.club_wallet_registrations (
  pass_id uuid not null references public.club_wallet_passes(id) on delete cascade,
  device_id uuid not null references public.club_wallet_devices(id) on delete cascade,
  primary key(pass_id,device_id)
);
create table public.club_wallet_jobs (
  id bigint generated always as identity primary key,
  pass_id uuid not null references public.club_wallet_passes(id),
  revision bigint not null,
  status text not null default 'pending' check(status in ('pending','working','done','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(pass_id,revision)
);
do $$ declare t text; begin
  foreach t in array array['club_wallet_passes','club_wallet_devices','club_wallet_registrations','club_wallet_jobs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
create function public.club_member_closed() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.user_id is null then new.status:='closed'; new.preferred_location:=null; new.order_notifications:=false; new.revision:=old.revision+1; end if;
  return new;
end; $$;
create trigger club_member_closed before update on public.club_memberships for each row execute function public.club_member_closed();
create function public.club_wallet_enqueue() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.revision<>old.revision or new.status<>old.status then
    insert into public.club_wallet_jobs(pass_id,revision) select id,new.revision from public.club_wallet_passes where member_id=new.id on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger club_wallet_enqueue after update on public.club_memberships for each row execute function public.club_wallet_enqueue();
create function public.club_wallet_balance_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.balance<>old.balance then update public.club_memberships set revision=revision+1 where user_id=new.user_id; end if;
  return new;
end; $$;
create trigger club_wallet_balance_changed after update on public.loyalty_accounts for each row execute function public.club_wallet_balance_changed();
create function public.club_wallet_profile_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.first_name is distinct from old.first_name or new.last_name is distinct from old.last_name then update public.club_memberships set revision=revision+1 where user_id=new.id; end if;
  return new;
end; $$;
create trigger club_wallet_profile_changed after update on public.profiles for each row execute function public.club_wallet_profile_changed();
revoke all on function public.club_member_closed(),public.club_wallet_enqueue(),public.club_wallet_balance_changed(),public.club_wallet_profile_changed() from public,anon,authenticated;
commit;
