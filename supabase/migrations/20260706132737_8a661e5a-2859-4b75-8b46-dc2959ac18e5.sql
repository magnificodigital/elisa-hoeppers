CREATE TABLE public.product_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reservations TO authenticated;
GRANT INSERT ON public.product_reservations TO anon;
GRANT ALL ON public.product_reservations TO service_role;

ALTER TABLE public.product_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_reservations_public_insert ON public.product_reservations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY product_reservations_staff_read ON public.product_reservations
  FOR SELECT
  USING (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]));

CREATE POLICY product_reservations_staff_write ON public.product_reservations
  FOR ALL
  USING (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]))
  WITH CHECK (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]));

CREATE TRIGGER trg_product_reservations_touch
  BEFORE UPDATE ON public.product_reservations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();