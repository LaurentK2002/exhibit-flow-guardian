-- Phase 2: Enhanced Data Protection (Fixed - Only add what doesn't exist)

-- Check and create missing functions only

-- Create role-based field masking function if it doesn't exist
CREATE OR REPLACE FUNCTION public.mask_sensitive_fields(
  profile_data jsonb,
  viewer_role text,
  profile_owner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := profile_data;
BEGIN
  -- If viewing own profile or admin/commanding officer, show all fields
  IF profile_owner_id = auth.uid() OR viewer_role IN ('administrator', 'commanding_officer') THEN
    RETURN result;
  END IF;
  
  -- For supervisors, mask phone numbers for non-department users
  IF viewer_role = 'supervisor' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = profile_owner_id 
      AND department = public.get_current_user_department()
    ) THEN
      result := result - 'phone';
    END IF;
  END IF;
  
  -- For regular users, mask badge numbers and phone numbers
  IF viewer_role IN ('investigator', 'forensic_analyst', 'exhibit_officer') THEN
    result := result - 'badge_number' - 'phone';
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to log profile access if it doesn't exist
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, 
    action, 
    table_name, 
    created_at
  ) VALUES (
    auth.uid(),
    'PROFILE_ACCESS',
    'profiles',
    now()
  );
END;
$$;

-- Create function to cleanup expired sessions if it doesn't exist
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark sessions as inactive if no activity for 24 hours
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE last_activity < now() - interval '24 hours' 
  AND is_active = true;
  
  -- Delete old inactive sessions (older than 7 days)
  DELETE FROM public.user_sessions 
  WHERE created_at < now() - interval '7 days' 
  AND is_active = false;
END;
$$;