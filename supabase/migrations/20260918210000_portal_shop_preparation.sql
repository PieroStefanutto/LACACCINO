begin;

-- Checkout writes are server-only. These are snapshots, not a public product catalogue.
create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique check(char_length(order_number) between 1 and 80),
  status text not null default 'pending' check(status in ('pending','paid','shipped','completed','cancelled','refunded')),
  currency text not null default 'EUR' check(currency = 'EUR'),
  total_cents integer not null check(total_cents >= 0),
  created_at timestamptz not null default now()
);
create index shop_orders_customer_date on public.shop_orders(user_id,created_at desc);
create table public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_key text not null check(char_length(product_key) between 1 and 120),
  product_name text not null check(char_length(product_name) between 1 and 200),
  variant_name text not null default '' check(char_length(variant_name) <= 160),
  quantity integer not null check(quantity between 1 and 100000),
  unit_price_cents integer not null check(unit_price_cents >= 0)
);
create index shop_order_items_order on public.shop_order_items(order_id);
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;
revoke all on public.shop_orders, public.shop_order_items from anon, authenticated;
grant select on public.shop_orders, public.shop_order_items to authenticated;
grant all on public.shop_orders, public.shop_order_items to service_role;
create policy "Read own orders" on public.shop_orders for select to authenticated using(user_id = (select auth.uid()));
create policy "Read own order items" on public.shop_order_items for select to authenticated using(exists(select 1 from public.shop_orders o where o.id = order_id and o.user_id = (select auth.uid())));

create function public.portal_favourite_products(page_offset integer default 0)
returns table(product_key text, product_name text, variant_name text, quantity bigint, last_ordered_at timestamptz)
language sql stable security invoker set search_path = ''
as $$
  select i.product_key, (array_agg(i.product_name order by o.created_at desc,i.id))[1],
    i.variant_name, sum(i.quantity), max(o.created_at)
  from public.shop_order_items i join public.shop_orders o on o.id = i.order_id
  where o.user_id = (select auth.uid()) and o.status in ('paid','shipped','completed')
  group by i.product_key,i.variant_name
  order by max(o.created_at) desc,i.product_key,i.variant_name
  limit 50 offset greatest(0,least(coalesce(page_offset,0),100000));
$$;
revoke all on function public.portal_favourite_products(integer) from public, anon;
grant execute on function public.portal_favourite_products(integer) to authenticated;

create table public.customer_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_slot smallint not null check(offer_slot between 1 and 5),
  discount_percent smallint not null,
  minimum_cents integer not null,
  code text not null unique default ('LC-' || upper(replace(gen_random_uuid()::text,'-',''))),
  activated_at timestamptz,
  redeemed_at timestamptz,
  redeemed_order_id uuid unique references public.shop_orders(id),
  created_at timestamptz not null default now(),
  unique(user_id,offer_slot),
  check((offer_slot between 1 and 3 and discount_percent = 10 and minimum_cents = 5000)
    or (offer_slot = 4 and discount_percent = 15 and minimum_cents = 15000)
    or (offer_slot = 5 and discount_percent = 20 and minimum_cents = 50000)),
  check((redeemed_at is null and redeemed_order_id is null) or (redeemed_at is not null and redeemed_order_id is not null and activated_at is not null))
);
alter table public.customer_coupons enable row level security;
revoke all on public.customer_coupons from anon, authenticated;
grant select on public.customer_coupons to authenticated;
grant all on public.customer_coupons to service_role;
create policy "Read own coupons" on public.customer_coupons for select to authenticated using(user_id = (select auth.uid()));

create function public.portal_issue_coupons(customer_id uuid)
returns void language sql security definer set search_path = ''
as $$
  insert into public.customer_coupons(user_id,offer_slot,discount_percent,minimum_cents)
    select customer_id, v.slot, v.percent, v.minimum from
      (values(1,10,5000),(2,10,5000),(3,10,5000),(4,15,15000),(5,20,50000)) v(slot,percent,minimum)
    where exists(select 1 from auth.users where id = customer_id and email_confirmed_at is not null)
      and not exists(select 1 from public.portal_admins where user_id = customer_id)
    on conflict(user_id,offer_slot) do nothing;
$$;
revoke all on function public.portal_issue_coupons(uuid) from public,anon,authenticated;
grant execute on function public.portal_issue_coupons(uuid) to service_role;

create function public.portal_coupons_on_confirmation()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  if new.email_confirmed_at is not null then perform public.portal_issue_coupons(new.id); end if;
  return new;
end; $$;
revoke all on function public.portal_coupons_on_confirmation() from public,anon,authenticated;
create trigger portal_coupons_initialized after insert or update of email_confirmed_at on auth.users
  for each row execute function public.portal_coupons_on_confirmation();
select public.portal_issue_coupons(id) from auth.users where email_confirmed_at is not null;

create function public.portal_activate_coupon(coupon_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$ begin
  if auth.uid() is null or not public.lacaccino_email_confirmed()
    or exists(select 1 from public.portal_admins where user_id = auth.uid()) then raise exception 'Verified customer required'; end if;
  update public.customer_coupons set activated_at = coalesce(activated_at,now())
    where id = coupon_id and user_id = auth.uid() and redeemed_at is null;
  if not found then raise exception 'Coupon unavailable'; end if;
end; $$;
revoke all on function public.portal_activate_coupon(uuid) from public,anon;
grant execute on function public.portal_activate_coupon(uuid) to authenticated;

-- Reusable quote for the future trusted checkout, never a client-side price decision.
-- The shop must supply its own server-calculated goods subtotal, excluding delivery.
-- Redemption/payment/refund transactions must be integrated before opening the shop.
create function public.portal_coupon_quote(customer_id uuid, coupon_code text, goods_subtotal_cents integer)
returns integer language plpgsql stable security definer set search_path = ''
as $$ declare offer public.customer_coupons%rowtype; begin
  select * into offer from public.customer_coupons where user_id = customer_id and code = coupon_code;
  if not found or offer.activated_at is null or offer.redeemed_at is not null
    or goods_subtotal_cents is null or goods_subtotal_cents < offer.minimum_cents then raise exception 'Coupon unavailable'; end if;
  return floor(goods_subtotal_cents::numeric * offer.discount_percent / 100)::integer;
end; $$;
revoke all on function public.portal_coupon_quote(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.portal_coupon_quote(uuid,text,integer) to service_role;

commit;
