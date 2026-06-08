CREATE POLICY appointments_insert_staff
ON public.appointments
FOR INSERT
TO public
WITH CHECK (current_user_role() = ANY (ARRAY['instructor'::user_role, 'admin'::user_role]));