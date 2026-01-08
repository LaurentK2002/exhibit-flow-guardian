
-- Drop existing SELECT policy that's too permissive
DROP POLICY IF EXISTS "Users can view case reports" ON public.reports;

-- Create new policy: Exhibit officers can only see their own reports
-- OCU, CO, Chief of Cyber, and admins can see exhibit officer reports
-- Other roles can see reports they created, reviewed, or are assigned to the case
CREATE POLICY "Users can view case reports" ON public.reports
FOR SELECT TO authenticated
USING (
  -- User created the report
  generated_by = auth.uid()
  OR 
  -- User reviewed the report
  reviewed_by = auth.uid()
  OR
  -- User is assigned to or supervises the case
  EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = reports.case_id 
    AND (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid())
  )
  OR
  -- Administrator can see all
  has_role(auth.uid(), 'administrator'::app_role)
  OR
  -- Supervisor can see all
  has_role(auth.uid(), 'supervisor'::app_role)
  OR
  -- OCU can see all reports (including exhibit officer reports)
  has_role(auth.uid(), 'officer_commanding_unit'::app_role)
  OR
  -- CO can see all except exhibit officer reports (unless they're OCU)
  (
    has_role(auth.uid(), 'commanding_officer'::app_role)
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = reports.generated_by 
      AND ur.role = 'exhibit_officer'::app_role
    )
  )
);

-- Chief of Cyber policy already exists and allows viewing all reports
