
-- 1) Slides: toggle para captura de cupom
ALTER TABLE public.bodyoga_slides
  ADD COLUMN IF NOT EXISTS coupon_capture_enabled boolean NOT NULL DEFAULT false;

-- 2) Tabela de cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  discount_percent integer NOT NULL,
  source text,
  expires_at timestamptz,
  used_at timestamptz,
  used_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupons_email_idx ON public.coupons (lower(email));
CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (upper(code));

GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo; ninguém escreve direto (apenas via RPCs SECURITY DEFINER).
DROP POLICY IF EXISTS "coupons_admin_read" ON public.coupons;
CREATE POLICY "coupons_admin_read" ON public.coupons
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 3) Colunas de desconto em orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- 4) Settings padrão para cupom
INSERT INTO public.app_settings (key, value, category, is_secret, label, description, display_order)
VALUES
  ('coupon_signup_enabled', 'true', 'cupom', false, 'Captura de cupom ativa', 'Habilita globalmente a captura de email pelo banner (mesmo com toggle por slide).', 1),
  ('coupon_discount_percent', '10', 'cupom', false, 'Porcentagem de desconto', 'Percentual de desconto que o cupom concede na primeira compra.', 2),
  ('coupon_validity_days', '30', 'cupom', false, 'Validade (dias)', 'Quantos dias o cupom fica válido após emitido.', 3),
  ('coupon_prefix', 'BEMVINDA', 'cupom', false, 'Prefixo do código', 'Prefixo do código gerado (ex: BEMVINDA-XXXX).', 4),
  ('coupon_email_subject', 'Seu cupom de boas-vindas BODYOGA 🌿', 'cupom', false, 'Assunto do email', 'Assunto do email enviado com o cupom.', 5),
  ('coupon_email_headline', 'Bem-vinda ao ritual BODYOGA', 'cupom', false, 'Título do email', 'Título grande dentro do email.', 6),
  ('coupon_email_message', 'Obrigada por se inscrever. Aqui está seu cupom de {{discount}}% de desconto na primeira compra. Use no checkout — o cupom vale por {{validity_days}} dias.', 'cupom', false, 'Mensagem do email', 'Mensagem principal. Suporta {{discount}}, {{code}}, {{validity_days}}, {{name}}.', 7),
  ('coupon_banner_title', 'Ganhe seu cupom de boas-vindas', 'cupom', false, 'Título do modal no banner', 'Frase que aparece no topo do modal quando a cliente clica no botão.', 8),
  ('coupon_banner_subtitle', 'Cadastre seu email e receba um cupom exclusivo de desconto na sua primeira compra.', 'cupom', false, 'Subtítulo do modal', 'Texto de apoio no modal.', 9)
ON CONFLICT (key) DO NOTHING;

-- 5) Função geradora de código (aleatório, 4 chars)
CREATE OR REPLACE FUNCTION public.gen_coupon_suffix()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  i int;
BEGIN
  FOR i IN 1..4 LOOP
    v_code := v_code || substr(v_alphabet, floor(random()*length(v_alphabet))::int + 1, 1);
  END LOOP;
  RETURN v_code;
END;
$$;

-- 6) RPC: cria cupom para email cadastrado
CREATE OR REPLACE FUNCTION public.create_signup_coupon(p_email text, p_name text DEFAULT NULL, p_source text DEFAULT 'banner')
RETURNS TABLE(code text, discount_percent integer, expires_at timestamptz, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_pct int;
  v_validity int;
  v_prefix text;
  v_enabled text;
  v_code text;
  v_expires timestamptz;
  v_attempt int := 0;
  v_existing public.coupons;
BEGIN
  IF v_email IS NULL OR v_email = '' OR v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'email inválido';
  END IF;

  SELECT value INTO v_enabled FROM public.app_settings WHERE key = 'coupon_signup_enabled';
  IF v_enabled IS NOT NULL AND lower(v_enabled) NOT IN ('true','1','yes') THEN
    RAISE EXCEPTION 'captura de cupom desativada';
  END IF;

  SELECT COALESCE(value::int, 10) INTO v_pct FROM public.app_settings WHERE key = 'coupon_discount_percent';
  IF v_pct IS NULL THEN v_pct := 10; END IF;

  SELECT COALESCE(value::int, 30) INTO v_validity FROM public.app_settings WHERE key = 'coupon_validity_days';
  IF v_validity IS NULL THEN v_validity := 30; END IF;

  SELECT COALESCE(value, 'BEMVINDA') INTO v_prefix FROM public.app_settings WHERE key = 'coupon_prefix';
  IF v_prefix IS NULL OR v_prefix = '' THEN v_prefix := 'BEMVINDA'; END IF;

  v_expires := now() + (v_validity || ' days')::interval;

  -- Reaproveita cupom existente ainda válido e não usado para o mesmo email
  SELECT * INTO v_existing FROM public.coupons
    WHERE lower(email) = v_email
      AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at DESC LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    -- Garante inscrição na newsletter
    INSERT INTO public.newsletter_subscribers (email, full_name, source)
    VALUES (v_email, v_name, p_source)
    ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL, full_name = COALESCE(EXCLUDED.full_name, public.newsletter_subscribers.full_name);
    RETURN QUERY SELECT v_existing.code, v_existing.discount_percent, v_existing.expires_at, v_existing.email, v_existing.full_name;
    RETURN;
  END IF;

  -- Gera código único
  LOOP
    v_code := upper(v_prefix) || '-' || public.gen_coupon_suffix();
    BEGIN
      INSERT INTO public.coupons (code, email, full_name, discount_percent, source, expires_at)
      VALUES (v_code, v_email, v_name, v_pct, p_source, v_expires);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempt := v_attempt + 1;
      IF v_attempt > 5 THEN RAISE EXCEPTION 'não foi possível gerar cupom'; END IF;
    END;
  END LOOP;

  -- Inscreve/reativa na newsletter
  INSERT INTO public.newsletter_subscribers (email, full_name, source)
  VALUES (v_email, v_name, p_source)
  ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL, full_name = COALESCE(EXCLUDED.full_name, public.newsletter_subscribers.full_name);

  RETURN QUERY SELECT v_code, v_pct, v_expires, v_email, v_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_signup_coupon(text, text, text) TO anon, authenticated;

-- 7) RPC: valida cupom
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text)
RETURNS TABLE(code text, discount_percent integer, valid boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.coupons;
BEGIN
  SELECT * INTO v_row FROM public.coupons WHERE upper(coupons.code) = upper(trim(p_code)) LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN QUERY SELECT upper(trim(p_code)), 0, false, 'não encontrado';
    RETURN;
  END IF;
  IF v_row.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_row.code, 0, false, 'já utilizado';
    RETURN;
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN QUERY SELECT v_row.code, 0, false, 'expirado';
    RETURN;
  END IF;
  RETURN QUERY SELECT v_row.code, v_row.discount_percent, true, ''::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

-- 8) place_order com suporte a cupom
CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_address jsonb DEFAULT NULL::jsonb,
  p_notes text DEFAULT NULL::text,
  p_shipping_service_id text DEFAULT NULL::text,
  p_shipping_service_label text DEFAULT NULL::text,
  p_shipping_cents integer DEFAULT 0,
  p_destination_cep text DEFAULT NULL::text,
  p_coupon_code text DEFAULT NULL::text
)
RETURNS TABLE(order_id uuid, code text, subtotal_cents integer, discount_cents integer, total_cents integer, coupon_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_code text;
  v_subtotal int := 0;
  v_discount int := 0;
  v_total int;
  v_validated_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_pid uuid;
  v_qty int;
  v_product record;
  v_attempt int := 0;
  v_coupon public.coupons;
  v_coupon_code text := NULL;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'cart empty'; END IF;
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN RAISE EXCEPTION 'name required'; END IF;
  IF p_customer_email IS NULL OR trim(p_customer_email) = '' THEN RAISE EXCEPTION 'email required'; END IF;
  IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN RAISE EXCEPTION 'phone required'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    IF v_qty < 1 THEN CONTINUE; END IF;
    SELECT id, slug, name, price_cents, in_stock, is_active
      INTO v_product
      FROM public.products WHERE id = v_pid;
    IF v_product.id IS NULL OR NOT v_product.is_active THEN
      RAISE EXCEPTION 'product not available: %', v_pid;
    END IF;
    IF NOT v_product.in_stock THEN
      RAISE EXCEPTION 'product out of stock: %', v_product.name;
    END IF;
    v_subtotal := v_subtotal + (v_product.price_cents * v_qty);
    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_product.id,
      'slug', v_product.slug,
      'name', v_product.name,
      'qty', v_qty,
      'unit_price_cents', v_product.price_cents,
      'total_cents', v_product.price_cents * v_qty
    );
  END LOOP;

  IF jsonb_array_length(v_validated_items) = 0 THEN RAISE EXCEPTION 'no valid items'; END IF;

  -- Aplica cupom (se enviado e válido) com lock atômico
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon FROM public.coupons
      WHERE upper(code) = upper(trim(p_coupon_code))
      FOR UPDATE;
    IF v_coupon.id IS NULL THEN
      RAISE EXCEPTION 'cupom inválido';
    END IF;
    IF v_coupon.used_at IS NOT NULL THEN
      RAISE EXCEPTION 'cupom já utilizado';
    END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'cupom expirado';
    END IF;
    v_discount := floor(v_subtotal * v_coupon.discount_percent / 100.0)::int;
    IF v_discount > v_subtotal THEN v_discount := v_subtotal; END IF;
    v_coupon_code := v_coupon.code;
  END IF;

  v_total := v_subtotal + COALESCE(p_shipping_cents, 0) - v_discount;
  IF v_total < 0 THEN v_total := 0; END IF;

  LOOP
    v_code := public.gen_order_code();
    BEGIN
      INSERT INTO public.orders
        (code, user_id, customer_name, customer_email, customer_phone, customer_address,
         items, subtotal_cents, shipping_cents, total_cents, notes, status,
         shipping_service_id, shipping_service_label, shipping_destination_cep,
         discount_cents, coupon_code)
      VALUES
        (v_code, auth.uid(), trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone), p_customer_address,
         v_validated_items, v_subtotal, COALESCE(p_shipping_cents, 0), v_total, p_notes, 'pending',
         p_shipping_service_id, p_shipping_service_label, p_destination_cep,
         v_discount, v_coupon_code)
      RETURNING id INTO v_order_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempt := v_attempt + 1;
      IF v_attempt > 5 THEN RAISE EXCEPTION 'could not generate unique code'; END IF;
    END;
  END LOOP;

  -- Marca o cupom como usado
  IF v_coupon.id IS NOT NULL THEN
    UPDATE public.coupons SET used_at = now(), used_order_id = v_order_id WHERE id = v_coupon.id;
  END IF;

  RETURN QUERY SELECT v_order_id, v_code, v_subtotal, v_discount, v_total, v_coupon_code;
END;
$$;
