CREATE TABLE public.bodyoga_rituals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bodyoga_rituals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bodyoga_rituals TO authenticated;
GRANT ALL ON public.bodyoga_rituals TO service_role;

ALTER TABLE public.bodyoga_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bodyoga_rituals_public_read" ON public.bodyoga_rituals
  FOR SELECT USING (is_active OR (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role])));

CREATE POLICY "bodyoga_rituals_write_staff" ON public.bodyoga_rituals
  FOR ALL
  USING (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]))
  WITH CHECK (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]));

CREATE TRIGGER touch_bodyoga_rituals_updated_at
  BEFORE UPDATE ON public.bodyoga_rituals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.products
  ADD COLUMN ritual_id uuid REFERENCES public.bodyoga_rituals(id) ON DELETE SET NULL;

INSERT INTO public.bodyoga_rituals (slug, title, description, display_order) VALUES
  ('corpo', 'Rituais do Corpo', 'Cuidado e presença no gesto de cuidar da pele e do toque.', 1),
  ('mente', 'Rituais da Mente', 'Aromas que acalmam, equilibram e trazem foco e tranquilidade.', 2),
  ('ambiente', 'Rituais do Ambiente', 'Sprays aromáticos que harmonizam e perfumam cada espaço.', 3);