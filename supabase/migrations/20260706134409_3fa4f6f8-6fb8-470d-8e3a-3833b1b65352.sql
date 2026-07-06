GRANT SELECT ON public.product_rituals TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_rituals TO authenticated;
GRANT ALL ON public.product_rituals TO service_role;