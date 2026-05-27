insert into public.app_settings (key, value, category, is_secret, label, description, display_order) values
  ('resend_audience_id', '', 'newsletter', false, 'Audience ID do Resend', 'UUID da audience criada no painel Resend (Audiences → sua audience → copia o ID).', 1),
  ('newsletter_enabled', 'false', 'newsletter', false, 'Ativado', 'Liga depois de configurar o Audience ID. Se desligado, formulário some.', 2)
on conflict (key) do nothing;