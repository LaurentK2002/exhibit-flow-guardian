-- Fix infinite recursion in policies by simplifying profile access
-- Drop problematic policies and recreate them more simply

-- Fix profiles table policies to prevent recursion
DROP POLICY IF EXISTS "Restricted profile access based on role and case involvement" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create simple, non-recursive profile policies
CREATE POLICY "Users can read their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'administrator')
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'administrator')
  )
);

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'administrator')
  )
);

-- Fix cases table policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view cases they're involved in" ON public.cases;
DROP POLICY IF EXISTS "Supervisors and admins can manage cases" ON public.cases;

-- Create simpler cases policies
CREATE POLICY "Users can view their assigned cases" 
ON public.cases 
FOR SELECT 
USING (
  assigned_to = auth.uid() 
  OR supervisor_id = auth.uid()
  OR analyst_id = auth.uid()
  OR exhibit_officer_id = auth.uid()
);

CREATE POLICY "Admins and supervisors can view all cases" 
ON public.cases 
FOR SELECT 
USING (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'administrator', 'supervisor', 'commanding_officer')
  )
);

CREATE POLICY "Admins and supervisors can manage cases" 
ON public.cases 
FOR ALL 
USING (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'administrator', 'supervisor', 'commanding_officer')
  )
);