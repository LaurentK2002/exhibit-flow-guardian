-- Add new user role 'officer_commanding_unit' to the enum
ALTER TYPE user_role ADD VALUE 'officer_commanding_unit';

-- Add permissions for the Officer Commanding Unit role
INSERT INTO role_permissions (role, permission) VALUES 
  ('officer_commanding_unit', 'view_all_cases'),
  ('officer_commanding_unit', 'assign_exhibits'),
  ('officer_commanding_unit', 'manage_exhibits'),
  ('officer_commanding_unit', 'view_all_exhibits'),
  ('officer_commanding_unit', 'create_reports'),
  ('officer_commanding_unit', 'view_analytics'),
  ('officer_commanding_unit', 'manage_analysts'),
  ('officer_commanding_unit', 'view_team'),
  ('officer_commanding_unit', 'update_case_status');

-- Update exhibits RLS policy to include officer_commanding_unit
DROP POLICY IF EXISTS "Analysts and supervisors can manage exhibits" ON exhibits;

CREATE POLICY "Analysts, supervisors and OCU can manage exhibits" 
ON exhibits 
FOR ALL 
USING (
  assigned_analyst = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('administrator', 'supervisor', 'forensic_analyst', 'officer_commanding_unit')
  )
);

-- Update cases RLS policy to include officer_commanding_unit for viewing all cases
DROP POLICY IF EXISTS "Admins and supervisors can view all cases" ON cases;

CREATE POLICY "Admins, supervisors and OCU can view all cases" 
ON cases 
FOR SELECT 
USING (
  (auth.jwt() ->> 'email') = ANY (ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz']) OR 
  get_current_user_role() = ANY (ARRAY['admin', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit'])
);

-- Update cases management policy to include officer_commanding_unit
DROP POLICY IF EXISTS "Admins and supervisors can manage cases" ON cases;

CREATE POLICY "Admins, supervisors and OCU can manage cases" 
ON cases 
FOR ALL 
USING (
  (auth.jwt() ->> 'email') = ANY (ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz']) OR 
  get_current_user_role() = ANY (ARRAY['admin', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit'])
);