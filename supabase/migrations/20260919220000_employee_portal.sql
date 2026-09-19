begin;

create table public.staff_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  first_name text not null check(char_length(first_name) between 1 and 80),
  last_name text not null check(char_length(last_name) between 1 and 80),
  email text not null,
  hourly_cents integer not null check(hourly_cents between 0 and 100000),
  work_days integer[] not null default array[1,2,3,4,5] check(cardinality(work_days) between 1 and 7 and work_days <@ array[1,2,3,4,5,6,7]),
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.staff_allowances (
  user_id uuid not null references public.staff_members(user_id) on delete cascade,
  year integer not null check(year between 2020 and 2100),
  days numeric(5,1) not null check(days between 0 and 366),
  primary key(user_id,year)
);
create table public.staff_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.staff_members(user_id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  break_seconds integer not null default 0 check(break_seconds >= 0),
  break_started_at timestamptz,
  hourly_cents integer not null check(hourly_cents between 0 and 100000),
  source text not null check(source in ('clock','manual')),
  voided boolean not null default false,
  note text not null default '' check(char_length(note)<=300),
  created_at timestamptz not null default now(),
  check(ended_at is null or (ended_at > started_at and break_seconds <= extract(epoch from ended_at-started_at))),
  check(break_started_at is null or (ended_at is null and break_started_at >= started_at))
);
create unique index staff_one_open_shift on public.staff_time_entries(user_id) where ended_at is null and not voided;
create index staff_time_history on public.staff_time_entries(user_id,started_at desc);
create table public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.staff_members(user_id) on delete cascade,
  kind text not null check(kind in ('vacation','sick')),
  starts_on date not null,
  ends_on date not null,
  days numeric(5,1) not null check(days between 0 and 366),
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  response text not null default '' check(char_length(response)<=300),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check(ends_on >= starts_on and extract(year from starts_on)=extract(year from ends_on))
);
create index staff_request_inbox on public.staff_requests(status,created_at desc);
create table public.staff_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.staff_members(user_id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event text not null,
  record_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create function public.staff_enabled() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.staff_members where user_id=auth.uid() and active and not must_change_password);
$$;
revoke all on function public.staff_enabled() from public,anon;
grant execute on function public.staff_enabled() to authenticated;

alter table public.staff_members enable row level security;
alter table public.staff_allowances enable row level security;
alter table public.staff_time_entries enable row level security;
alter table public.staff_requests enable row level security;
alter table public.staff_audit enable row level security;
revoke all on public.staff_members,public.staff_allowances,public.staff_time_entries,public.staff_requests,public.staff_audit from anon,authenticated;
grant select on public.staff_members,public.staff_allowances,public.staff_time_entries,public.staff_requests,public.staff_audit to authenticated;
grant all on public.staff_members,public.staff_allowances,public.staff_time_entries,public.staff_requests,public.staff_audit to service_role;
grant usage,select on sequence public.staff_audit_id_seq to service_role;
create policy "Staff identity" on public.staff_members for select to authenticated using(user_id=(select auth.uid()) or (select public.portal_is_admin()));
create policy "Staff allowances" on public.staff_allowances for select to authenticated using((user_id=(select auth.uid()) and (select public.staff_enabled())) or (select public.portal_is_admin()));
create policy "Staff hours" on public.staff_time_entries for select to authenticated using((user_id=(select auth.uid()) and (select public.staff_enabled())) or (select public.portal_is_admin()));
create policy "Staff absences" on public.staff_requests for select to authenticated using((user_id=(select auth.uid()) and (select public.staff_enabled())) or (select public.portal_is_admin()));
create policy "Staff audit" on public.staff_audit for select to authenticated using((select public.portal_is_admin()));

create function public.staff_find_account(account_email text) returns uuid language plpgsql security definer set search_path='' as $$
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  return (select id from auth.users where lower(email)=lower(trim(account_email)) limit 1);
end; $$;

create function public.staff_configure(target_user uuid, given_name text, family_name text, rate_cents integer, weekdays integer[], allowance_year integer, allowance_days numeric, enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
declare account_email text; previous public.staff_members%rowtype; used numeric;
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  if target_user is null or exists(select 1 from public.portal_admins where user_id=target_user) then raise exception 'Employee account required'; end if;
  select email into account_email from auth.users where id=target_user and email_confirmed_at is not null for update;
  if account_email is null then raise exception 'Account required'; end if;
  select * into previous from public.staff_members where user_id=target_user for update;
  if enabled=false and exists(select 1 from public.staff_time_entries where user_id=target_user and ended_at is null and not voided) then raise exception 'Open shift'; end if;
  select coalesce(sum(days),0) into used from public.staff_requests where user_id=target_user and kind='vacation' and status='approved' and extract(year from starts_on)=allowance_year;
  if allowance_days is null or allowance_days < used then raise exception 'Allowance below used days'; end if;
  insert into public.staff_members(user_id,first_name,last_name,email,hourly_cents,work_days,active)
    values(target_user,trim(given_name),trim(family_name),account_email,rate_cents,weekdays,enabled)
    on conflict(user_id) do update set first_name=excluded.first_name,last_name=excluded.last_name,hourly_cents=excluded.hourly_cents,work_days=excluded.work_days,active=excluded.active;
  insert into public.staff_allowances(user_id,year,days) values(target_user,allowance_year,allowance_days)
    on conflict(user_id,year) do update set days=excluded.days;
  insert into public.staff_audit(user_id,actor_id,event,details) values(target_user,auth.uid(),'settings',jsonb_build_object('old_rate',previous.hourly_cents,'new_rate',rate_cents,'year',allowance_year,'allowance',allowance_days,'active',enabled));
end; $$;

create function public.staff_clock(operation text, entry_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare employee public.staff_members%rowtype; entry public.staff_time_entries%rowtype; stamp timestamptz:=clock_timestamp();
begin
  select * into employee from public.staff_members where user_id=auth.uid() for update;
  if not found or not employee.active or employee.must_change_password then raise exception 'Staff required'; end if;
  stamp:=clock_timestamp();
  if operation='start' then
    select * into entry from public.staff_time_entries where user_id=auth.uid() and ended_at is null and not voided;
    if found then return entry.id; end if;
    if entry_id is null then raise exception 'Entry ID required'; end if;
    if exists(select 1 from public.staff_time_entries where id=entry_id and user_id=auth.uid()) then return entry_id; end if;
    insert into public.staff_time_entries(id,user_id,started_at,hourly_cents,source) values(entry_id,auth.uid(),stamp,employee.hourly_cents,'clock');
  else
    select * into entry from public.staff_time_entries where id=entry_id and user_id=auth.uid() and not voided for update;
    if not found then raise exception 'Entry missing'; end if;
    if entry.ended_at is not null then return entry.id; end if;
    if operation='pause' and entry.break_started_at is null then
      update public.staff_time_entries set break_started_at=stamp where id=entry.id;
    elsif operation='resume' and entry.break_started_at is not null then
      update public.staff_time_entries set break_seconds=break_seconds+floor(extract(epoch from stamp-break_started_at))::integer,break_started_at=null where id=entry.id;
    elsif operation='stop' then
      update public.staff_time_entries set ended_at=stamp,break_seconds=break_seconds+case when break_started_at is null then 0 else floor(extract(epoch from stamp-break_started_at))::integer end,break_started_at=null where id=entry.id;
    elsif operation not in ('pause','resume') then raise exception 'Invalid operation'; end if;
  end if;
  insert into public.staff_audit(user_id,actor_id,event,record_id) values(auth.uid(),auth.uid(),'clock_'||operation,entry_id);
  return entry_id;
end; $$;

create function public.staff_manual_time(entry_id uuid, target_user uuid, start_time timestamptz, end_time timestamptz, pause_minutes integer, explanation text)
returns void language plpgsql security definer set search_path='' as $$
declare employee public.staff_members%rowtype; previous public.staff_time_entries%rowtype;
begin
  if not public.portal_is_admin() and (target_user is distinct from auth.uid() or not public.staff_enabled()) then raise exception 'Staff required'; end if;
  select * into employee from public.staff_members where user_id=target_user for update;
  if not found or (not public.portal_is_admin() and (not employee.active or employee.must_change_password)) then raise exception 'Staff required'; end if;
  if entry_id is null or start_time is null or end_time is null or end_time<=start_time or end_time>now()+interval '1 minute' or end_time-start_time>interval '24 hours' or pause_minutes is null or pause_minutes<0 or pause_minutes*60>=extract(epoch from end_time-start_time) or char_length(trim(coalesce(explanation,''))) not between 3 and 300 then raise exception 'Invalid time'; end if;
  select * into previous from public.staff_time_entries where id=entry_id;
  if found then
    if previous.user_id=target_user and previous.started_at=start_time and previous.ended_at=end_time and previous.break_seconds=pause_minutes*60 then return; end if;
    raise exception 'Duplicate key';
  end if;
  if exists(select 1 from public.staff_time_entries where user_id=target_user and not voided and started_at<end_time and coalesce(ended_at,'infinity'::timestamptz)>start_time) then raise exception 'Time overlap'; end if;
  insert into public.staff_time_entries(id,user_id,started_at,ended_at,break_seconds,hourly_cents,source,note)
    values(entry_id,target_user,start_time,end_time,pause_minutes*60,employee.hourly_cents,'manual',trim(explanation));
  insert into public.staff_audit(user_id,actor_id,event,record_id) values(target_user,auth.uid(),'manual_time',entry_id);
end; $$;

create function public.staff_void_time(entry_id uuid, explanation text) returns void language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  if char_length(trim(coalesce(explanation,''))) not between 3 and 300 then raise exception 'Reason required'; end if;
  select user_id into target from public.staff_time_entries where id=entry_id;
  perform 1 from public.staff_members where user_id=target for update;
  update public.staff_time_entries set voided=true where id=entry_id and not voided;
  if found then insert into public.staff_audit(user_id,actor_id,event,record_id,details) values(target,auth.uid(),'void_time',entry_id,jsonb_build_object('reason',trim(explanation))); end if;
end; $$;

create function public.staff_request_absence(request_id uuid, absence_kind text, first_day date, last_day date) returns void language plpgsql security definer set search_path='' as $$
declare employee public.staff_members%rowtype; work_count integer;
begin
  select * into employee from public.staff_members where user_id=auth.uid() for update;
  if not found or not employee.active or employee.must_change_password then raise exception 'Staff required'; end if;
  if request_id is null or absence_kind not in ('vacation','sick') or absence_kind is null or first_day is null or last_day is null or last_day<first_day or extract(year from first_day)<>extract(year from last_day) or extract(year from first_day) not between 2020 and 2100 then raise exception 'Invalid dates'; end if;
  if exists(select 1 from public.staff_requests where id=request_id and user_id=auth.uid() and kind=absence_kind and starts_on=first_day and ends_on=last_day) then return; end if;
  if exists(select 1 from public.staff_requests where user_id=auth.uid() and kind=absence_kind and status in ('pending','approved') and starts_on<=last_day and ends_on>=first_day) then raise exception 'Absence overlap'; end if;
  select count(*) into work_count from generate_series(first_day::timestamp,last_day::timestamp,interval '1 day') d where extract(isodow from d)::integer=any(employee.work_days);
  if absence_kind='vacation' and work_count=0 then raise exception 'No work days'; end if;
  insert into public.staff_requests(id,user_id,kind,starts_on,ends_on,days) values(request_id,auth.uid(),absence_kind,first_day,last_day,case when absence_kind='vacation' then work_count else 0 end);
  insert into public.staff_audit(user_id,actor_id,event,record_id) values(auth.uid(),auth.uid(),'absence_submitted',request_id);
end; $$;

create function public.staff_review_absence(request_id uuid, decision text, charged_days numeric, reply text) returns void language plpgsql security definer set search_path='' as $$
declare request public.staff_requests%rowtype; target uuid; allowance numeric; used numeric;
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  select user_id into target from public.staff_requests where id=request_id;
  perform 1 from public.staff_members where user_id=target for update;
  select * into request from public.staff_requests where id=request_id for update;
  if not found or request.status<>'pending' then raise exception 'Request already reviewed'; end if;
  if decision is null or decision not in ('approved','rejected') or char_length(coalesce(reply,''))>300 then raise exception 'Invalid decision'; end if;
  if decision='rejected' and char_length(trim(coalesce(reply,'')))<3 then raise exception 'Reason required'; end if;
  if request.kind='vacation' and decision='approved' then
    if charged_days is null or charged_days<0 or charged_days>request.days or charged_days*2<>floor(charged_days*2) then raise exception 'Invalid days'; end if;
    if charged_days<>request.days and char_length(trim(coalesce(reply,'')))<3 then raise exception 'Reason required'; end if;
    select days into allowance from public.staff_allowances where user_id=target and year=extract(year from request.starts_on);
    select coalesce(sum(days),0) into used from public.staff_requests where user_id=target and kind='vacation' and status='approved' and extract(year from starts_on)=extract(year from request.starts_on);
    if allowance is null or used+charged_days>allowance then raise exception 'Insufficient leave'; end if;
  end if;
  update public.staff_requests set status=decision,days=case when kind='vacation' and decision='approved' then charged_days else days end,response=trim(coalesce(reply,'')),reviewed_by=auth.uid(),reviewed_at=now() where id=request_id;
  insert into public.staff_audit(user_id,actor_id,event,record_id,details) values(target,auth.uid(),'absence_'||decision,request_id,jsonb_build_object('days',charged_days,'response',trim(coalesce(reply,''))));
end; $$;

create function public.staff_cancel_absence(request_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare request public.staff_requests%rowtype;
begin
  if not public.staff_enabled() then raise exception 'Staff required'; end if;
  perform 1 from public.staff_members where user_id=auth.uid() for update;
  select * into request from public.staff_requests where id=request_id and user_id=auth.uid() for update;
  if not found or request.status<>'pending' then raise exception 'Pending request required'; end if;
  update public.staff_requests set status='cancelled' where id=request_id;
  insert into public.staff_audit(user_id,actor_id,event,record_id) values(auth.uid(),auth.uid(),'absence_cancelled',request_id);
end; $$;

revoke all on function public.staff_find_account(text),public.staff_configure(uuid,text,text,integer,integer[],integer,numeric,boolean),public.staff_clock(text,uuid),public.staff_manual_time(uuid,uuid,timestamptz,timestamptz,integer,text),public.staff_void_time(uuid,text),public.staff_request_absence(uuid,text,date,date),public.staff_review_absence(uuid,text,numeric,text),public.staff_cancel_absence(uuid) from public,anon;
grant execute on function public.staff_find_account(text),public.staff_configure(uuid,text,text,integer,integer[],integer,numeric,boolean),public.staff_clock(text,uuid),public.staff_manual_time(uuid,uuid,timestamptz,timestamptz,integer,text),public.staff_void_time(uuid,text),public.staff_request_absence(uuid,text,date,date),public.staff_review_absence(uuid,text,numeric,text),public.staff_cancel_absence(uuid) to authenticated;
commit;
