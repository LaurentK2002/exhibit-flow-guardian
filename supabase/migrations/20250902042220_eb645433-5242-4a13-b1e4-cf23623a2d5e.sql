-- Fix infinite recursion in RLS policies for profiles table
-- The issue is that admin policies are referencing the same table they're protecting

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Use a direct auth.uid() check instead of looking up the profile again
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL
USING (
  -- Allow if the user is explicitly listed as an admin in a safe way
  -- We check auth metadata or use a direct approach
  auth.jwt() ->> 'email' IN (
    'laurentkalugula@gmail.com', -- Add specific admin emails here
    'admin@police.go.tz'
  )
  OR 
  -- Allow users to manage their own profile
  id = auth.uid()
)