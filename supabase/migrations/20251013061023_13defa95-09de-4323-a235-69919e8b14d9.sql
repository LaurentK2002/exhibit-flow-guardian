-- Step 1: Extend case_status enum with phase-out statuses
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'analysis_complete';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'report_submitted';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'report_approved';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'evidence_returned';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'archived';

-- Step 2: Create approval types enum
CREATE TYPE approval_type AS ENUM (
  'report_submission',
  'report_approval',
  'evidence_return',
  'final_closure'
);

-- Step 3: Create approval status enum
CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'revision_requested'
);

-- Step 4: Create case_approvals table
CREATE TABLE public.case_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  approval_type approval_type NOT NULL,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  submitted_by UUID NOT NULL,
  approved_by UUID,
  comments TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Step 5: Enable RLS on case_approvals
ALTER TABLE public.case_approvals ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for case_approvals
CREATE POLICY "Users can view approvals for their cases"
ON public.case_approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = case_approvals.case_id
    AND (
      cases.assigned_to = auth.uid() 
      OR cases.supervisor_id = auth.uid()
      OR cases.analyst_id = auth.uid()
      OR cases.exhibit_officer_id = auth.uid()
    )
  )
  OR get_current_user_role() IN ('administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
);

CREATE POLICY "Analysts can submit approvals"
ON public.case_approvals
FOR INSERT
WITH CHECK (
  submitted_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = case_approvals.case_id
    AND cases.analyst_id = auth.uid()
  )
);

CREATE POLICY "Supervisors and above can approve"
ON public.case_approvals
FOR UPDATE
USING (
  get_current_user_role() IN ('administrator', 'supervisor', 'commanding_officer', 'officer_commanding_unit')
);

-- Step 7: Create function to validate status transitions
CREATE OR REPLACE FUNCTION public.validate_case_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_transitions JSONB := '{
    "open": ["in_progress", "closed"],
    "in_progress": ["under_review", "closed", "analysis_complete"],
    "under_review": ["in_progress", "closed", "analysis_complete"],
    "analysis_complete": ["report_submitted", "in_progress"],
    "report_submitted": ["report_approved", "analysis_complete"],
    "report_approved": ["evidence_returned"],
    "evidence_returned": ["closed"],
    "closed": ["archived"],
    "archived": ["closed"]
  }'::jsonb;
  allowed_statuses TEXT[];
BEGIN
  -- Allow if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions for current status
  allowed_statuses := ARRAY(
    SELECT jsonb_array_elements_text(valid_transitions->OLD.status::text)
  );

  -- Check if new status is allowed
  IF NOT (NEW.status::text = ANY(allowed_statuses)) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 8: Create trigger for status validation
CREATE TRIGGER validate_case_status_before_update
BEFORE UPDATE ON public.cases
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.validate_case_status_transition();

-- Step 9: Create updated_at trigger for case_approvals
CREATE TRIGGER update_case_approvals_updated_at
BEFORE UPDATE ON public.case_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 10: Create indexes for performance
CREATE INDEX idx_case_approvals_case_id ON public.case_approvals(case_id);
CREATE INDEX idx_case_approvals_status ON public.case_approvals(approval_status);
CREATE INDEX idx_case_approvals_type ON public.case_approvals(approval_type);
CREATE INDEX idx_cases_status ON public.cases(status);