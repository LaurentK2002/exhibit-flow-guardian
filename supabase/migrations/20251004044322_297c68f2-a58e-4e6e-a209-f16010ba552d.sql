-- Allow OCU and CO to view analyst profiles for case assignment
CREATE POLICY "OCU and CO can view analysts for case assignment"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'analyst' 
  AND EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('officer_commanding_unit', 'commanding_officer')
  )
);