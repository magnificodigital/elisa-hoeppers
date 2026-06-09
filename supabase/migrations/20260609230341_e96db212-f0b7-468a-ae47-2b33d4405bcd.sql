alter table public.enrollments add column if not exists payment_preference_id text;
alter table public.enrollments add column if not exists paid_cents int;

comment on column public.enrollments.status is 'active | pending_payment | completed | cancelled';

create index if not exists idx_enrollments_payment_preference on public.enrollments(payment_preference_id) where payment_preference_id is not null;