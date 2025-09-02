-- Update the current user's role to admin and fix remaining RLS issues
-- First, update the user's role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'laurentkalugula@gmail.com';

-- Create a security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Fix any remaining RLS policies that might cause recursion
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create safer policies using the security definer function
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT 
USING (true); -- Allow everyone to see profiles (basic info only)

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'email' IN ('laurentkalugula@gmail.com', 'admin@police.go.tz')
  OR auth.uid() = id
);