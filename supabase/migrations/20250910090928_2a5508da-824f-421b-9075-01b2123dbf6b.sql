-- Phase 2: Enhanced Data Protection

-- 1. Create audit log table for tracking profile access
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only administrators can view audit logs
CREATE POLICY "Administrators can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.get_current_user_role() = 'administrator');

-- Create function to log profile access
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

-- 2. Create role-based field masking function for sensitive data
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

-- 3. Add session timeout tracking
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  ip_address inet,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions, admins can see all
CREATE POLICY "Users can manage their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (
  user_id = auth.uid() 
  OR public.get_current_user_role() = 'administrator'
);

-- 4. Create function to cleanup expired sessions
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