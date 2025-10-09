-- Add analyst_status field to cases table
ALTER TABLE public.cases 
ADD COLUMN analyst_status text DEFAULT 'pending' CHECK (analyst_status IN ('pending', 'in_analysis', 'complete'));

-- Add index for better query performance
CREATE INDEX idx_cases_analyst_status ON public.cases(analyst_status);

-- Add comment for documentation
COMMENT ON COLUMN public.cases.analyst_status IS 'Status of analyst work: pending, in_analysis, or complete';