-- Create app_settings table for SEO and Global Configs
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT ON public.app_settings TO anon;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to app_settings"
    ON public.app_settings FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow admins full access to app_settings"
    ON public.app_settings FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.app_settings (key, value)
VALUES 
('seo', '{
    "default_title": "BODYOGA — Corpo, mente e ambiente em equilíbrio",
    "default_description": "Professora de Yoga, fundadora do BODYOGA e perfumista. Movimente seu corpo, cuide da sua mente.",
    "og_image": "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6474f842-ef2b-4137-8e09-79fe713d4d20/id-preview-8c55f742--b7748712-f4ec-441a-90e1-9d53676b9255.lovable.app-1779730472117.png",
    "ga_id": "G-P23P1WM8K3",
    "gtm_id": "",
    "search_console_id": ""
}'),
('whatsapp', '{
    "enabled": true,
    "phone": "5511999999999",
    "message": "Olá! Gostaria de saber mais sobre os produtos da BODYOGA.",
    "bubble_text": "Fale conosco 💬",
    "position": "right"
}')
ON CONFLICT (key) DO NOTHING;
