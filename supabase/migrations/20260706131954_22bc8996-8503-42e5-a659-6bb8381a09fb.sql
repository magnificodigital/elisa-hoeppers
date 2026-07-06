CREATE TABLE public.product_rituals (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ritual_id uuid NOT NULL REFERENCES public.bodyoga_rituals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, ritual_id)
);

GRANT SELECT ON public.product_rituals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_rituals TO authenticated;
GRANT ALL ON public.product_rituals TO service_role;

ALTER TABLE public.product_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_rituals_public_read ON public.product_rituals
  FOR SELECT USING (true);

CREATE POLICY product_rituals_write_staff ON public.product_rituals
  FOR ALL
  USING (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]))
  WITH CHECK (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]));

INSERT INTO public.product_rituals (product_id, ritual_id)
SELECT id, ritual_id FROM public.products WHERE ritual_id IS NOT NULL
ON CONFLICT DO NOTHING;