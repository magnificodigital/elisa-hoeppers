
create table if not exists public.processed_mp_payments (
  payment_id text primary key,
  processed_at timestamptz not null default now(),
  order_id uuid references public.orders(id) on delete set null,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  status text,
  raw jsonb
);

create index if not exists idx_processed_mp_payments_at on public.processed_mp_payments(processed_at desc);

grant all on public.processed_mp_payments to service_role;

alter table public.processed_mp_payments enable row level security;
