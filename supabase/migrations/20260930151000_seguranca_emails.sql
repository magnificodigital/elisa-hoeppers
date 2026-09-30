-- Anti-abuso dos avisos públicos (send-notification) + limpeza de HTML nos dados digitados pela cliente.
create table if not exists public.notification_log (
  id bigint generated always as identity primary key,
  type text not null,
  ref text not null,
  created_at timestamptz not null default now()
);
create index if not exists notification_log_idx on public.notification_log (type, ref, created_at desc);
alter table public.notification_log enable row level security;
grant all on public.notification_log to service_role;

-- Nome, telefone, e-mail, observações e endereço vão para e-mails: remove < e > (sem HTML injetado).
create or replace function public.orders_strip_html()
returns trigger language plpgsql set search_path = public as $$
declare k text;
begin
  new.customer_name := regexp_replace(coalesce(new.customer_name, ''), '[<>]', '', 'g');
  new.customer_phone := regexp_replace(coalesce(new.customer_phone, ''), '[<>]', '', 'g');
  new.customer_email := regexp_replace(coalesce(new.customer_email, ''), '[<>"'' ]', '', 'g');
  if new.notes is not null then new.notes := regexp_replace(new.notes, '[<>]', '', 'g'); end if;
  if new.customer_address is not null and jsonb_typeof(new.customer_address) = 'object' then
    for k in select jsonb_object_keys(new.customer_address) loop
      if jsonb_typeof(new.customer_address->k) = 'string' then
        new.customer_address := jsonb_set(new.customer_address, array[k],
          to_jsonb(regexp_replace(new.customer_address->>k, '[<>]', '', 'g')));
      end if;
    end loop;
  end if;
  return new;
end; $$;

drop trigger if exists orders_strip_html on public.orders;
create trigger orders_strip_html
  before insert or update of customer_name, customer_phone, customer_email, notes, customer_address on public.orders
  for each row execute function public.orders_strip_html();
