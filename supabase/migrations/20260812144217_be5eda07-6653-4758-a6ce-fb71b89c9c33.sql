CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content_md text NOT NULL DEFAULT '',
  hero_image text,
  seo_title text,
  seo_description text,
  is_published boolean NOT NULL DEFAULT false,
  show_in_menu boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published pages"
  ON public.pages FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins manage pages"
  ON public.pages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER touch_pages BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_settings (key, value, category, is_secret, label, description, display_order) VALUES
  ('home_intro_title', 'BODYOGA é a\nfusão entre *yoga* e\ncuidado consciente.', 'home', false, 'Título da apresentação', 'Use quebras de linha para separar as linhas e *asteriscos* para deixar em itálico.', 10),
  ('home_intro_p1', 'Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.', 'home', false, 'Parágrafo 1', 'Texto de destaque logo abaixo do título.', 20),
  ('home_intro_p2', 'Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.', 'home', false, 'Parágrafo 2', 'Texto de apoio.', 30),
  ('home_intro_cta_label', 'Harmonia & Equilíbrio', 'home', false, 'Texto do botão', 'Deixe em branco para esconder o botão.', 40),
  ('home_intro_cta_href', '/sobre', 'home', false, 'Link do botão', 'Endereço para onde o botão leva.', 50),
  ('home_intro_image', '/images/home/bodyoga/bodyoga-left.png', 'home', false, 'Imagem da seção', 'Imagem exibida ao lado do texto.', 60),
  ('theme_primary', '#3B4F30', 'aparencia', false, 'Verde principal', 'Cor de textos, botões e header.', 10),
  ('theme_primary_dark', '#334C31', 'aparencia', false, 'Verde escuro', 'Usado em hover e títulos.', 20),
  ('theme_cream', '#F6E9D6', 'aparencia', false, 'Creme (fundo)', 'Fundo geral do site.', 30),
  ('theme_sand', '#DBCCBF', 'aparencia', false, 'Areia', 'Bordas e divisórias.', 40),
  ('theme_peach', '#FFD7AC', 'aparencia', false, 'Pêssego', 'Destaques e selos.', 50)
ON CONFLICT (key) DO NOTHING;