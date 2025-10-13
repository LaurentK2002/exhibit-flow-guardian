-- Fix user deletion by updating FKs referencing auth.users
-- Strategy:
-- - Keep records but nullify user references for domain tables (SET NULL)
-- - Cascade delete for purely user-owned tables (CASCADE)

-- CASES
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_assigned_to_fkey;
ALTER TABLE public.cases ADD CONSTRAINT cases_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_supervisor_id_fkey;
ALTER TABLE public.cases ADD CONSTRAINT cases_supervisor_id_fkey
  FOREIGN KEY (supervisor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_analyst_id_fkey;
ALTER TABLE public.cases ADD CONSTRAINT cases_analyst_id_fkey
  FOREIGN KEY (analyst_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_exhibit_officer_id_fkey;
ALTER TABLE public.cases ADD CONSTRAINT cases_exhibit_officer_id_fkey
  FOREIGN KEY (exhibit_officer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- EXHIBITS
ALTER TABLE public.exhibits DROP CONSTRAINT IF EXISTS exhibits_received_by_fkey;
ALTER TABLE public.exhibits ADD CONSTRAINT exhibits_received_by_fkey
  FOREIGN KEY (received_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.exhibits DROP CONSTRAINT IF EXISTS exhibits_assigned_analyst_fkey;
ALTER TABLE public.exhibits ADD CONSTRAINT exhibits_assigned_analyst_fkey
  FOREIGN KEY (assigned_analyst) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CASE ACTIVITIES
ALTER TABLE public.case_activities DROP CONSTRAINT IF EXISTS case_activities_user_id_fkey;
ALTER TABLE public.case_activities ADD CONSTRAINT case_activities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- REPORTS
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_generated_by_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_generated_by_fkey
  FOREIGN KEY (generated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reviewed_by_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- REPORT SUBMISSIONS
ALTER TABLE public.report_submissions DROP CONSTRAINT IF EXISTS report_submissions_analyst_id_fkey;
ALTER TABLE public.report_submissions ADD CONSTRAINT report_submissions_analyst_id_fkey
  FOREIGN KEY (analyst_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.report_submissions DROP CONSTRAINT IF EXISTS report_submissions_reviewed_by_fkey;
ALTER TABLE public.report_submissions ADD CONSTRAINT report_submissions_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CASE APPROVALS
ALTER TABLE public.case_approvals DROP CONSTRAINT IF EXISTS case_approvals_submitted_by_fkey;
ALTER TABLE public.case_approvals ADD CONSTRAINT case_approvals_submitted_by_fkey
  FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.case_approvals DROP CONSTRAINT IF EXISTS case_approvals_approved_by_fkey;
ALTER TABLE public.case_approvals ADD CONSTRAINT case_approvals_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- USER-OWNED TABLES (CASCADE)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
