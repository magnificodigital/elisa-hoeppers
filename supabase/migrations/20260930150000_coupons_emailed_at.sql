-- send-coupon-email: controle de reenvio
alter table public.coupons add column if not exists emailed_at timestamptz;
