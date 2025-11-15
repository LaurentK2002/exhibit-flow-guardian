-- Migration: Fix Critical Security Issues - Complete Policy Cleanup
-- Drop ALL policies that reference profiles.role before removing the column

-- ============================================
-- STEP 1: Drop ALL policies that depend on profiles.role
-- ============================================

-- Case activities policies
DROP POLICY IF EXISTS "Users can view activities from their cases" ON public.case_activities;
DROP POLICY IF EXISTS "All authenticated users can create activities" ON public.case_activities;

-- Reports policies
DROP POLICY IF EXISTS "Users can manage their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view reports from their cases" ON public.reports;

-- Role permissions policies
DROP POLICY IF EXISTS "Administrators can manage role permissions" ON public.role_permissions;

-- Exhibits policies
DROP POLICY IF EXISTS "Authorized users can manage exhibits" ON public.exhibits;
DROP POLICY IF EXISTS "Users can view exhibits from their cases" ON public.exhibits;

-- Report submissions policies
DROP POLICY IF EXISTS "OCU and CO can view all submissions" ON public.report_submissions;
DROP POLICY IF EXISTS "OCU and CO can update submissions" ON public.report_submissions;
DROP POLICY IF EXISTS "Analysts can view their own submissions" ON public.report_submissions;
DROP POLICY IF EXISTS "Analysts can create submissions" ON public.report_submissions;

-- Storage policies that reference profiles.role
DROP POLICY IF EXISTS "Users can view case documents from their cases" ON storage.objects;
DROP POLICY IF EXISTS "Exhibit officers and supervisors can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Exhibit officers and supervisors can update case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can view case documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update case documents" ON storage.objects;
DROP POLICY IF EXISTS "Administrators can delete case documents" ON storage.objects;
DROP POLICY IF EXISTS "OCU and CO can view all analysis reports" ON storage.objects;
DROP POLICY IF EXISTS "Analysts can view reference letters for their cases" ON storage.objects;
DROP POLICY IF EXISTS "Exhibit officers can upload reference letters" ON storage.objects;
DROP POLICY IF EXISTS "Exhibit officers can delete reference letters" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update reference letters" ON storage.objects;

-- Profiles policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "CO can view all profiles for case oversight" ON public.profiles;
DROP POLICY IF EXISTS "OCU and CO can view analysts for case assignment" ON public.profiles;
DROP POLICY IF EXISTS "Exhibit officers can view analysts" ON public.profiles;

-- Cases policies
DROP POLICY IF EXISTS "Admins, supervisors and OCU can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Authorized users can manage cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view their assigned cases" ON public.cases;

-- ============================================
-- STEP 2: Migrate roles from profiles to user_roles
-- ============================================

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role::text::app_role
FROM public.profiles p
WHERE p.role IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- STEP 3: Drop the profiles.role column
-- ============================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- ============================================
-- STEP 4: Recreate ALL policies using security definer functions
-- ============================================

-- PROFILES TABLE
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "CO can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'commanding_officer'::app_role));

CREATE POLICY "Officers can view colleagues on shared cases" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE (c.assigned_to = auth.uid() OR c.analyst_id = auth.uid() OR c.exhibit_officer_id = auth.uid())
    AND (c.assigned_to = profiles.id OR c.analyst_id = profiles.id OR c.exhibit_officer_id = profiles.id OR c.supervisor_id = profiles.id)
  )
);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role));

-- CASES TABLE
CREATE POLICY "Admins and supervisors can view all cases" ON public.cases
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'administrator'::app_role) OR
  public.has_role(auth.uid(), 'supervisor'::app_role) OR
  public.has_role(auth.uid(), 'commanding_officer'::app_role) OR
  public.has_role(auth.uid(), 'officer_commanding_unit'::app_role)
);

CREATE POLICY "Users can view assigned cases" ON public.cases
FOR SELECT TO authenticated
USING (assigned_to = auth.uid() OR supervisor_id = auth.uid() OR analyst_id = auth.uid() OR exhibit_officer_id = auth.uid());

CREATE POLICY "Authorized users can manage cases" ON public.cases
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role) OR
  public.has_role(auth.uid(), 'supervisor'::app_role) OR public.has_role(auth.uid(), 'commanding_officer'::app_role) OR
  public.has_role(auth.uid(), 'officer_commanding_unit'::app_role) OR public.has_role(auth.uid(), 'exhibit_officer'::app_role) OR
  assigned_to = auth.uid() OR supervisor_id = auth.uid() OR analyst_id = auth.uid() OR exhibit_officer_id = auth.uid()
);

-- CASE ACTIVITIES
CREATE POLICY "Users can create activities" ON public.case_activities
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view case activities" ON public.case_activities
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_activities.case_id AND 
          (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid() OR c.analyst_id = auth.uid())) OR
  public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'supervisor'::app_role)
);

-- REPORTS
CREATE POLICY "Users can manage own reports" ON public.reports
FOR ALL TO authenticated
USING (
  generated_by = auth.uid() OR 
  public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Users can view case reports" ON public.reports
FOR SELECT TO authenticated
USING (
  generated_by = auth.uid() OR reviewed_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = reports.case_id AND 
          (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid())) OR
  public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'supervisor'::app_role) OR
  public.has_role(auth.uid(), 'officer_commanding_unit'::app_role) OR public.has_role(auth.uid(), 'commanding_officer'::app_role)
);

-- ROLE PERMISSIONS
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'administrator'::app_role));

-- EXHIBITS
CREATE POLICY "Authorized users can manage exhibits" ON public.exhibits
FOR ALL TO authenticated
USING (
  assigned_analyst = auth.uid() OR received_by = auth.uid() OR
  public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'supervisor'::app_role) OR
  public.has_role(auth.uid(), 'forensic_analyst'::app_role) OR public.has_role(auth.uid(), 'officer_commanding_unit'::app_role) OR
  public.has_role(auth.uid(), 'exhibit_officer'::app_role) OR
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = exhibits.case_id AND 
          (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid() OR c.exhibit_officer_id = auth.uid()))
);

CREATE POLICY "Users can view case exhibits" ON public.exhibits
FOR SELECT TO authenticated
USING (
  assigned_analyst = auth.uid() OR received_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = exhibits.case_id AND 
          (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid())) OR
  public.has_role(auth.uid(), 'administrator'::app_role) OR public.has_role(auth.uid(), 'supervisor'::app_role) OR
  public.has_role(auth.uid(), 'commanding_officer'::app_role) OR public.has_role(auth.uid(), 'officer_commanding_unit'::app_role)
);

-- REPORT SUBMISSIONS
CREATE POLICY "Analysts can create submissions" ON public.report_submissions
FOR INSERT TO authenticated
WITH CHECK (analyst_id = auth.uid());

CREATE POLICY "Analysts can view own submissions" ON public.report_submissions
FOR SELECT TO authenticated
USING (analyst_id = auth.uid());

CREATE POLICY "Leadership can view all submissions" ON public.report_submissions
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'officer_commanding_unit'::app_role) OR
  public.has_role(auth.uid(), 'commanding_officer'::app_role) OR
  public.has_role(auth.uid(), 'administrator'::app_role) OR
  public.has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Leadership can update submissions" ON public.report_submissions
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'officer_commanding_unit'::app_role) OR
  public.has_role(auth.uid(), 'commanding_officer'::app_role) OR
  public.has_role(auth.uid(), 'administrator'::app_role)
);

-- STORAGE: case-documents bucket
CREATE POLICY "Admins full access case documents" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'case-documents' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role)))
WITH CHECK (bucket_id = 'case-documents' AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role)));

CREATE POLICY "Supervisors full access case documents" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'case-documents' AND public.has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (bucket_id = 'case-documents' AND public.has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "OCU read case documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'case-documents' AND public.has_role(auth.uid(), 'officer_commanding_unit'::app_role));

CREATE POLICY "Case team view documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'case-documents' AND
  EXISTS (SELECT 1 FROM public.cases c WHERE name LIKE 'case-documents/' || c.id::text || '/%' AND 
          (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid() OR c.analyst_id = auth.uid() OR c.exhibit_officer_id = auth.uid()))
);

CREATE POLICY "Case team upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'case-documents' AND
  EXISTS (SELECT 1 FROM public.cases c WHERE name LIKE 'case-documents/' || c.id::text || '/%' AND 
          (c.assigned_to = auth.uid() OR c.supervisor_id = auth.uid() OR c.analyst_id = auth.uid() OR c.exhibit_officer_id = auth.uid()))
);

CREATE POLICY "Exhibit officers upload case documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'case-documents' AND public.has_role(auth.uid(), 'exhibit_officer'::app_role));

CREATE POLICY "Exhibit officers update case documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'case-documents' AND public.has_role(auth.uid(), 'exhibit_officer'::app_role));

-- STORAGE: analysis-reports bucket
CREATE POLICY "Analysts manage analysis reports" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'analysis-reports' AND (public.has_role(auth.uid(), 'analyst'::app_role) OR public.has_role(auth.uid(), 'forensic_analyst'::app_role)))
WITH CHECK (bucket_id = 'analysis-reports' AND (public.has_role(auth.uid(), 'analyst'::app_role) OR public.has_role(auth.uid(), 'forensic_analyst'::app_role)));

CREATE POLICY "Leadership view analysis reports" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'analysis-reports' AND
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'administrator'::app_role) OR
   public.has_role(auth.uid(), 'supervisor'::app_role) OR public.has_role(auth.uid(), 'commanding_officer'::app_role))
);