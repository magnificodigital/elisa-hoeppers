create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_published boolean not null default true,
  author_name text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists idx_product_reviews_product on public.product_reviews(product_id);
create index if not exists idx_product_reviews_user on public.product_reviews(user_id);

grant select, insert, update, delete on public.product_reviews to authenticated;
grant select on public.product_reviews to anon;
grant all on public.product_reviews to service_role;

alter table public.product_reviews enable row level security;

create policy "product_reviews_select_published"
  on public.product_reviews for select
  using (is_published = true);

create policy "product_reviews_select_own"
  on public.product_reviews for select
  using (auth.uid() = user_id);

create policy "product_reviews_insert_if_purchased"
  on public.product_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.user_id = auth.uid()
        and o.status in ('completed','shipped')
        and exists (
          select 1
          from jsonb_array_elements(o.items) item
          where (item->>'product_id')::uuid = product_id
        )
    )
  );

create policy "product_reviews_update_own"
  on public.product_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "product_reviews_delete_own"
  on public.product_reviews for delete
  using (auth.uid() = user_id);

create or replace view public.product_rating_summary as
select
  p.id as product_id,
  p.slug as product_slug,
  coalesce(round(avg(pr.rating)::numeric, 2), 0) as avg_rating,
  count(pr.id)::int as review_count
from public.products p
left join public.product_reviews pr
  on pr.product_id = p.id and pr.is_published = true
group by p.id, p.slug;

grant select on public.product_rating_summary to anon, authenticated;

alter table public.orders add column if not exists tracking_code text;

drop policy if exists "orders_update_own_to_cancel" on public.orders;
create policy "orders_update_own_to_cancel"
  on public.orders for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled');