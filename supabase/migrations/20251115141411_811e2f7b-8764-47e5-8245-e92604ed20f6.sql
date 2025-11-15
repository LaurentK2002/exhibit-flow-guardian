-- Update RLS policies to include chief_of_cyber role for sensitive operations

-- 1. Allow Chief of Cyber to view all cases
CREATE POLICY "Chief of Cyber can view all cases"
ON public.cases
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 2. Allow Chief of Cyber to view all profiles
CREATE POLICY "Chief of Cyber can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 3. Allow Chief of Cyber to view all exhibits
CREATE POLICY "Chief of Cyber can view all exhibits"
ON public.exhibits
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 4. Allow Chief of Cyber to view audit logs (sensitive operation)
CREATE POLICY "Chief of Cyber can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 5. Allow Chief of Cyber to approve case approvals
CREATE POLICY "Chief of Cyber can approve cases"
ON public.case_approvals
FOR UPDATE
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 6. Allow Chief of Cyber to view all case approvals
CREATE POLICY "Chief of Cyber can view all approvals"
ON public.case_approvals
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 7. Allow Chief of Cyber to view all reports
CREATE POLICY "Chief of Cyber can view all reports"
ON public.reports
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 8. Allow Chief of Cyber to view all report submissions
CREATE POLICY "Chief of Cyber can view all submissions"
ON public.report_submissions
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 9. Allow Chief of Cyber to update report submissions
CREATE POLICY "Chief of Cyber can update submissions"
ON public.report_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 10. Allow Chief of Cyber to view all user roles
CREATE POLICY "Chief of Cyber can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'chief_of_cyber'));

-- 11. Allow Chief of Cyber to manage cases
CREATE POLICY "Chief of Cyber can manage cases"
ON public.cases
FOR ALL
USING (has_role(auth.uid(), 'chief_of_cyber'));