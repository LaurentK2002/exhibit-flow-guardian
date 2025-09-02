-- Second migration: Update existing roles and create role permissions
UPDATE profiles 
SET role = CASE 
  WHEN role = 'administrator' THEN 'admin'
  WHEN role = 'forensic_analyst' THEN 'analyst'
  WHEN role = 'supervisor' THEN 'commanding_officer'
  WHEN role = 'investigator' THEN 'exhibit_officer'
  ELSE role
END;

-- Create role_permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, permission)
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for role_permissions
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, permission) VALUES
-- Admin permissions
('admin', 'manage_users'),
('admin', 'manage_cases'),
('admin', 'manage_exhibits'),
('admin', 'view_analytics'),
('admin', 'system_config'),
('admin', 'manage_permissions'),

-- Commanding Officer permissions
('commanding_officer', 'assign_cases'),
('commanding_officer', 'assign_exhibits'),
('commanding_officer', 'view_team_analytics'),
('commanding_officer', 'manage_analysts'),
('commanding_officer', 'approve_reports'),

-- Exhibit Officer permissions
('exhibit_officer', 'receive_exhibits'),
('exhibit_officer', 'manage_chain_custody'),
('exhibit_officer', 'view_exhibit_status'),
('exhibit_officer', 'generate_exhibit_reports'),

-- Analyst permissions
('analyst', 'analyze_exhibits'),
('analyst', 'create_reports'),
('analyst', 'view_assigned_cases'),
('analyst', 'update_analysis_status')
ON CONFLICT (role, permission) DO NOTHING;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN role_permissions rp ON p.role = rp.role
    WHERE p.id = user_id AND rp.permission = permission_name
  );
$$;

-- Update case assignments to support role-based assignment
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS analyst_id UUID,
ADD COLUMN IF NOT EXISTS exhibit_officer_id UUID;