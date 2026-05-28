UPDATE public.courses
SET cover_image = regexp_replace(cover_image, '\.png$', '.webp')
WHERE cover_image LIKE '/images/courses/%.png';

UPDATE public.products
SET gallery = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'url' AND elem->>'url' LIKE '/images/products/%.png'
        THEN jsonb_set(elem, '{url}', to_jsonb(regexp_replace(elem->>'url', '\.png$', '.webp')))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(gallery) AS elem
)
WHERE gallery IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(gallery) e
    WHERE e->>'url' LIKE '/images/products/%.png'
  );