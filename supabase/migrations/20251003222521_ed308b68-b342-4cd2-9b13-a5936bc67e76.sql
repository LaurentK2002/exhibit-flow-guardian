-- Create report submissions table
CREATE TABLE IF NOT EXISTS public.report_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  analyst_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  reviewed_by UUID REFERENCES auth.users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_submissions ENABLE ROW LEVEL SECURITY;

-- Analysts can view their own submissions
CREATE POLICY "Analysts can view their own submissions"
ON public.report_submissions
FOR SELECT
USING (analyst_id = auth.uid());

-- Analysts can create submissions
CREATE POLICY "Analysts can create submissions"
ON public.report_submissions
FOR INSERT
WITH CHECK (analyst_id = auth.uid());

-- OCU, CO, and Admins can view all submissions
CREATE POLICY "OCU and CO can view all submissions"
ON public.report_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('officer_commanding_unit', 'commanding_officer', 'administrator', 'supervisor')
  )
);

-- OCU and CO can update submissions (review)
CREATE POLICY "OCU and CO can update submissions"
ON public.report_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('officer_commanding_unit', 'commanding_officer', 'administrator')
  )
);

-- Create storage bucket for analysis reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-reports', 'analysis-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for analysis reports
CREATE POLICY "Analysts can upload their own reports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'analysis-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Analysts can view their own reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'analysis-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "OCU and CO can view all analysis reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'analysis-reports'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('officer_commanding_unit', 'commanding_officer', 'administrator', 'supervisor')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_report_submissions_updated_at
BEFORE UPDATE ON public.report_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_report_submissions_analyst ON public.report_submissions(analyst_id);
CREATE INDEX idx_report_submissions_status ON public.report_submissions(status);
CREATE INDEX idx_report_submissions_case ON public.report_submissions(case_id);