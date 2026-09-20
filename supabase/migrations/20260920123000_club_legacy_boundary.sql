begin;
-- Keep existing non-Club accounts compatible. A Club account must use the new
-- scoped, audited, MFA-protected ledger workflow rather than the older endpoint.
create or replace function public.portal_adjust_points(target_user uuid, points_delta integer, booking_reason text, request_key uuid)
returns bigint language plpgsql security definer set search_path='' as $$
declare current_balance bigint; existing public.loyalty_entries%rowtype;
begin
  if not public.portal_is_admin() then raise exception 'Admin required'; end if;
  if exists(select 1 from public.club_memberships where user_id=target_user) then raise exception 'CLUB_FORBIDDEN: Use Club service booking'; end if;
  if points_delta is null or points_delta=0 or abs(points_delta::bigint)>1000000 or booking_reason is null or char_length(trim(booking_reason)) not between 3 and 200 or request_key is null then raise exception 'Invalid booking'; end if;
  if not exists(select 1 from auth.users where id=target_user and email_confirmed_at is not null) or exists(select 1 from public.portal_admins where user_id=target_user) then raise exception 'Customer required'; end if;
  insert into public.loyalty_accounts(user_id) values(target_user) on conflict do nothing;
  select balance into current_balance from public.loyalty_accounts where user_id=target_user for update;
  select * into existing from public.loyalty_entries where idempotency_key=request_key;
  if found then
    if existing.user_id<>target_user or existing.amount<>points_delta or existing.reason<>trim(booking_reason) then raise exception 'Booking key already used'; end if;
    return current_balance;
  end if;
  if current_balance+points_delta<0 then raise exception 'Insufficient points'; end if;
  insert into public.loyalty_entries(user_id,amount,reason,idempotency_key,created_by) values(target_user,points_delta,trim(booking_reason),request_key,auth.uid());
  update public.loyalty_accounts set balance=balance+points_delta where user_id=target_user returning balance into current_balance;
  return current_balance;
end; $$;
commit;
