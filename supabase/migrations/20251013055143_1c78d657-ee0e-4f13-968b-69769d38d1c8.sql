-- Drop the existing restrictive policy for viewing exhibits
DROP POLICY IF EXISTS "Users can view exhibits from their cases" ON public.exhibits;

-- Create a new policy that includes commanding_officer
CREATE POLICY "Users can view exhibits from their cases"
ON public.exhibits
FOR SELECT
TO authenticated
USING (
  (assigned_analyst = auth.uid()) 
  OR (received_by = auth.uid()) 
  OR (EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = exhibits.case_id 
    AND (cases.assigned_to = auth.uid() OR cases.supervisor_id = auth.uid())
  ))
  OR (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['administrator'::user_role, 'supervisor'::user_role, 'commanding_officer'::user_role, 'officer_commanding_unit'::user_role])
  ))
);