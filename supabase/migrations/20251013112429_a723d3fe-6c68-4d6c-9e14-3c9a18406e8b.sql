-- Delete all cases to start fresh
DELETE FROM public.cases;

-- Also delete related data
DELETE FROM public.exhibits;
DELETE FROM public.case_activities;
DELETE FROM public.case_approvals;
DELETE FROM public.reports;
DELETE FROM public.report_submissions;