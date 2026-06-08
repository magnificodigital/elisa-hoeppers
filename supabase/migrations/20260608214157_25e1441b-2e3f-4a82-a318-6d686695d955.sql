CREATE OR REPLACE FUNCTION public.get_public_setting(p_key text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value
  FROM public.app_settings
  WHERE key = p_key
    AND is_secret = false
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_setting(text) TO anon, authenticated;