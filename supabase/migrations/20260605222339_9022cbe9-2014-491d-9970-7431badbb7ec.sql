create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "course_reviews_admin_all" on public.course_reviews;
create policy "course_reviews_admin_all"
  on public.course_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "product_reviews_admin_all" on public.product_reviews;
create policy "product_reviews_admin_all"
  on public.product_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.admin_global_search(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q text := '%' || lower(trim(p_query)) || '%';
  v_students jsonb;
  v_courses jsonb;
  v_lessons jsonb;
  v_products jsonb;
  v_orders jsonb;
  v_appointments jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if length(trim(p_query)) < 2 then
    return jsonb_build_object(
      'students', '[]'::jsonb,
      'courses', '[]'::jsonb,
      'lessons', '[]'::jsonb,
      'products', '[]'::jsonb,
      'orders', '[]'::jsonb,
      'appointments', '[]'::jsonb
    );
  end if;

  select coalesce(jsonb_agg(t order by t->>'full_name'), '[]'::jsonb)
  into v_students
  from (
    select jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', u.email
    ) as t
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(coalesce(p.full_name, '')) like q
       or lower(coalesce(u.email, '')) like q
    limit 8
  ) s;

  select coalesce(jsonb_agg(t order by t->>'title'), '[]'::jsonb)
  into v_courses
  from (
    select jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'slug', c.slug
    ) as t
    from public.courses c
    where lower(c.title) like q or lower(c.slug) like q
    limit 8
  ) s;

  select coalesce(jsonb_agg(t order by t->>'title'), '[]'::jsonb)
  into v_lessons
  from (
    select jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'course_id', l.course_id,
      'course_title', c.title,
      'course_slug', c.slug
    ) as t
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where lower(l.title) like q
    limit 8
  ) s;

  select coalesce(jsonb_agg(t order by t->>'name'), '[]'::jsonb)
  into v_products
  from (
    select jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug
    ) as t
    from public.products p
    where lower(p.name) like q or lower(p.slug) like q
    limit 8
  ) s;

  select coalesce(jsonb_agg(t order by t->>'code' desc), '[]'::jsonb)
  into v_orders
  from (
    select jsonb_build_object(
      'id', o.id,
      'code', o.code,
      'customer_name', o.customer_name,
      'total_cents', o.total_cents,
      'status', o.status
    ) as t
    from public.orders o
    where lower(o.code) like q
       or lower(coalesce(o.customer_name, '')) like q
       or lower(coalesce(o.customer_email, '')) like q
    limit 8
  ) s;

  select coalesce(jsonb_agg(t order by t->>'starts_at' desc), '[]'::jsonb)
  into v_appointments
  from (
    select jsonb_build_object(
      'id', a.id,
      'code', a.code,
      'customer_name', a.customer_name,
      'service_title', s.title,
      'starts_at', a.starts_at,
      'status', a.status
    ) as t
    from public.appointments a
    join public.services s on s.id = a.service_id
    where lower(a.code) like q
       or lower(coalesce(a.customer_name, '')) like q
       or lower(coalesce(a.customer_email, '')) like q
    limit 8
  ) s;

  return jsonb_build_object(
    'students', v_students,
    'courses', v_courses,
    'lessons', v_lessons,
    'products', v_products,
    'orders', v_orders,
    'appointments', v_appointments
  );
end;
$$;

grant execute on function public.admin_global_search(text) to authenticated;

create or replace view public.admin_all_reviews as
select
  cr.id,
  'course'::text as kind,
  cr.course_id as target_id,
  c.title as target_title,
  c.slug as target_slug,
  cr.user_id,
  cr.rating,
  cr.comment,
  cr.author_name,
  cr.is_published,
  cr.created_at
from public.course_reviews cr
join public.courses c on c.id = cr.course_id
union all
select
  pr.id,
  'product'::text as kind,
  pr.product_id as target_id,
  p.name as target_title,
  p.slug as target_slug,
  pr.user_id,
  pr.rating,
  pr.comment,
  pr.author_name,
  pr.is_published,
  pr.created_at
from public.product_reviews pr
join public.products p on p.id = pr.product_id;

grant select on public.admin_all_reviews to authenticated;