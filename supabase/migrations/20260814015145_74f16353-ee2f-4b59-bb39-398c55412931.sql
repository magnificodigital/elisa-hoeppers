create table if not exists public.product_waitlist (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  whatsapp text not null,
  notified boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, email)
);

alter table public.product_waitlist enable row level security;

grant insert on public.product_waitlist to anon, authenticated;
grant select, update, delete on public.product_waitlist to authenticated;
grant all on public.product_waitlist to service_role;

create policy "public can join waitlist"
  on public.product_waitlist for insert
  to anon, authenticated
  with check (true);

create policy "admins manage waitlist"
  on public.product_waitlist for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
