ALTER TABLE public.bodyoga_slides
  ADD COLUMN IF NOT EXISTS show_nav boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS media_href text;