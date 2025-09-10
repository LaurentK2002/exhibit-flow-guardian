-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their assigned cases" ON public.cases;
DROP POLICY IF EXISTS "Admins and supervisors can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Admins and supervisors can manage cases" ON public.cases;

-- Now create simple, non-recursive profile policies
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
  public.get_current_user_role() IN ('admin', 'administrator')
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
  public.get_current_user_role() IN ('admin', 'administrator')
);

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  public.get_current_user_role() IN ('admin', 'administrator')
);

-- Create simpler cases policies using security definer function
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
  public.get_current_user_role() IN ('admin', 'administrator', 'supervisor', 'commanding_officer')
);

CREATE POLICY "Admins and supervisors can manage cases" 
ON public.cases 
FOR ALL 
USING (
  auth.jwt() ->> 'email' = ANY(ARRAY['laurentkalugula@gmail.com', 'admin@police.go.tz'])
  OR 
  public.get_current_user_role() IN ('admin', 'administrator', 'supervisor', 'commanding_officer')
);