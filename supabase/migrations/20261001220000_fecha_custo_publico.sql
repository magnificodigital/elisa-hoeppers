-- Aplicada em 01/10/2026, após a publicação do site novo no Cloudflare.
-- Fecha a leitura do custo dos produtos para visitantes e clientes (admin usa admin_product_costs()).
revoke select on public.products from anon, authenticated;
grant select (id, slug, name, short_description, description, price_cents, compare_at_price_cents, in_stock,
  is_active, is_featured, gallery, category, weight_g, display_order, created_at, updated_at, length_cm, width_cm,
  height_cm, brand, ritual_id, sku, ncm, cfop, unit_of_measure, base_product_id, gross_weight_kg, stock_qty,
  low_stock_threshold, awise_product_id, awise_meta_product_id, awise_synced_at) on public.products to anon, authenticated;
