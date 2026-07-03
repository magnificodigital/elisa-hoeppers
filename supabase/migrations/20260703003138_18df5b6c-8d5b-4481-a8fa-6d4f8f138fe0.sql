CREATE TABLE public.bodyoga_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  subtitle text,
  cta_label text,
  cta_href text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bodyoga_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bodyoga_slides TO authenticated;
GRANT ALL ON public.bodyoga_slides TO service_role;

ALTER TABLE public.bodyoga_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY bodyoga_slides_public_read ON public.bodyoga_slides
  FOR SELECT
  USING (is_active OR (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role])));

CREATE POLICY bodyoga_slides_write_staff ON public.bodyoga_slides
  FOR ALL
  USING (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]))
  WITH CHECK (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]));

CREATE TRIGGER touch_bodyoga_slides_updated_at
  BEFORE UPDATE ON public.bodyoga_slides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();