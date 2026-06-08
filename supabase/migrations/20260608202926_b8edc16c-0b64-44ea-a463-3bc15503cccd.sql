alter table public.products add column if not exists weight_g int;
alter table public.products add column if not exists length_cm numeric(6,2);
alter table public.products add column if not exists width_cm numeric(6,2);
alter table public.products add column if not exists height_cm numeric(6,2);

insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('me_enabled', 'false', 'melhorenvio', false,
'Habilitar Melhor Envio',
'Quando ligado, o checkout mostra cálculo de frete por CEP e o admin pode gerar etiquetas.',
1),
  ('me_environment', 'sandbox', 'melhorenvio', false,
'Ambiente',
'sandbox (testes, saldo fictício) ou production (saldo real). Cada um tem token próprio.',
2),
  ('me_access_token', '', 'melhorenvio', true,
'Token de acesso',
'JWT gerado em melhorenvio.com.br → Permissões de Acesso → Gerar Novo Token. Marque todos os scopes shipping-* + cart-* + users-read.',
3),
  ('me_origin_cep', '', 'melhorenvio', false,
'CEP de origem',
'CEP de onde os produtos são despachados (8 dígitos, só números).',
4),
  ('me_origin_address', '', 'melhorenvio', false,
'Endereço de origem (rua, nº)',
'Aparece na etiqueta como remetente. Ex: "Rua das Flores, 123".',
5),
  ('me_default_weight_g', '300', 'melhorenvio', false,
'Peso padrão (g)',
'Fallback usado quando o produto não tem peso cadastrado.',
6),
  ('me_default_length_cm', '20', 'melhorenvio', false,
'Comprimento padrão (cm)',
'Fallback usado quando o produto não tem dimensão cadastrada.',
7),
  ('me_default_height_cm', '10', 'melhorenvio', false,
'Altura padrão (cm)',
'Fallback usado quando o produto não tem dimensão cadastrada.',
8)
on conflict (key) do nothing;

insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('me_default_width_cm', '15', 'melhorenvio', false,
'Largura padrão (cm)',
'Fallback usado quando o produto não tem dimensão cadastrada.',
9)
on conflict (key) do nothing;