-- Setup User Roles first since it's missing or named differently
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Now the Pages migration
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'site',
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_home boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS in_menu boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS menu_order int;

UPDATE public.pages SET status = 'active' WHERE is_published = true;

CREATE UNIQUE INDEX IF NOT EXISTS pages_single_home ON public.pages (is_home) WHERE is_home = true;

GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads active pages" ON public.pages;
CREATE POLICY "public reads active pages"
  ON public.pages FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "admins manage pages" ON public.pages;
CREATE POLICY "admins manage pages"
  ON public.pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
