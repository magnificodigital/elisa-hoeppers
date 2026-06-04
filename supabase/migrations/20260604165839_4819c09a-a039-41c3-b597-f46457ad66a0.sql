SET check_function_bodies = false;
CREATE TYPE public.appointment_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);
CREATE TYPE public.course_level AS ENUM (
    'iniciante',
    'intermediario',
    'avancado',
    'todos'
);
CREATE TYPE public.enrollment_status AS ENUM (
    'active',
    'cancelled',
    'completed'
);
CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'shipped',
    'cancelled',
    'completed'
);
CREATE TYPE public.question_type AS ENUM (
    'multiple_choice',
    'true_false'
);
CREATE TYPE public.user_role AS ENUM (
    'student',
    'instructor',
    'admin'
);
CREATE TYPE public.wishlist_item_type AS ENUM (
    'course',
    'product'
);
CREATE FUNCTION public.admin_dashboard_stats() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_role public.user_role;
begin
  v_role := public.current_user_role();
  if v_role not in ('instructor','admin') then
    raise exception 'forbidden';
  end if;
  return json_build_object(
    'enrollments_month',  (select count(*)::int from public.enrollments where enrolled_at >= now() - interval '30 days'),
    'enrollments_total',  (select count(*)::int from public.enrollments where status = 'active'),
    'orders_month',       (select count(*)::int from public.orders where created_at >= now() - interval '30 days'),
    'orders_pending',     (select count(*)::int from public.orders where status = 'pending'),
    'revenue_month_cents',(select coalesce(sum(total_cents), 0)::bigint from public.orders where status in ('confirmed','shipped','completed') and created_at >= now() - interval '30 days'),
    'revenue_total_cents',(select coalesce(sum(total_cents), 0)::bigint from public.orders where status in ('confirmed','shipped','completed')),
    'appointments_month',  (select count(*)::int from public.appointments where created_at >= now() - interval '30 days'),
    'appointments_pending',(select count(*)::int from public.appointments where status = 'pending'),
    'students_month',  (select count(*)::int from public.profiles where created_at >= now() - interval '30 days'),
    'students_total',  (select count(*)::int from public.profiles),
    'newsletter_month',(select count(*)::int from public.newsletter_subscribers where subscribed_at >= now() - interval '30 days' and unsubscribed_at is null),
    'newsletter_active',(select count(*)::int from public.newsletter_subscribers where unsubscribed_at is null),
    'top_courses', (
      select coalesce(json_agg(t order by t.cnt desc), '[]'::json)
      from (
        select c.title, c.slug, count(e.*)::int as cnt
        from public.enrollments e
        join public.courses c on c.id = e.course_id
        where e.enrolled_at >= now() - interval '365 days'
        group by c.id
        order by cnt desc
        limit 3
      ) t
    ),
    'top_products', (
      select coalesce(json_agg(t order by t.cnt desc), '[]'::json)
      from (
        select item->>'name' as name, item->>'slug' as slug, count(*)::int as cnt
        from public.orders o, jsonb_array_elements(o.items) as item
        where o.created_at >= now() - interval '365 days'
          and o.status in ('confirmed','shipped','completed')
        group by item->>'name', item->>'slug'
        order by cnt desc
        limit 3
      ) t
    )
  );
end;
$$;
CREATE FUNCTION public.book_appointment(p_service_id uuid, p_starts_at timestamp with time zone, p_customer_name text, p_customer_email text, p_customer_phone text DEFAULT NULL::text, p_notes text DEFAULT NULL::text) RETURNS TABLE(appointment_id uuid, code text, starts_at timestamp with time zone, ends_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_duration int;
  v_active boolean;
  v_ends_at timestamptz;
  v_collision int;
  v_code text;
  v_attempt int := 0;
  v_appt_id uuid;
begin
  if p_customer_name is null or trim(p_customer_name) = '' then raise exception 'name required'; end if;
  if p_customer_email is null or trim(p_customer_email) = '' then raise exception 'email required'; end if;
  if p_starts_at is null then raise exception 'starts_at required'; end if;
  if p_starts_at < now() then raise exception 'cannot book past slot'; end if;
  select duration_min, is_active into v_duration, v_active
  from public.services where id = p_service_id;
  if v_duration is null then raise exception 'service not found'; end if;
  if not v_active then raise exception 'service not active'; end if;
  v_ends_at := p_starts_at + (v_duration * interval '1 minute');
  select count(*) into v_collision from public.appointments
  where status in ('pending','confirmed')
    and tstzrange(starts_at, ends_at, '[)') && tstzrange(p_starts_at, v_ends_at, '[)');
  if v_collision > 0 then raise exception 'slot already taken'; end if;
  loop
    v_code := public.gen_appointment_code();
    begin
      insert into public.appointments
        (code, service_id, user_id, customer_name, customer_email, customer_phone, starts_at, ends_at, notes, status)
      values
        (v_code, p_service_id, v_user_id, trim(p_customer_name), trim(p_customer_email), p_customer_phone, p_starts_at, v_ends_at, p_notes, 'pending')
      returning id into v_appt_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;
  return query select v_appt_id, v_code, p_starts_at, v_ends_at;
end;
$$;
CREATE FUNCTION public.current_user_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select role from public.profiles where id = auth.uid();
$$;
CREATE FUNCTION public.gen_appointment_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_i int;
begin
  for v_i in 1..6 loop
    v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
  end loop;
  return v_code;
end;
$$;
CREATE FUNCTION public.gen_certificate_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_i int;
  v_idx int;
begin
  for v_i in 1..8 loop
    v_idx := floor(random() * length(v_alphabet))::int + 1;
    v_code := v_code || substr(v_alphabet, v_idx, 1);
  end loop;
  return v_code;
end;
$$;
CREATE FUNCTION public.gen_order_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_i int;
begin
  for v_i in 1..6 loop
    v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
  end loop;
  return v_code;
end;
$$;
CREATE FUNCTION public.get_order_by_code(p_code text) RETURNS TABLE(code text, customer_name text, items jsonb, subtotal_cents integer, shipping_cents integer, total_cents integer, status public.order_status, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return query
  select o.code, o.customer_name, o.items, o.subtotal_cents, o.shipping_cents, o.total_cents, o.status, o.created_at
  from public.orders o
  where o.code = p_code;
end;
$$;
CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;
CREATE FUNCTION public.is_enrolled(p_course_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.enrollments
    where user_id = auth.uid() and course_id = p_course_id and status = 'active'
  );
$$;
CREATE FUNCTION public.is_enrolled_in_lesson(p_lesson_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.lessons l
    join public.enrollments e on e.course_id = l.course_id
    where l.id = p_lesson_id
      and e.user_id = auth.uid()
      and e.status = 'active'
  );
$$;
CREATE FUNCTION public.issue_certificate(p_course_id uuid) RETURNS TABLE(certificate_id uuid, code text, course_title text, student_name text, issued_at timestamp with time zone, already_issued boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_enrolled boolean;
  v_total_lessons int;
  v_completed int;
  v_course_title text;
  v_student_name text;
  v_existing public.certificates;
  v_code text;
  v_attempt int;
begin
  if v_user_id is null then raise exception 'unauthenticated'; end if;
  select exists (
    select 1 from public.enrollments
    where user_id = v_user_id and course_id = p_course_id and status = 'active'
  ) into v_enrolled;
  if not v_enrolled then raise exception 'not enrolled'; end if;
  select count(*) into v_total_lessons from public.lessons where course_id = p_course_id;
  if v_total_lessons = 0 then raise exception 'course has no lessons'; end if;
  select count(*) into v_completed
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  where l.course_id = p_course_id
    and lp.user_id = v_user_id
    and lp.completed = true;
  if v_completed < v_total_lessons then
    raise exception 'course not yet completed (% of %)', v_completed, v_total_lessons;
  end if;
  select * into v_existing from public.certificates
  where user_id = v_user_id and course_id = p_course_id;
  if v_existing.id is not null then
    return query select v_existing.id, v_existing.code, v_existing.course_title,
                        v_existing.student_name, v_existing.issued_at, true;
    return;
  end if;
  select coalesce(full_name, ''), c.title
  into v_student_name, v_course_title
  from public.profiles p
  cross join public.courses c
  where p.id = v_user_id and c.id = p_course_id;
  if v_student_name is null or v_student_name = '' then
    v_student_name := 'Aluna';
  end if;
  v_attempt := 0;
  loop
    v_code := public.gen_certificate_code();
    begin
      insert into public.certificates (code, course_id, user_id, student_name, course_title)
      values (v_code, p_course_id, v_user_id, v_student_name, v_course_title);
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;
  return query
  select c.id, c.code, c.course_title, c.student_name, c.issued_at, false
  from public.certificates c
  where c.user_id = v_user_id and c.course_id = p_course_id;
end;
$$;
CREATE FUNCTION public.mark_lesson_complete(p_lesson_id uuid, p_watched_seconds integer DEFAULT 0) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_course_id uuid;
  v_is_preview boolean;
  v_enrolled boolean;
  v_is_staff boolean;
  v_total int;
  v_completed int;
begin
  if v_user_id is null then raise exception 'unauthenticated'; end if;
  select course_id, is_free_preview into v_course_id, v_is_preview
  from public.lessons where id = p_lesson_id;
  if v_course_id is null then raise exception 'lesson not found'; end if;
  select exists (
    select 1 from public.enrollments
    where user_id = v_user_id and course_id = v_course_id and status = 'active'
  ) into v_enrolled;
  v_is_staff := public.current_user_role() in ('instructor','admin');
  if not v_enrolled and not v_is_preview and not v_is_staff then
    raise exception 'not enrolled in course';
  end if;
  insert into public.lesson_progress (user_id, lesson_id, completed, watched_seconds, last_seen_at)
  values (v_user_id, p_lesson_id, true, p_watched_seconds, now())
  on conflict (user_id, lesson_id) do update set
    completed = true,
    watched_seconds = greatest(public.lesson_progress.watched_seconds, excluded.watched_seconds),
    last_seen_at = now();
  if v_enrolled then
    select count(*) into v_total from public.lessons where course_id = v_course_id;
    select count(*) into v_completed
    from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
    where l.course_id = v_course_id and lp.user_id = v_user_id and lp.completed = true;
    if v_total > 0 and v_completed >= v_total then
      begin
        perform public.issue_certificate(v_course_id);
      exception when others then
        null;
      end;
    end if;
  end if;
end;
$$;
CREATE FUNCTION public.place_order(p_items jsonb, p_customer_name text, p_customer_email text, p_customer_phone text, p_customer_address jsonb DEFAULT NULL::jsonb, p_notes text DEFAULT NULL::text) RETURNS TABLE(order_id uuid, code text, subtotal_cents integer, total_cents integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_pid uuid;
  v_qty int;
  v_product record;
  v_subtotal int := 0;
  v_validated_items jsonb := '[]'::jsonb;
  v_code text;
  v_attempt int := 0;
  v_order_id uuid;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'cart empty'; end if;
  if p_customer_name is null or trim(p_customer_name) = '' then raise exception 'name required'; end if;
  if p_customer_email is null or trim(p_customer_email) = '' then raise exception 'email required'; end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then raise exception 'phone required'; end if;
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    if v_qty < 1 then continue; end if;
    select id, slug, name, price_cents, in_stock, is_active
      into v_product
      from public.products where id = v_pid;
    if v_product.id is null or not v_product.is_active then
      raise exception 'product not available: %', v_pid;
    end if;
    if not v_product.in_stock then
      raise exception 'product out of stock: %', v_product.name;
    end if;
    v_subtotal := v_subtotal + (v_product.price_cents * v_qty);
    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_product.id,
      'slug', v_product.slug,
      'name', v_product.name,
      'qty', v_qty,
      'unit_price_cents', v_product.price_cents,
      'total_cents', v_product.price_cents * v_qty
    );
  end loop;
  if jsonb_array_length(v_validated_items) = 0 then raise exception 'no valid items'; end if;
  loop
    v_code := public.gen_order_code();
    begin
      insert into public.orders
        (code, user_id, customer_name, customer_email, customer_phone, customer_address,
         items, subtotal_cents, shipping_cents, total_cents, notes, status)
      values
        (v_code, v_user_id, trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone), p_customer_address,
         v_validated_items, v_subtotal, 0, v_subtotal, p_notes, 'pending')
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;
  return query select v_order_id, v_code, v_subtotal, v_subtotal;
end;
$$;
CREATE FUNCTION public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb) RETURNS TABLE(attempt_id uuid, score integer, passed boolean, total_questions integer, correct_count integer, results jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_lesson_id uuid;
  v_course_id uuid;
  v_enrolled boolean;
  v_is_staff boolean;
  v_passing_score int;
  v_max_attempts int;
  v_prev_attempts int;
  v_total int := 0;
  v_correct int := 0;
  v_results jsonb := '[]'::jsonb;
  v_q record;
  v_user_answer int;
  v_is_correct boolean;
  v_score int;
  v_passed boolean;
  v_attempt_id uuid;
begin
  if v_user_id is null then raise exception 'unauthenticated'; end if;
  select q.lesson_id, l.course_id, q.passing_score, q.max_attempts
  into v_lesson_id, v_course_id, v_passing_score, v_max_attempts
  from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  where q.id = p_quiz_id;
  if v_course_id is null then raise exception 'quiz not found'; end if;
  v_is_staff := public.current_user_role() in ('instructor','admin');
  if not v_is_staff then
    select exists (
      select 1 from public.enrollments
      where user_id = v_user_id and course_id = v_course_id and status = 'active'
    ) into v_enrolled;
    if not v_enrolled then raise exception 'not enrolled'; end if;
  end if;
  if v_max_attempts is not null then
    select count(*) into v_prev_attempts from public.quiz_attempts
    where quiz_id = p_quiz_id and user_id = v_user_id;
    if v_prev_attempts >= v_max_attempts then
      raise exception 'max attempts reached';
    end if;
  end if;
  for v_q in
    select id, correct_answer, explanation
    from public.quiz_questions
    where quiz_id = p_quiz_id
    order by display_order asc
  loop
    v_total := v_total + 1;
    begin
      v_user_answer := (p_answers ->> v_q.id::text)::int;
    exception when others then
      v_user_answer := -1;
    end;
    v_is_correct := v_user_answer = v_q.correct_answer;
    if v_is_correct then v_correct := v_correct + 1; end if;
    v_results := v_results || jsonb_build_object(
      'question_id', v_q.id,
      'user_answer', v_user_answer,
      'correct_answer', v_q.correct_answer,
      'is_correct', v_is_correct,
      'explanation', v_q.explanation
    );
  end loop;
  if v_total = 0 then raise exception 'quiz has no questions'; end if;
  v_score := round((v_correct::numeric / v_total) * 100);
  v_passed := v_score >= v_passing_score;
  insert into public.quiz_attempts (quiz_id, user_id, answers, score, correct_count, total_questions, passed)
  values (p_quiz_id, v_user_id, p_answers, v_score, v_correct, v_total, v_passed)
  returning id into v_attempt_id;
  return query select v_attempt_id, v_score, v_passed, v_total, v_correct, v_results;
end;
$$;
CREATE FUNCTION public.touch_app_settings() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin new.updated_at = now(); return new; end;
$$;
CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin new.updated_at = now(); return new; end;
$$;
CREATE TABLE public.app_settings (
    key text NOT NULL,
    value text,
    category text DEFAULT 'general'::text NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    label text,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    service_id uuid NOT NULL,
    user_id uuid,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.availability_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT availability_blocks_check CHECK ((ends_at > starts_at))
);
CREATE TABLE public.availability_rules (
    day_of_week integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT availability_rules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);
CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    course_id uuid NOT NULL,
    user_id uuid NOT NULL,
    student_name text NOT NULL,
    course_title text NOT NULL,
    instructor_name text DEFAULT 'Elisa Hoeppers'::text NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.course_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_name text,
    CONSTRAINT course_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    cover_image text,
    overlay_label text,
    level public.course_level DEFAULT 'todos'::public.course_level NOT NULL,
    duration_total_min integer,
    instructor_id uuid,
    price_cents integer,
    is_published boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.course_rating_summary AS
 SELECT c.id AS course_id,
    c.slug AS course_slug,
    COALESCE(round(avg(r.rating), 2), (0)::numeric) AS avg_rating,
    (count(r.id))::integer AS review_count
   FROM (public.courses c
     LEFT JOIN public.course_reviews r ON (((r.course_id = c.id) AND (r.is_published = true))))
  GROUP BY c.id, c.slug;
CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    status public.enrollment_status DEFAULT 'active'::public.enrollment_status NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);
CREATE TABLE public.lesson_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    user_id uuid,
    author_name text,
    author_role public.user_role,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.lesson_progress (
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    watched_seconds integer DEFAULT 0 NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.lesson_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    user_id uuid,
    author_name text,
    body text NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    module_id uuid,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    youtube_id text,
    content_md text,
    duration_min integer,
    display_order integer DEFAULT 0 NOT NULL,
    is_free_preview boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.my_course_progress WITH (security_invoker='true') AS
 SELECT c.id AS course_id,
    c.slug AS course_slug,
    c.title AS course_title,
    c.cover_image,
    c.overlay_label,
    e.enrolled_at,
    ( SELECT count(*) AS count
           FROM public.lessons l
          WHERE (l.course_id = c.id)) AS total_lessons,
    ( SELECT count(*) AS count
           FROM (public.lesson_progress p
             JOIN public.lessons l ON ((l.id = p.lesson_id)))
          WHERE ((l.course_id = c.id) AND (p.user_id = auth.uid()) AND (p.completed = true))) AS completed_lessons,
    ( SELECT l.id
           FROM (public.lessons l
             LEFT JOIN public.lesson_progress p ON (((p.lesson_id = l.id) AND (p.user_id = auth.uid()))))
          WHERE ((l.course_id = c.id) AND ((p.completed IS NULL) OR (p.completed = false)))
          ORDER BY l.display_order
         LIMIT 1) AS next_lesson_id
   FROM (public.courses c
     JOIN public.enrollments e ON (((e.course_id = c.id) AND (e.user_id = auth.uid()) AND (e.status = 'active'::public.enrollment_status))));
CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name text,
    source text,
    subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
    unsubscribed_at timestamp with time zone,
    resend_contact_id text
);
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    user_id uuid,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    customer_address jsonb,
    items jsonb NOT NULL,
    subtotal_cents integer NOT NULL,
    shipping_cents integer DEFAULT 0 NOT NULL,
    total_cents integer NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_method text,
    payment_id text,
    payment_preference_id text,
    paid_at timestamp with time zone
);
CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    cover_image text,
    body_md text,
    author_name text DEFAULT 'Elisa Hoeppers'::text,
    published_at timestamp with time zone,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    short_description text,
    description text,
    price_cents integer NOT NULL,
    compare_at_price_cents integer,
    in_stock boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    gallery jsonb DEFAULT '[]'::jsonb NOT NULL,
    category text,
    weight_g integer,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    full_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    user_id uuid NOT NULL,
    answers jsonb NOT NULL,
    score integer NOT NULL,
    correct_count integer NOT NULL,
    total_questions integer NOT NULL,
    passed boolean NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    question_type public.question_type DEFAULT 'multiple_choice'::public.question_type NOT NULL,
    question_text text NOT NULL,
    options jsonb,
    correct_answer integer NOT NULL,
    explanation text,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.quiz_questions_public AS
 SELECT id,
    quiz_id,
    question_type,
    question_text,
    options,
    display_order
   FROM public.quiz_questions
  ORDER BY display_order;
CREATE TABLE public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    passing_score integer DEFAULT 70 NOT NULL,
    max_attempts integer,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quizzes_passing_score_check CHECK (((passing_score >= 0) AND (passing_score <= 100)))
);
CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    duration_min integer DEFAULT 30 NOT NULL,
    price_cents integer NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    is_group boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    cover_image text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.taken_slots AS
 SELECT starts_at,
    ends_at,
    service_id
   FROM public.appointments
  WHERE ((status = ANY (ARRAY['pending'::public.appointment_status, 'confirmed'::public.appointment_status])) AND (starts_at >= now()) AND (starts_at < (now() + '60 days'::interval)));
CREATE TABLE public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_type public.wishlist_item_type NOT NULL,
    course_id uuid,
    product_id uuid,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wishlist_items_check CHECK ((((item_type = 'course'::public.wishlist_item_type) AND (course_id IS NOT NULL) AND (product_id IS NULL)) OR ((item_type = 'product'::public.wishlist_item_type) AND (product_id IS NOT NULL) AND (course_id IS NULL))))
);
ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_code_key UNIQUE (code);
ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.availability_blocks
    ADD CONSTRAINT availability_blocks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.availability_rules
    ADD CONSTRAINT availability_rules_pkey PRIMARY KEY (day_of_week);
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_code_key UNIQUE (code);
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_course_id_key UNIQUE (user_id, course_id);
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_user_id_course_id_key UNIQUE (user_id, course_id);
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id);
ALTER TABLE ONLY public.lesson_answers
    ADD CONSTRAINT lesson_answers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (user_id, lesson_id);
ALTER TABLE ONLY public.lesson_questions
    ADD CONSTRAINT lesson_questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_slug_key UNIQUE (course_id, slug);
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);
ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_code_key UNIQUE (code);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_key UNIQUE (lesson_id);
ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_item_type_course_id_product_id_key UNIQUE (user_id, item_type, course_id, product_id);
CREATE INDEX appointments_starts_at_idx ON public.appointments USING btree (starts_at);
CREATE INDEX appointments_status_starts_at_idx ON public.appointments USING btree (status, starts_at);
CREATE INDEX appointments_user_id_idx ON public.appointments USING btree (user_id);
CREATE INDEX availability_blocks_starts_at_idx ON public.availability_blocks USING btree (starts_at);
CREATE INDEX certificates_code_idx ON public.certificates USING btree (code);
CREATE INDEX certificates_user_id_issued_at_idx ON public.certificates USING btree (user_id, issued_at DESC);
CREATE INDEX course_reviews_course_id_is_published_created_at_idx ON public.course_reviews USING btree (course_id, is_published, created_at DESC);
CREATE INDEX courses_is_published_display_order_idx ON public.courses USING btree (is_published, display_order);
CREATE INDEX enrollments_course_id_status_idx ON public.enrollments USING btree (course_id, status);
CREATE INDEX enrollments_user_id_status_idx ON public.enrollments USING btree (user_id, status);
CREATE INDEX lesson_answers_question_created_idx ON public.lesson_answers USING btree (question_id, created_at);
CREATE INDEX lesson_progress_user_id_idx ON public.lesson_progress USING btree (user_id);
CREATE INDEX lesson_questions_lesson_created_idx ON public.lesson_questions USING btree (lesson_id, created_at DESC);
CREATE INDEX lesson_questions_user_idx ON public.lesson_questions USING btree (user_id);
CREATE INDEX lessons_course_id_display_order_idx ON public.lessons USING btree (course_id, display_order);
CREATE INDEX modules_course_id_display_order_idx ON public.modules USING btree (course_id, display_order);
CREATE INDEX newsletter_subscribers_email_idx ON public.newsletter_subscribers USING btree (email);
CREATE INDEX newsletter_subscribers_subscribed_at_idx ON public.newsletter_subscribers USING btree (subscribed_at DESC);
CREATE INDEX orders_payment_id_idx ON public.orders USING btree (payment_id);
CREATE INDEX orders_payment_preference_id_idx ON public.orders USING btree (payment_preference_id);
CREATE INDEX orders_status_created_at_idx ON public.orders USING btree (status, created_at DESC);
CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);
CREATE INDEX posts_pub_idx ON public.posts USING btree (is_published, published_at DESC);
CREATE INDEX products_is_active_display_order_idx ON public.products USING btree (is_active, display_order);
CREATE INDEX products_slug_idx ON public.products USING btree (slug);
CREATE INDEX quiz_attempts_quiz_id_user_id_idx ON public.quiz_attempts USING btree (quiz_id, user_id);
CREATE INDEX quiz_attempts_user_id_attempted_at_idx ON public.quiz_attempts USING btree (user_id, attempted_at DESC);
CREATE INDEX quiz_questions_quiz_id_display_order_idx ON public.quiz_questions USING btree (quiz_id, display_order);
CREATE INDEX quizzes_lesson_id_idx ON public.quizzes USING btree (lesson_id);
CREATE INDEX wishlist_items_user_id_added_at_idx ON public.wishlist_items USING btree (user_id, added_at DESC);
CREATE TRIGGER touch_app_settings_trg BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.touch_app_settings();
CREATE TRIGGER touch_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_courses BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_lesson_questions BEFORE UPDATE ON public.lesson_questions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_lessons BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_posts BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_quizzes BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_reviews BEFORE UPDATE ON public.course_reviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);
ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lesson_answers
    ADD CONSTRAINT lesson_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.lesson_questions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lesson_answers
    ADD CONSTRAINT lesson_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lesson_questions
    ADD CONSTRAINT lesson_questions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lesson_questions
    ADD CONSTRAINT lesson_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
CREATE POLICY answers_delete_own_or_staff ON public.lesson_answers FOR DELETE USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY answers_insert_enrolled ON public.lesson_answers FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.lesson_questions q
  WHERE ((q.id = lesson_answers.question_id) AND (public.is_enrolled_in_lesson(q.lesson_id) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))))))));
CREATE POLICY answers_read_if_question_visible ON public.lesson_answers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.lesson_questions q
  WHERE ((q.id = lesson_answers.question_id) AND (public.is_enrolled_in_lesson(q.lesson_id) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])))))));
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointments_read_own_or_staff ON public.appointments FOR SELECT USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY appointments_update_staff ON public.appointments FOR UPDATE USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_blocks_public_read ON public.availability_blocks FOR SELECT USING (true);
CREATE POLICY availability_blocks_write_staff ON public.availability_blocks USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_rules_public_read ON public.availability_rules FOR SELECT USING (true);
CREATE POLICY availability_rules_write_staff ON public.availability_rules USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY certificates_select_public ON public.certificates FOR SELECT USING (true);
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_public_read ON public.courses FOR SELECT USING (((is_published = true) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY courses_write_staff ON public.courses USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrollments_insert_self ON public.enrollments FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY enrollments_select_own_or_staff ON public.enrollments FOR SELECT USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY enrollments_update_own_or_staff ON public.enrollments FOR UPDATE USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
ALTER TABLE public.lesson_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY lessons_public_read ON public.lessons FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = lessons.course_id) AND (c.is_published OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])))))));
CREATE POLICY lessons_write_staff ON public.lessons USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY modules_public_read ON public.modules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = modules.course_id) AND (c.is_published OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])))))));
CREATE POLICY modules_write_staff ON public.modules USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
CREATE POLICY newsletter_read_staff ON public.newsletter_subscribers FOR SELECT USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY newsletter_write_staff ON public.newsletter_subscribers USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_read_own_or_staff ON public.orders FOR SELECT USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY orders_update_staff ON public.orders FOR UPDATE USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_public_read ON public.posts FOR SELECT USING ((is_published OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY posts_write_staff ON public.posts USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_public_read ON public.products FOR SELECT USING ((is_active OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY products_write_staff ON public.products USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own_or_staff ON public.profiles FOR SELECT USING (((id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY progress_insert_own ON public.lesson_progress FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY progress_select_own_or_staff ON public.lesson_progress FOR SELECT USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY progress_update_own ON public.lesson_progress FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY questions_delete_own_or_staff ON public.lesson_questions FOR DELETE USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY questions_insert_enrolled ON public.lesson_questions FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (public.is_enrolled_in_lesson(lesson_id) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])))));
CREATE POLICY questions_read_enrolled_or_staff ON public.lesson_questions FOR SELECT USING ((public.is_enrolled_in_lesson(lesson_id) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY questions_update_own_or_staff ON public.lesson_questions FOR UPDATE USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])))) WITH CHECK (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY quiz_attempts_insert_own ON public.quiz_attempts FOR INSERT WITH CHECK ((user_id = auth.uid()));
CREATE POLICY quiz_attempts_select_own_or_staff ON public.quiz_attempts FOR SELECT USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY quiz_questions_select_staff ON public.quiz_questions FOR SELECT USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
CREATE POLICY quiz_questions_write_staff ON public.quiz_questions USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quizzes_select_public_or_staff ON public.quizzes FOR SELECT USING (((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])) OR (is_published AND (EXISTS ( SELECT 1
   FROM (public.lessons l
     JOIN public.courses c ON ((c.id = l.course_id)))
  WHERE ((l.id = quizzes.lesson_id) AND c.is_published))))));
CREATE POLICY quizzes_write_staff ON public.quizzes USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
CREATE POLICY reviews_delete_own_or_staff ON public.course_reviews FOR DELETE USING (((user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY reviews_insert_enrolled ON public.course_reviews FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.enrollments
  WHERE ((enrollments.user_id = auth.uid()) AND (enrollments.course_id = course_reviews.course_id) AND (enrollments.status = 'active'::public.enrollment_status))))));
CREATE POLICY reviews_select_public_or_staff ON public.course_reviews FOR SELECT USING ((is_published OR (user_id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY reviews_update_own ON public.course_reviews FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_public_read ON public.services FOR SELECT USING ((is_active OR (public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))));
CREATE POLICY services_write_staff ON public.services USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
CREATE POLICY settings_read_staff ON public.app_settings FOR SELECT USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
CREATE POLICY settings_write_staff ON public.app_settings USING ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role]))) WITH CHECK ((public.current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY wishlist_own ON public.wishlist_items USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_blocks TO authenticated;
GRANT ALL ON public.availability_blocks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_rules TO authenticated;
GRANT ALL ON public.availability_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_reviews TO authenticated;
GRANT ALL ON public.course_reviews TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_answers TO authenticated;
GRANT ALL ON public.lesson_answers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_questions TO authenticated;
GRANT ALL ON public.lesson_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
GRANT SELECT ON public.availability_blocks TO anon;
GRANT SELECT ON public.availability_rules TO anon;
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT ON public.modules TO anon;
GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.course_reviews TO anon;
GRANT SELECT ON public.quizzes TO anon;
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT ON public.course_rating_summary TO anon, authenticated;
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;
GRANT SELECT ON public.my_course_progress TO authenticated;
GRANT SELECT ON public.taken_slots TO anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();