insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('mp_public_key', '', 'mercadopago', false,
   'Public Key MP',
   'Necessária pro MP Bricks (frontend). Pega em www.mercadopago.com.br/developers → sua app → Credenciais. Começa com APP_USR- (produção) ou TEST- (sandbox).',
   4)
on conflict (key) do nothing;

update public.app_settings set value = 'true' where key = 'mp_enabled';
update public.app_settings set value = 'false' where key = 'asaas_enabled';

alter table public.orders add column if not exists mp_preference_id text;
alter table public.orders add column if not exists mp_payment_id text;
alter table public.orders add column if not exists mp_payment_status text;
alter table public.orders add column if not exists mp_payment_method text;

create index if not exists idx_orders_mp_payment_id on public.orders(mp_payment_id) where mp_payment_id is not null;