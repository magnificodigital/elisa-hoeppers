-- SEGURANÇA: agenda podia ser lotada com reservas falsas; nome/obs iam sem limpeza para os e-mails.
CREATE OR REPLACE FUNCTION public.book_appointment(p_service_id uuid, p_starts_at timestamp with time zone, p_customer_name text, p_customer_email text, p_customer_phone text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(appointment_id uuid, code text, starts_at timestamp with time zone, ends_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Anti-abuso: até 180 dias à frente e no máximo 3 reservas pendentes por e-mail.
  if p_starts_at > now() + interval '180 days' then raise exception 'slot too far in the future'; end if;
  if (select count(*) from public.appointments
       where lower(customer_email) = lower(trim(p_customer_email))
         and status = 'pending' and starts_at > now()) >= 3 then
    raise exception 'too many pending bookings';
  end if;
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
        (v_code, p_service_id, v_user_id, regexp_replace(trim(p_customer_name), '[<>]', '', 'g'), regexp_replace(trim(p_customer_email), '[<>"'' ]', '', 'g'), regexp_replace(coalesce(p_customer_phone, ''), '[<>]', '', 'g'), p_starts_at, v_ends_at, regexp_replace(coalesce(p_notes, ''), '[<>]', '', 'g'), 'pending')
      returning id into v_appt_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;
  return query select v_appt_id, v_code, p_starts_at, v_ends_at;
end;
$function$

;
