-- Add Chief of Cyber access to sensitive operations (only new policies)

-- 1. Chief of Cyber can view audit logs (sensitive operation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'audit_logs' 
    AND policyname = 'Chief of Cyber can view audit logs'
  ) THEN
    CREATE POLICY "Chief of Cyber can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;

-- 2. Chief of Cyber can approve cases
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'case_approvals' 
    AND policyname = 'Chief of Cyber can approve cases'
  ) THEN
    CREATE POLICY "Chief of Cyber can approve cases"
    ON public.case_approvals
    FOR UPDATE
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;

-- 3. Chief of Cyber can view all approvals
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'case_approvals' 
    AND policyname = 'Chief of Cyber can view all approvals'
  ) THEN
    CREATE POLICY "Chief of Cyber can view all approvals"
    ON public.case_approvals
    FOR SELECT
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;

-- 4. Chief of Cyber can view all reports
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND policyname = 'Chief of Cyber can view all reports'
  ) THEN
    CREATE POLICY "Chief of Cyber can view all reports"
    ON public.reports
    FOR SELECT
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;

-- 5. Chief of Cyber can view all submissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'report_submissions' 
    AND policyname = 'Chief of Cyber can view all submissions'
  ) THEN
    CREATE POLICY "Chief of Cyber can view all submissions"
    ON public.report_submissions
    FOR SELECT
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;

-- 6. Chief of Cyber can update submissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'report_submissions' 
    AND policyname = 'Chief of Cyber can update submissions'
  ) THEN
    CREATE POLICY "Chief of Cyber can update submissions"
    ON public.report_submissions
    FOR UPDATE
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;

-- 7. Chief of Cyber can view all roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'Chief of Cyber can view all roles'
  ) THEN
    CREATE POLICY "Chief of Cyber can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (has_role(auth.uid(), 'chief_of_cyber'));
  END IF;
END $$;