ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;

-- Backfill de SKU para produtos existentes que ainda não têm
UPDATE public.products
SET sku = 'BOD-' || upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE sku IS NULL OR btrim(sku) = '';

-- SKU único quando preenchido
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique
  ON public.products (lower(sku))
  WHERE sku IS NOT NULL AND btrim(sku) <> '';