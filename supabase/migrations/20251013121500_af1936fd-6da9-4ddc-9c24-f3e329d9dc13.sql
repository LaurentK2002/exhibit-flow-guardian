-- Update get_current_user_role to check both user_roles and profiles tables
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() ORDER BY created_at ASC LIMIT 1),
    (SELECT role::text FROM public.profiles WHERE id = auth.uid())
  );
$$;