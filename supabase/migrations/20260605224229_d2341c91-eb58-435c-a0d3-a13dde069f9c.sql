create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  segment_type text not null check (segment_type in (
    'newsletter','course_enrolled','product_buyers','all_customers','all_students'
  )),
  segment_id uuid,
  segment_label text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_count int default 0,
  failed_count int default 0,
  status text not null default 'draft' check (status in ('draft','sending','sent','failed'))
);

create index if not exists idx_broadcasts_created_at on public.broadcasts(created_at desc);

grant select, insert, update, delete on public.broadcasts to authenticated;
grant all on public.broadcasts to service_role;

alter table public.broadcasts enable row level security;

drop policy if exists "broadcasts_admin_all" on public.broadcasts;
create policy "broadcasts_admin_all"
  on public.broadcasts for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.admin_count_broadcast_recipients(
  p_segment_type text,
  p_segment_id uuid default null
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_segment_type = 'newsletter' then
    select count(*) into v_count
    from public.newsletter_subscribers
    where unsubscribed_at is null;

  elsif p_segment_type = 'course_enrolled' and p_segment_id is not null then
    select count(distinct e.user_id) into v_count
    from public.enrollments e
    where e.course_id = p_segment_id and e.status = 'active';

  elsif p_segment_type = 'product_buyers' and p_segment_id is not null then
    select count(distinct o.customer_email) into v_count
    from public.orders o
    where o.status in ('completed','shipped')
      and exists (
        select 1 from jsonb_array_elements(o.items) it
        where (it->>'product_id')::uuid = p_segment_id
      );

  elsif p_segment_type = 'all_customers' then
    select count(distinct o.customer_email) into v_count
    from public.orders o
    where o.status in ('completed','shipped');

  elsif p_segment_type = 'all_students' then
    select count(distinct e.user_id) into v_count
    from public.enrollments e
    where e.status = 'active';
  end if;

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.admin_count_broadcast_recipients(text, uuid) to authenticated;