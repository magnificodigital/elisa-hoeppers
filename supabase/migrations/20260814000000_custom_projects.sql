create table if not exists public.custom_project_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text not null,
  company text,
  cnpj text,
  project_type text not null,        -- 'fragrancia' | 'brinde' | 'outro'
  quantity_estimate text,
  deadline text,
  brief text not null,
  budget_range text,
  status text not null default 'nova', -- nova | em_andamento | respondida | fechada
  admin_notes text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.custom_project_requests to authenticated;
grant insert on public.custom_project_requests to anon;
grant all on public.custom_project_requests to service_role;

alter table public.custom_project_requests enable row level security;

-- Visitors can insert
create policy "public can insert project requests"
  on public.custom_project_requests for insert
  to anon, authenticated
  with check (true);

-- Admins manage
create policy "admins manage project requests"
  on public.custom_project_requests for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
