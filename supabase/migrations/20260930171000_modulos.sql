-- Liga/desliga de módulos (Admin → Configurações → Módulos). Desligado = function recusa / webhook ignora.
insert into public.app_settings (key, value, category, is_secret, label, description, display_order) values
  ('modulo_mercadopago',  'true',  'modulos', false, 'Mercado Pago', 'Plano B automático do checkout quando a Pagar.me falha; também cobra cursos pagos.', 1),
  ('modulo_asaas',        'false', 'modulos', false, 'Asaas', 'Gateway antigo, sem uso.', 2),
  ('modulo_base',         'false', 'modulos', false, 'Base ERP (NF-e)', 'Emissor de NF-e antigo. A NF-e passa a sair pela Awise.', 3),
  ('modulo_financeiro',   'false', 'modulos', false, 'Financeiro e Entrada de notas', 'Controle financeiro próprio do site. A Awise cuida disso.', 4),
  ('modulo_diagnosticos', 'false', 'modulos', false, 'Diagnósticos', 'Telas de teste do Melhor Envio e Mercado Pago (manutenção).', 5)
on conflict (key) do nothing;
