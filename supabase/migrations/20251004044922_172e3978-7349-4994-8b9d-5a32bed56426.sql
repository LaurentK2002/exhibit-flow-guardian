-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "OCU and CO can view analysts for case assignment" ON public.profiles;

-- Recreate the policy using the security definer function to avoid recursion
CREATE POLICY "OCU and CO can view analysts for case assignment"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'analyst' 
  AND get_current_user_role() IN ('officer_commanding_unit', 'commanding_officer')
);