-- Avisos (popups/lightbox)
create table if not exists public.site_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  image_url text,
  cta_label text,
  cta_href text,
  active boolean not null default false,
  pages text[] not null default '{"all"}',
  delay_seconds int not null default 3,
  frequency text not null default 'once_session',
  start_at timestamptz,
  end_at timestamptz,
  capture_lead boolean not null default false,
  form_title text,
  fields_name boolean not null default true,
  fields_email boolean not null default true,
  fields_phone boolean not null default false,
  success_message text default 'Recebemos seus dados. Em breve entramos em contato! 💛',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_notices enable row level security;

-- Leads capturados pelos avisos
create table if not exists public.site_notice_leads (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid references public.site_notices(id) on delete set null,
  notice_title text,
  name text,
  email text,
  phone text,
  page text,
  created_at timestamptz not null default now()
);

alter table public.site_notice_leads enable row level security;

-- Grants
grant select on public.site_notices to anon, authenticated;
grant all on public.site_notices to service_role;
grant all on public.site_notices to authenticated;

grant insert on public.site_notice_leads to anon, authenticated;
grant select on public.site_notice_leads to authenticated;
grant all on public.site_notice_leads to service_role;

-- Policies
drop policy if exists "public reads active notices" on public.site_notices;
create policy "public reads active notices"
  on public.site_notices for select
  to anon, authenticated
  using (
    active = true
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at >= now())
  );

drop policy if exists "admins manage notices" on public.site_notices;
create policy "admins manage notices"
  on public.site_notices for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "public submit notice lead" on public.site_notice_leads;
create policy "public submit notice lead"
  on public.site_notice_leads for insert
  to anon, authenticated with check (true);

drop policy if exists "admins read notice leads" on public.site_notice_leads;
create policy "admins read notice leads"
  on public.site_notice_leads for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));