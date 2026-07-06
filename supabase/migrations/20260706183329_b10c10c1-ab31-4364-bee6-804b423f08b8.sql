ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_order_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_marketing boolean NOT NULL DEFAULT true;