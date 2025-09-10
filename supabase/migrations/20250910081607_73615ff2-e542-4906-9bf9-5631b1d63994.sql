-- Drop the overly permissive policy that allows all users to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more restrictive policy that follows the principle of least privilege
CREATE POLICY "Restricted profile access based on role and case involvement" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always view their own profile
  id = auth.uid() 
  OR 
  -- Administrators and commanding officers can view all profiles for management
  (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('administrator', 'commanding_officer')
    )
  )
  OR
  -- Supervisors can view profiles of users in their department/cases
  (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'supervisor'
    )
    AND (
      -- Same department
      department = (SELECT department FROM public.profiles WHERE id = auth.uid())
      OR
      -- Involved in same cases as supervisor
      id IN (
        SELECT DISTINCT COALESCE(c.assigned_to, c.supervisor_id, c.analyst_id, c.exhibit_officer_id)
        FROM public.cases c
        WHERE c.supervisor_id = auth.uid()
      )
    )
  )
  OR
  -- Users can view profiles of colleagues they work with on the same cases
  (
    id IN (
      -- Get users from cases where the current user is involved
      SELECT DISTINCT COALESCE(c.assigned_to, c.supervisor_id, c.analyst_id, c.exhibit_officer_id)
      FROM public.cases c
      WHERE c.assigned_to = auth.uid() 
         OR c.supervisor_id = auth.uid()
         OR c.analyst_id = auth.uid() 
         OR c.exhibit_officer_id = auth.uid()
      
      UNION
      
      -- Get users from exhibits where the current user is involved
      SELECT DISTINCT COALESCE(e.assigned_analyst, e.received_by)
      FROM public.exhibits e
      WHERE e.assigned_analyst = auth.uid() 
         OR e.received_by = auth.uid()
    )
  )
);