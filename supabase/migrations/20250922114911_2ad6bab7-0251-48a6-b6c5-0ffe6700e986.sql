-- Check if storage policies exist for case-documents bucket
-- Create RLS policies for case-documents storage bucket

-- Policy for exhibit officers to upload files
CREATE POLICY "Exhibit officers can upload reference letters" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'case-documents' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('exhibit_officer', 'administrator', 'supervisor')
  ))
);

-- Policy for authorized users to view case documents
CREATE POLICY "Authorized users can view case documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'case-documents' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('exhibit_officer', 'administrator', 'supervisor', 'forensic_analyst', 'investigator')
  ))
);

-- Policy for authorized users to update case documents
CREATE POLICY "Authorized users can update case documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'case-documents' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('exhibit_officer', 'administrator', 'supervisor')
  ))
);

-- Policy for administrators to delete case documents
CREATE POLICY "Administrators can delete case documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'case-documents' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'supervisor')
  ))
);