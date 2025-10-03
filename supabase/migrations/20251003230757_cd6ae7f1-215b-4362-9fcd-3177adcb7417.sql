-- Reset system by removing all demo data while preserving structure
-- This will clear all cases, exhibits, reports, activities, and test users

-- Delete all report submissions
DELETE FROM public.report_submissions;

-- Delete all reports
DELETE FROM public.reports;

-- Delete all case activities
DELETE FROM public.case_activities;

-- Delete all exhibits
DELETE FROM public.exhibits;

-- Delete all cases
DELETE FROM public.cases;

-- Delete all user sessions except current admin
DELETE FROM public.user_sessions 
WHERE user_id NOT IN (
  SELECT id FROM public.profiles 
  WHERE role IN ('admin', 'administrator')
);

-- Delete all audit logs (optional - keeps audit trail clean)
DELETE FROM public.audit_logs;

-- Delete all role permissions and recreate fresh set
DELETE FROM public.role_permissions;

-- Recreate essential role permissions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('administrator', 'manage_users'),
  ('administrator', 'manage_cases'),
  ('administrator', 'manage_exhibits'),
  ('administrator', 'view_all_data'),
  ('administrator', 'manage_system'),
  ('commanding_officer', 'view_all_cases'),
  ('commanding_officer', 'approve_reports'),
  ('commanding_officer', 'manage_priorities'),
  ('officer_commanding_unit', 'assign_cases'),
  ('officer_commanding_unit', 'assign_exhibits'),
  ('officer_commanding_unit', 'review_reports'),
  ('supervisor', 'view_team_data'),
  ('supervisor', 'assign_work'),
  ('exhibit_officer', 'manage_exhibits'),
  ('exhibit_officer', 'chain_custody'),
  ('forensic_analyst', 'analyze_evidence'),
  ('forensic_analyst', 'create_reports'),
  ('analyst', 'analyze_cases'),
  ('analyst', 'submit_reports'),
  ('investigator', 'create_cases'),
  ('investigator', 'view_cases'),
  ('case_officer', 'manage_case_files'),
  ('case_officer', 'update_status');

-- Note: This preserves all admin users but you may want to manually review
-- and keep only the real admin accounts. Use the Users page to delete any test admin accounts.