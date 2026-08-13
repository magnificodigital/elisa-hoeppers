create table if not exists public.payment_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.payment_secrets to authenticated;
grant all on public.payment_secrets to service_role;

alter table public.payment_secrets enable row level security;

drop policy if exists "admins manage payment_secrets" on public.payment_secrets;
create policy "admins manage payment_secrets"
on public.payment_secrets
for all
to authenticated
using ( public.current_user_role() = 'admin' )
with check ( public.current_user_role() = 'admin' );