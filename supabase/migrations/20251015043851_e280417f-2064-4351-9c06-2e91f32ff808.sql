-- Drop existing policies for reference letters if they exist
DROP POLICY IF EXISTS "Analysts can view reference letters for their cases" ON storage.objects;
DROP POLICY IF EXISTS "Exhibit officers can upload reference letters" ON storage.objects;
DROP POLICY IF EXISTS "Exhibit officers can delete reference letters" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update reference letters" ON storage.objects;

-- Create storage policies for reference letters in case-documents bucket

-- Allow analysts to view reference letters for their assigned cases
CREATE POLICY "Analysts can view reference letters for their cases"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents' 
  AND name LIKE 'reference-letters/%'
  AND (
    -- Check if user is an analyst assigned to a case matching this reference letter
    EXISTS (
      SELECT 1 FROM cases
      WHERE analyst_id = auth.uid()
      AND (
        -- Match by lab number sequence (e.g., "0001" from "FB/CYBER/2025/LAB/0001")
        (storage.objects.name LIKE 'reference-letters/' || SPLIT_PART(lab_number, '/', 5) || '-%')
        OR
        -- Match by case number sequence if no lab number
        (lab_number IS NULL AND storage.objects.name LIKE 'reference-letters/' || SPLIT_PART(case_number, '/', 5) || '-%')
      )
    )
    OR
    -- Supervisors, OCU, CO, and admins can view all reference letters
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);

-- Allow exhibit officers to upload reference letters
CREATE POLICY "Exhibit officers can upload reference letters"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-documents'
  AND name LIKE 'reference-letters/%'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('exhibit_officer', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);

-- Allow exhibit officers and admins to delete reference letters
CREATE POLICY "Exhibit officers can delete reference letters"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-documents'
  AND name LIKE 'reference-letters/%'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('exhibit_officer', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);

-- Allow authorized users to update reference letters (e.g., replace with newer version)
CREATE POLICY "Authorized users can update reference letters"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case-documents'
  AND name LIKE 'reference-letters/%'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('exhibit_officer', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);