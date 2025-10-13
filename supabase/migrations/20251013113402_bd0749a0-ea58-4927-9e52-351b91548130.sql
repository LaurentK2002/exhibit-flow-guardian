-- Add region and district columns to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;