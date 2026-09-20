begin;
create function public.club_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
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
    'role',case when public.club_is_admin() then 'administrator' when public.staff_enabled() and coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.club_staff_roles where user_id=me and role='manager') then 'manager' when public.staff_enabled() and coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.club_staff_roles where user_id=me) then 'employee' else 'customer' end,
    'privileged',public.portal_is_admin() or public.staff_enabled(),
    'work_locations',coalesce((select jsonb_agg(l order by l.name) from public.club_locations l where status='open' and confirmed and public.club_can_work(l.id)),'[]')
  ) into result;
  return result;
end; $$;

create function public.club_lookup(card text,location uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare member public.club_memberships%rowtype;
begin
  perform public.club_limit('lookup');
  if not public.club_can_work(location) then raise exception 'CLUB_FORBIDDEN'; end if;
  select * into member from public.club_memberships where member_number=upper(trim(card)) or 'LC1:'||card_identifier::text=trim(card);
  if not found then raise exception 'CLUB_NOT_FOUND'; end if;
  insert into public.club_audit(actor_id,location_id,operation,reference) values(auth.uid(),location,'member.lookup',member.id);
  return jsonb_build_object('member_number',member.member_number,'status',member.status,
    'name',(select trim(first_name||' '||left(last_name,1)||'.') from public.profiles where id=member.user_id),
    'balance',(select balance from public.loyalty_accounts where user_id=member.user_id),
    'redemptions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'conditions',conditions,'expires_at',expires_at)) from public.club_redemptions where user_id=member.user_id and status='reserved' and (location_id is null or location_id=location)),'[]'));
end; $$;

create function public.club_admin_save(entity text,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare item uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid()); target uuid;
begin
  perform public.club_limit('mutation');
  if not public.club_is_admin() then raise exception 'CLUB_FORBIDDEN'; end if;
  case entity
  when 'location' then
    insert into public.club_locations(id,name,status,confirmed,address,latitude,longitude,hours,exceptions,amenities,contact)
    values(item,payload->>'name',payload->>'status',coalesce((payload->>'confirmed')::boolean,false),coalesce(payload->>'address',''),nullif(payload->>'latitude','')::numeric,nullif(payload->>'longitude','')::numeric,coalesce(payload->>'hours',''),coalesce(payload->>'exceptions',''),coalesce(payload->>'amenities',''),coalesce(payload->>'contact',''))
    on conflict(id) do update set name=excluded.name,status=excluded.status,confirmed=excluded.confirmed,address=excluded.address,latitude=excluded.latitude,longitude=excluded.longitude,hours=excluded.hours,exceptions=excluded.exceptions,amenities=excluded.amenities,contact=excluded.contact;
  when 'drink' then
    insert into public.club_drinks(id,name,description,active) values(item,payload->>'name',coalesce(payload->>'description',''),coalesce((payload->>'active')::boolean,false))
    on conflict(id) do update set name=excluded.name,description=excluded.description,active=excluded.active;
  when 'variant' then
    insert into public.club_drink_variants(id,drink_id,size,temperature,milk,extras,active) values(item,(payload->>'drink_id')::uuid,payload->>'size',payload->>'temperature',payload->>'milk',coalesce(payload->>'extras',''),coalesce((payload->>'active')::boolean,false))
    on conflict(id) do update set drink_id=excluded.drink_id,size=excluded.size,temperature=excluded.temperature,milk=excluded.milk,extras=excluded.extras,active=excluded.active;
  when 'reward' then
    insert into public.club_rewards(id,title,description,points,conditions,location_id,starts_at,ends_at,active) values(item,payload->>'title',coalesce(payload->>'description',''),(payload->>'points')::integer,payload->>'conditions',nullif(payload->>'location_id','')::uuid,coalesce(nullif(payload->>'starts_at','')::timestamptz,now()),nullif(payload->>'ends_at','')::timestamptz,coalesce((payload->>'active')::boolean,false))
    on conflict(id) do update set title=excluded.title,description=excluded.description,points=excluded.points,conditions=excluded.conditions,location_id=excluded.location_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active;
  when 'rule' then
    insert into public.club_rules(id,location_id,title,cents_per_point,conditions,active) values(item,(payload->>'location_id')::uuid,payload->>'title',(payload->>'cents_per_point')::integer,payload->>'conditions',coalesce((payload->>'active')::boolean,false))
    on conflict(id) do update set location_id=excluded.location_id,title=excluded.title,cents_per_point=excluded.cents_per_point,conditions=excluded.conditions,active=excluded.active;
  when 'content' then
    if payload->>'kind'='event' and nullif(payload->>'capacity','') is not null and (payload->>'capacity')::integer<(select count(*) from public.club_event_registrations where event_id=item) then raise exception 'CLUB_CAPACITY'; end if;
    -- Lock content before checking capacity, matching registration's lock order.
    perform 1 from public.club_content where id=item for update;
    if payload->>'kind'='event' and nullif(payload->>'capacity','') is not null and (payload->>'capacity')::integer<(select count(*) from public.club_event_registrations where event_id=item) then raise exception 'CLUB_CAPACITY'; end if;
    insert into public.club_content(id,kind,title,body,image_path,location_id,published,starts_at,ends_at,capacity) values(item,payload->>'kind',payload->>'title',payload->>'body',coalesce(payload->>'image_path',''),nullif(payload->>'location_id','')::uuid,coalesce((payload->>'published')::boolean,false),coalesce(nullif(payload->>'starts_at','')::timestamptz,now()),nullif(payload->>'ends_at','')::timestamptz,nullif(payload->>'capacity','')::integer)
    on conflict(id) do update set kind=excluded.kind,title=excluded.title,body=excluded.body,image_path=excluded.image_path,location_id=excluded.location_id,published=excluded.published,starts_at=excluded.starts_at,ends_at=excluded.ends_at,capacity=excluded.capacity;
  when 'member' then
    if payload->>'status' not in ('active','suspended') then raise exception 'CLUB_INPUT'; end if;
    update public.club_memberships set status=payload->>'status',revision=revision+1 where id=item and status<>'closed';
    if not found then raise exception 'CLUB_NOT_FOUND'; end if;
  when 'staff_role' then
    target:=(payload->>'user_id')::uuid;
    if payload->>'role'='none' then delete from public.club_staff_roles where user_id=target and location_id=(payload->>'location_id')::uuid;
    else
      insert into public.club_staff_roles(user_id,location_id,role) values(target,(payload->>'location_id')::uuid,payload->>'role') on conflict(user_id,location_id) do update set role=excluded.role;
    end if;
    item:=target;
  when 'deletion' then
    if payload->>'status'<>'processing' then raise exception 'CLUB_INPUT'; end if;
    update public.club_deletion_requests set status='processing' where id=item and status='pending';
  else raise exception 'CLUB_INPUT';
  end case;
  insert into public.club_audit(actor_id,operation,reference) values(auth.uid(),'admin.'||entity,item);
  return item;
end; $$;

create function public.club_admin_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.club_is_admin() then raise exception 'CLUB_FORBIDDEN'; end if;
  return jsonb_build_object(
    'locations',coalesce((select jsonb_agg(l order by l.name) from public.club_locations l),'[]'),
    'drinks',coalesce((select jsonb_agg(d order by d.name) from public.club_drinks d),'[]'),
    'variants',coalesce((select jsonb_agg(v) from public.club_drink_variants v),'[]'),
    'rewards',coalesce((select jsonb_agg(r order by r.points) from public.club_rewards r),'[]'),
    'rules',coalesce((select jsonb_agg(r) from public.club_rules r),'[]'),
    'content',coalesce((select jsonb_agg(c order by c.starts_at desc) from public.club_content c),'[]'),
    'staff',coalesce((select jsonb_agg(jsonb_build_object('user_id',s.user_id,'name',s.first_name||' '||s.last_name,'active',s.active)) from public.staff_members s),'[]'),
    'roles',coalesce((select jsonb_agg(r) from public.club_staff_roles r),'[]'),
    'members',coalesce((select jsonb_agg(m) from (select m.id,m.member_number,m.status,m.joined_at,p.first_name,p.last_name from public.club_memberships m left join public.profiles p on p.id=m.user_id order by m.joined_at desc limit 200) m),'[]'),
    'deletions',coalesce((select jsonb_agg(d) from (select d.id,d.status,d.created_at,m.member_number from public.club_deletion_requests d left join public.club_memberships m on m.user_id=d.user_id order by d.created_at desc limit 200) d),'[]'),
    'audit',coalesce((select jsonb_agg(a) from (select * from public.club_audit order by created_at desc limit 100) a),'[]'),
    'metrics',jsonb_build_object('active_members',(select count(*) from public.club_memberships where status='active'),
      'awarded_30_days',(select coalesce(sum(amount),0) from public.loyalty_entries where kind='award' and created_at>=now()-interval '30 days'),
      'fulfilled_30_days',(select count(*) from public.club_redemptions where status='fulfilled' and fulfilled_at>=now()-interval '30 days'),
      'since',now()-interval '30 days','until',now())
  );
end; $$;

create function public.club_export() returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();
begin
  perform public.club_limit('export');
  if me is null or not public.lacaccino_email_confirmed() then raise exception 'CLUB_AUTH'; end if;
  return jsonb_build_object('exported_at',now(),'club',public.club_snapshot(),
    'points',coalesce((select jsonb_agg(e) from (select amount,reason,kind,created_at,idempotency_key from public.loyalty_entries where user_id=me) e),'[]'),
    'newsletter_history',coalesce((select jsonb_agg(e) from public.newsletter_events e where user_id=me),'[]'),
    'waitlist',(select to_jsonb(w) from public.waitlist_entries w where user_id=me),
    'orders',coalesce((select jsonb_agg(to_jsonb(o)||jsonb_build_object('items',(select jsonb_agg(i) from public.shop_order_items i where i.order_id=o.id))) from public.shop_orders o where user_id=me),'[]'),
    'coupons',coalesce((select jsonb_agg(c) from public.customer_coupons c where user_id=me),'[]'),
    'notifications',coalesce((select jsonb_agg(n) from public.club_notifications n where user_id=me),'[]'),
    'deletion_requests',coalesce((select jsonb_agg(d) from public.club_deletion_requests d where user_id=me),'[]'));
end; $$;
do $$ declare f record; begin
  for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname like 'club\_%' escape '\' loop
    execute 'revoke all on function '||f.signature||' from public,anon';
    execute 'grant execute on function '||f.signature||' to authenticated';
  end loop;
end $$;
commit;
