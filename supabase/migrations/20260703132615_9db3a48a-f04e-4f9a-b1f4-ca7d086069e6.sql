ALTER TABLE public.bodyoga_slides ADD COLUMN IF NOT EXISTS video_url text;

INSERT INTO public.bodyoga_slides (title, subtitle, cta_label, cta_href, image_url, video_url, display_order, is_active, duration_seconds)
VALUES ('Vídeo de apresentação', NULL, 'Agende sua aula', '/agendar', NULL, 'https://www.youtube.com/embed/h5ztu79aj4k', 2, true, 7);