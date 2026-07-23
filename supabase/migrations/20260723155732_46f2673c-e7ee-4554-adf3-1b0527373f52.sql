-- Settings Base ERP
insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('base_enabled', 'false', 'base', false,
   'Habilitar emissão automática de NFe (Base ERP)',
   'Quando ligado, tenta emitir NFe automaticamente após pagamento confirmado no Asaas.',
   1),
  ('base_environment', 'sandbox', 'base', false,
   'Ambiente Base ERP',
   'sandbox (testes) ou production (real).',
   2),
  ('base_api_key', '', 'base', true,
   'Chave da API Base ERP',
   'Gerada em base.baseerp.com.br → Configurações → Chaves de API. Use a chave do ambiente correto.',
   3),
  ('base_webhook_token', '', 'base', true,
   'Token do webhook Base ERP',
   'Gere uma UUID (crypto.randomUUID) e cole aqui + no cabeçalho de autenticação do webhook Base.',
   4),
  ('base_default_ncm', '00000000', 'base', false,
   'NCM padrão (fallback)',
   'NCM usado quando o produto não tem um específico. Contadora sabe qual usar. Padrão inválido pra forçar cadastro.',
   5),
  ('base_default_unit', 'UN', 'base', false,
   'Unidade de medida padrão',
   'UN (unidade), CX (caixa), KG (kilo), L (litro). Usada quando o produto não tem específica.',
   6),
  ('base_default_cfop', '5102', 'base', false,
   'CFOP padrão',
   'Código Fiscal de Operação. 5102 = venda de mercadoria dentro do estado. 6102 = venda pra outro estado. Contadora sabe.',
   7),
  ('base_default_origin', '0', 'base', false,
   'Origem padrão da mercadoria',
   '0 = nacional. 1 = estrangeira importação direta. 2 = estrangeira já no Brasil. Contadora orienta.',
   8),
  ('base_default_icms_cst', '00', 'base', false,
   'CST ICMS padrão (fora Simples)',
   'Só usado se NÃO estiver no Simples Nacional. 00 = tributada integralmente. Contadora define.',
   9),
  ('base_simples_csosn', '102', 'base', false,
   'CSOSN padrão (Simples Nacional)',
   'Só usado se estiver no Simples. 102 = tributada sem permissão de crédito. Contadora define.',
   10)
on conflict (key) do nothing;

-- Campos em orders
alter table public.orders add column if not exists base_customer_id bigint;
alter table public.orders add column if not exists base_sales_order_id bigint;
alter table public.orders add column if not exists base_invoice_id bigint;
alter table public.orders add column if not exists base_invoice_number int;
alter table public.orders add column if not exists base_invoice_status text;
alter table public.orders add column if not exists base_invoice_key text;
alter table public.orders add column if not exists base_invoice_danfe_url text;
alter table public.orders add column if not exists base_invoice_xml_url text;
alter table public.orders add column if not exists base_invoice_error text;
alter table public.orders add column if not exists base_invoice_emitted_at timestamptz;

create index if not exists idx_orders_base_invoice_id on public.orders(base_invoice_id) where base_invoice_id is not null;
create index if not exists idx_orders_base_invoice_status on public.orders(base_invoice_status) where base_invoice_status is not null;

-- Campos em products
alter table public.products add column if not exists ncm text;
alter table public.products add column if not exists cfop text;
alter table public.products add column if not exists unit_of_measure text default 'UN';
alter table public.products add column if not exists base_product_id bigint;
alter table public.products add column if not exists gross_weight_kg numeric(8,3);

create index if not exists idx_products_base_product_id on public.products(base_product_id) where base_product_id is not null;

-- Campos em profiles
alter table public.profiles add column if not exists base_customer_id bigint;