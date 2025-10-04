-- Add indexes to improve query performance for case assignment
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON public.cases(assigned_to) WHERE assigned_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_analyst_lookup ON public.profiles(role) WHERE role = 'analyst' AND is_active = true;