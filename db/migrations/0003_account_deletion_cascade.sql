-- 0003 — Make account deletion clean. Deleting a user from auth.users already
-- cascades to public.customers (customers_user_id_fkey is ON DELETE CASCADE),
-- and from customers to entitlements / download_events / order_items. But three
-- FKs on customer_id are ON DELETE RESTRICT, which would block the cascade once a
-- customer has any of those rows. Switch them to CASCADE so deleting the auth
-- user fully removes the customer's data in one shot.
--
-- Apply via the Supabase SQL editor.

alter table public.orders
  drop constraint orders_customer_id_fkey,
  add constraint orders_customer_id_fkey
    foreign key (customer_id) references public.customers(id) on delete cascade;

alter table public.subscriptions
  drop constraint subscriptions_customer_id_fkey,
  add constraint subscriptions_customer_id_fkey
    foreign key (customer_id) references public.customers(id) on delete cascade;

alter table public.invoices
  drop constraint invoices_customer_id_fkey,
  add constraint invoices_customer_id_fkey
    foreign key (customer_id) references public.customers(id) on delete cascade;
