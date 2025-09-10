-- Phase 1: Critical Security Fixes

-- 1. Fix role permissions mismatch - update 'admin' to 'administrator'
UPDATE public.role_permissions 
SET role = 'administrator'::user_role 
WHERE role = 'admin'::user_role;

-- 2. Update the role_permissions RLS policy to use 'administrator' instead of 'admin'
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

-- 3. Create security definer function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 4. Create function to get current user department
CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT department FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Recreate the profiles RLS policy using security definer functions to prevent recursion
DROP POLICY IF EXISTS "Restricted profile access based on role and case involvement" ON public.profiles;

CREATE POLICY "Restricted profile access based on role and case involvement" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always view their own profile
  id = auth.uid() 
  OR 
  -- Administrators and commanding officers can view all profiles
  public.get_current_user_role() IN ('administrator', 'commanding_officer')
  OR
  -- Supervisors can view profiles in their department or related cases
  (
    public.get_current_user_role() = 'supervisor'
    AND (
      -- Same department
      department = public.get_current_user_department()
      OR
      -- Involved in cases supervised by current user
      id IN (
        SELECT DISTINCT COALESCE(c.assigned_to, c.supervisor_id, c.analyst_id, c.exhibit_officer_id)
        FROM public.cases c
        WHERE c.supervisor_id = auth.uid()
      )
    )
  )
  OR
  -- Users can view profiles of colleagues they work with
  id IN (
    -- Users from same cases
    SELECT DISTINCT COALESCE(c.assigned_to, c.supervisor_id, c.analyst_id, c.exhibit_officer_id)
    FROM public.cases c
    WHERE c.assigned_to = auth.uid() 
       OR c.supervisor_id = auth.uid()
       OR c.analyst_id = auth.uid() 
       OR c.exhibit_officer_id = auth.uid()
    
    UNION
    
    -- Users from same exhibits
    SELECT DISTINCT COALESCE(e.assigned_analyst, e.received_by)
    FROM public.exhibits e
    WHERE e.assigned_analyst = auth.uid() 
       OR e.received_by = auth.uid()
  )
);