-- SEGURANÇA: a política "Allow public read-only access" (USING true) expunha ao público
-- as configurações marcadas como secretas (tokens do Melhor Envio, Asaas, Base...).
-- Fica só a leitura pública do que NÃO é secreto; admins seguem com acesso total.
drop policy if exists "Allow public read-only access to app_settings" on public.app_settings;
