-- Update RLS policy to allow OCU and CO to view all reports for review
DROP POLICY IF EXISTS "Users can view reports from their cases" ON public.reports;

CREATE POLICY "Users can view reports from their cases"
ON public.reports
FOR SELECT
TO authenticated
USING (
  (generated_by = auth.uid()) 
  OR (reviewed_by = auth.uid()) 
  OR (EXISTS (
    SELECT 1
    FROM cases
    WHERE cases.id = reports.case_id 
    AND (cases.assigned_to = auth.uid() OR cases.supervisor_id = auth.uid())
  ))
  OR (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('administrator', 'supervisor', 'officer_commanding_unit', 'commanding_officer')
  ))
);