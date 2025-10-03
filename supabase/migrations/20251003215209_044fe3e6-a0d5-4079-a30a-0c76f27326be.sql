-- WARNING: This will permanently delete all exhibits and cases
-- This action cannot be undone

-- Delete all case activities first (referenced by cases)
DELETE FROM public.case_activities;

-- Delete all reports (referenced by cases and exhibits)
DELETE FROM public.reports;

-- Delete all exhibits
DELETE FROM public.exhibits;

-- Delete all cases
DELETE FROM public.cases;

-- The lab number will automatically reset since generate_case_lab_number()
-- function looks for the highest existing lab number in the current year