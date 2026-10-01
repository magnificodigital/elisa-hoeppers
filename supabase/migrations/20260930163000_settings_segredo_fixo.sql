-- Defesa extra: configurações com cara de credencial ficam sempre secretas (nunca públicas).
create or replace function public.app_settings_force_secret()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.key ~* '(token|secret|api_key|password|senha|access_key|private)' and new.key not in ('mp_public_key') then
    new.is_secret := true;
  end if;
  return new;
end; $$;
drop trigger if exists app_settings_force_secret on public.app_settings;
create trigger app_settings_force_secret before insert or update on public.app_settings
  for each row execute function public.app_settings_force_secret();
update public.app_settings set is_secret = true
  where key ~* '(token|secret|api_key|password|senha|access_key|private)' and key <> 'mp_public_key' and not is_secret;
