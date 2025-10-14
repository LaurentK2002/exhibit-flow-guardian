-- Allow exhibit officers to view analyst profiles so the UI can show assigned analyst names
-- Safe to run multiple times
DROP POLICY IF EXISTS "Exhibit officers can view analysts" ON public.profiles;
CREATE POLICY "Exhibit officers can view analysts"
ON public.profiles
FOR SELECT
USING (
  public.get_current_user_role() = 'exhibit_officer'::text
  AND (role = ANY (ARRAY['analyst'::user_role, 'forensic_analyst'::user_role]))
);
