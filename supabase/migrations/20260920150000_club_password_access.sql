-- Operator-requested password-only access. Database roles, confirmed accounts,
-- initial-password requirements and location permissions remain authoritative.
begin;

create or replace function public.club_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select public.lacaccino_email_confirmed() and public.portal_is_admin();
$$;

create or replace function public.club_can_work(location uuid, management boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
  select public.lacaccino_email_confirmed() and (
    public.portal_is_admin() or (public.staff_enabled() and exists(
      select 1 from public.club_staff_roles r
      where r.user_id=auth.uid() and r.location_id=location
        and (not management or r.role='manager')
    ))
  );
$$;

create or replace function public.club_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); result jsonb;
begin
  if me is null or not public.lacaccino_email_confirmed() then raise exception 'CLUB_AUTH'; end if;
  select jsonb_build_object(
    'member',(select to_jsonb(m) from public.club_memberships m where user_id=me),
    'initial_password',case when exists(select 1 from public.portal_admins where user_id=me and must_change_password) then '/admin/passwort' when exists(select 1 from public.staff_members where user_id=me and active and must_change_password) then '/mitarbeiter/passwort' else null end,
    'profile',(select jsonb_build_object('first_name',p.first_name,'last_name',p.last_name,'phone',p.phone,'email',u.email) from public.profiles p join auth.users u on u.id=p.id where p.id=me),
    'balance',coalesce((select balance from public.loyalty_accounts where user_id=me),0),
    'newsletter',coalesce((select subscribed from public.newsletter_preferences where user_id=me),false),
    'entries',coalesce((select jsonb_agg(e order by e.created_at desc) from (select id,amount,reason,kind,created_at from public.loyalty_entries where user_id=me order by created_at desc limit 100) e),'[]'),
    'favourites',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'nickname',f.nickname,'variant_id',v.id,'drink',d.name,'size',v.size,'temperature',v.temperature,'milk',v.milk,'extras',v.extras,'available',v.active and d.active) order by f.updated_at desc) from public.club_favourites f join public.club_drink_variants v on v.id=f.variant_id join public.club_drinks d on d.id=v.drink_id where f.user_id=me),'[]'),
    'variants',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'drink',d.name,'size',v.size,'temperature',v.temperature,'milk',v.milk,'extras',v.extras) order by d.name) from public.club_drink_variants v join public.club_drinks d on d.id=v.drink_id where d.active and v.active),'[]'),
    'rewards',coalesce((select jsonb_agg(r order by r.points) from public.club_rewards r where active and starts_at<=now() and (ends_at is null or ends_at>now())),'[]'),
    'redemptions',coalesce((select jsonb_agg(r order by r.created_at desc) from public.club_redemptions r where user_id=me),'[]'),
    'locations',coalesce((select jsonb_agg(l order by l.name) from public.club_locations l where status in ('open','vision')),'[]'),
    'content',coalesce((select jsonb_agg(c order by c.starts_at desc) from public.club_content c where published and starts_at<=now() and (ends_at is null or ends_at>now())),'[]'),
    'events',coalesce((select jsonb_agg(event_id) from public.club_event_registrations where user_id=me),'[]'),
    'notifications',coalesce((select jsonb_agg(n order by n.created_at desc) from (select * from public.club_notifications where user_id=me and (category<>'marketing' or exists(select 1 from public.newsletter_preferences where user_id=me and subscribed)) order by created_at desc limit 100) n),'[]'),
    'deletion',(select to_jsonb(d) from public.club_deletion_requests d where user_id=me and status<>'completed' limit 1),
    'role',case when public.club_is_admin() then 'administrator' when public.staff_enabled() and exists(select 1 from public.club_staff_roles where user_id=me and role='manager') then 'manager' when public.staff_enabled() then 'employee' else 'customer' end,
    'privileged',public.portal_is_admin() or public.staff_enabled(),
    'work_locations',coalesce((select jsonb_agg(l order by l.name) from public.club_locations l where status='open' and confirmed and public.club_can_work(l.id)),'[]')
  ) into result;
  return result;
end; $$;

commit;
