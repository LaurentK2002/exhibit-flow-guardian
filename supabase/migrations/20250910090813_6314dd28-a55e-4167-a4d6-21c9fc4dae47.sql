-- Phase 1: Critical Security Fixes (Fixed)

-- 1. Fix role permissions mismatch - update 'admin' to 'administrator'
UPDATE public.role_permissions 
SET role = 'administrator'::user_role 
WHERE role = 'admin'::user_role;

-- 2. Drop and recreate the role_permissions RLS policy properly
DROP POLICY IF EXISTS "Administrators can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;

CREATE POLICY "Administrators can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'administrator'::user_role
  )
);

-- 3. Create security definer functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT department FROM public.profiles WHERE id = auth.uid();
$$;