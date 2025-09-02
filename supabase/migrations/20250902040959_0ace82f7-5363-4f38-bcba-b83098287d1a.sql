-- Disable public signup by creating a function that prevents unauthorized user creation
-- This function will be used as a trigger on the auth.users table

CREATE OR REPLACE FUNCTION public.prevent_public_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the operation if it's being performed by an admin user
  -- Check if the current user has admin role
  IF EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- If no admin user is authenticated, this might be a system operation
  -- Allow it if auth.uid() is null (system operations)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Reject all other signup attempts
  RAISE EXCEPTION 'Public user registration is disabled. Contact your administrator for account creation.';
END;
$$;

-- Note: We cannot directly attach triggers to auth.users as it's a reserved schema
-- Instead, we'll rely on RLS policies and application-level controls