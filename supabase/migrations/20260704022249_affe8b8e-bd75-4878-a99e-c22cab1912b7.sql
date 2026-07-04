alter table public.profiles add column if not exists saved_addresses jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists payment_method_type text;
alter table public.orders add column if not exists payment_installments int;