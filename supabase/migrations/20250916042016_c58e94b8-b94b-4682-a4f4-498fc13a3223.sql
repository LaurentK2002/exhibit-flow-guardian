-- Create RLS policies for case documents bucket (bucket already exists)
CREATE POLICY "Users can view case documents from their cases" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'case-documents' AND 
  (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id::text = (storage.foldername(name))[1] 
      AND (
        cases.assigned_to = auth.uid() OR 
        cases.supervisor_id = auth.uid() OR 
        cases.analyst_id = auth.uid() OR 
        cases.exhibit_officer_id = auth.uid()
      )
    ) OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);

CREATE POLICY "Exhibit officers and supervisors can upload case documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'case-documents' AND 
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('exhibit_officer', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);

CREATE POLICY "Exhibit officers and supervisors can update case documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'case-documents' AND 
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('exhibit_officer', 'administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
    )
  )
);

-- Add lab_number field to exhibits table for the new lab numbering system
ALTER TABLE exhibits ADD COLUMN lab_number character varying UNIQUE;