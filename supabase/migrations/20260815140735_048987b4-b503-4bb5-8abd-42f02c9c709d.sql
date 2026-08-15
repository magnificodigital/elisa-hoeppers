-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_secret BOOLEAN NOT NULL DEFAULT false,
    label TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant access to authenticated and anon (for non-secrets)
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for public read of non-secret settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read of non-secret settings') THEN
        CREATE POLICY "Public read of non-secret settings"
        ON public.app_settings
        FOR SELECT
        TO anon, authenticated
        USING (NOT is_secret);
    END IF;
END $$;

-- Policy for service_role to manage everything
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages all settings') THEN
        CREATE POLICY "Service role manages all settings"
        ON public.app_settings
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Function to read public settings safely from client
CREATE OR REPLACE FUNCTION public.get_public_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = p_key AND NOT is_secret;
$$;

-- Seed default settings if missing
INSERT INTO public.app_settings (key, value, category, label, is_secret)
VALUES 
('whatsapp_enabled', 'true', 'whatsapp', 'Habilitar WhatsApp', false),
('whatsapp_phone', '5511994061178', 'whatsapp', 'Número WhatsApp', false),
('whatsapp_position', 'right', 'whatsapp', 'Posição do Botão', false),
('seo_title', 'BODYOGA — Corpo, mente e ambiente em equilíbrio', 'seo', 'Título do Site', false),
('seo_description', 'Cosméticos naturais artesanais com óleos essenciais criados por Elisa Hoeppers Casas.', 'seo', 'Descrição do Site', false)
ON CONFLICT (key) DO NOTHING;
