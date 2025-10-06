-- Add ir_number column to cases table for Investigation Report number
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS ir_number character varying;