-- Fix RLS policies to allow exhibit officers to create and manage exhibits and cases

-- Update cases table RLS policy to include exhibit_officer role
DROP POLICY IF EXISTS "Admins, supervisors and OCU can manage cases" ON public.cases;

CREATE POLICY "Authorized users can manage cases" 
ON public.cases 
FOR ALL 
USING (
  ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['laurentkalugula@gmail.com'::text, 'admin@police.go.tz'::text])) 
  OR (get_current_user_role() = ANY (ARRAY['admin'::text, 'administrator'::text, 'supervisor'::text, 'commanding_officer'::text, 'officer_commanding_unit'::text, 'exhibit_officer'::text]))
  OR (assigned_to = auth.uid()) 
  OR (supervisor_id = auth.uid()) 
  OR (analyst_id = auth.uid()) 
  OR (exhibit_officer_id = auth.uid())
);

-- Update exhibits table RLS policy to include exhibit_officer role
DROP POLICY IF EXISTS "Analysts, supervisors and OCU can manage exhibits" ON public.exhibits;

CREATE POLICY "Authorized users can manage exhibits" 
ON public.exhibits 
FOR ALL 
USING (
  (assigned_analyst = auth.uid()) 
  OR (received_by = auth.uid())
  OR (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['administrator'::user_role, 'supervisor'::user_role, 'forensic_analyst'::user_role, 'officer_commanding_unit'::user_role, 'exhibit_officer'::user_role])))
  OR (EXISTS ( SELECT 1 FROM cases WHERE cases.id = exhibits.case_id AND (cases.assigned_to = auth.uid() OR cases.supervisor_id = auth.uid() OR cases.exhibit_officer_id = auth.uid())))
);