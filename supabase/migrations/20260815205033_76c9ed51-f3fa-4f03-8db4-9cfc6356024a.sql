insert into public.pages (title, slug, status, is_home, in_menu, content_blocks)
select
  'Home',
  'home',
  'draft',
  not exists (select 1 from public.pages where is_home = true),
  false,
  '[
    { "id": "b_hero",    "type": "home-hero",    "props": {} },
    { "id": "b_opening", "type": "home-opening", "props": { "title": "Equilíbrio para o corpo,\nmente e ambiente." } },
    { "id": "b_rituals", "type": "home-rituals", "props": {} },
    { "id": "b_intro",   "type": "home-intro",   "props": {} },
    { "id": "b_blog",    "type": "home-blog",    "props": {} },
    { "id": "b_insta",   "type": "instagram",    "props": {} }
  ]'::jsonb
where not exists (select 1 from public.pages where slug = 'home');