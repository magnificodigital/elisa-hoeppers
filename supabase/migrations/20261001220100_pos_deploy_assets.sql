-- Aplicada em 01/10/2026, após a publicação do site novo no Cloudflare.
-- Tira do banco as últimas referências a arquivos hospedados pelo Lovable (/__l5e/ e r2.dev),
-- que deixam de existir quando o Lovable for desligado. Arquivos já estão em public/assets/.
update public.email_templates
   set html = replace(html, 'https://bodyogaoficial.com.br/__l5e/assets-v1/20aa83d7-e4d0-45c3-a8c7-02d231e4c53b/logo-bodyoga.png', 'https://bodyogaoficial.com.br/assets/bodyoga/logo-bodyoga.png'),
       design_json = replace(design_json::text, 'https://bodyogaoficial.com.br/__l5e/assets-v1/20aa83d7-e4d0-45c3-a8c7-02d231e4c53b/logo-bodyoga.png', 'https://bodyogaoficial.com.br/assets/bodyoga/logo-bodyoga.png')::jsonb
 where html like '%/__l5e/%' or design_json::text like '%/__l5e/%';

update public.bodyoga_slides
   set video_url = '/assets/bodyoga/bodyoga-hero.mp4'
 where video_url = '/__l5e/assets-v1/1537eece-e849-4a10-8c46-0d7f45783e06/bodyoga-hero.mp4';

update public.app_settings
   set value = replace(value, 'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6474f842-ef2b-4137-8e09-79fe713d4d20/id-preview-8c55f742--b7748712-f4ec-441a-90e1-9d53676b9255.lovable.app-1779730472117.png', 'https://bodyogaoficial.com.br/assets/bodyoga/og-bodyoga.png')
 where key = 'seo';
