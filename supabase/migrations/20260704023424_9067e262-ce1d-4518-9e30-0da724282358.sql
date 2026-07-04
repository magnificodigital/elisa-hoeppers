insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values ('me_low_balance_threshold_cents', '5000', 'melhorenvio', false,
  'Alerta de saldo baixo (centavos)',
  'Mostra aviso no admin quando saldo ME cai abaixo desse valor. Padrão: R$ 50,00.',
  25)
on conflict (key) do nothing;

alter table public.orders replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;