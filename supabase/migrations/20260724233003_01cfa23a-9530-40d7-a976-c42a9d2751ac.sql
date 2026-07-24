-- Email templates (drag-and-drop email builder)
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  design_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  html text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  system_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manages email_templates"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER touch_email_templates
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Broadcasts can reference a template
ALTER TABLE public.broadcasts
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS design_json jsonb;

-- Newsletter subscribers: admin management
DROP POLICY IF EXISTS "admin manages subscribers" ON public.newsletter_subscribers;
CREATE POLICY "admin manages subscribers"
  ON public.newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());