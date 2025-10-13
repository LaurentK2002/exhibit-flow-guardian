-- Allow Commanding Officer to view all profiles for case management
CREATE POLICY "CO can view all profiles for case oversight"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'commanding_officer'
);