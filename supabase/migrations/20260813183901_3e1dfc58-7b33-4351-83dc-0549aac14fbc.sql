insert into public.app_settings (key, value)
values ('mp_public_key', 'APP_USR-0c8ca09b-3d53-46e5-8165-e974662c7e79')
on conflict (key) do update set value = excluded.value;

insert into public.app_settings (key, value)
values ('mp_enabled', 'true')
on conflict (key) do update set value = excluded.value;