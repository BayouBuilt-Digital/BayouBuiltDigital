-- 0002 — Seed the Stashy product + price, and add read-own RLS policies for the
-- store tables. Safe to run more than once.
--
-- Enum values used below already exist in this project:
--   product_type = 'digital', order_status = 'paid', entitlement_source = 'order'
--
-- Apply via the Supabase SQL editor.

-- ── Seed: Stashy ────────────────────────────────────────────────────
insert into public.products (slug, name, description, type, active)
values (
  'stashy',
  'Stashy',
  'A local-first snippet manager — capture, organize, search, and reuse your code snippets, all stored on your own machine.',
  'digital',
  true
)
on conflict (slug) do nothing;

-- One-time price: $12.00 USD (1200 cents). Edit unit_amount to change pricing.
insert into public.prices (product_id, unit_amount, currency, active)
select p.id, 1200, 'usd', true
from public.products p
where p.slug = 'stashy'
  and not exists (select 1 from public.prices pr where pr.product_id = p.id);

-- ── RLS: public can read the active catalog ─────────────────────────
drop policy if exists "products_read_active" on public.products;
create policy "products_read_active"
  on public.products for select
  using (active = true);

drop policy if exists "prices_read_active" on public.prices;
create policy "prices_read_active"
  on public.prices for select
  using (active = true);

-- ── RLS: a user can read only their own orders / items / entitlements ─
-- (The server fulfills purchases with the service-role key, which bypasses RLS;
--  these policies are for any future user-scoped, anon-key reads.)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (customer_id in (select id from public.customers where user_id = auth.uid()));

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  using (
    order_id in (
      select o.id from public.orders o
      join public.customers c on c.id = o.customer_id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
  on public.entitlements for select
  using (customer_id in (select id from public.customers where user_id = auth.uid()));
