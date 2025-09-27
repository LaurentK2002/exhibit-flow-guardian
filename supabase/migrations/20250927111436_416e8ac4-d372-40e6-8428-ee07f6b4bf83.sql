-- Fix the relationship between cases and exhibits
-- The lab_number should only exist in cases table, not exhibits table
-- Remove lab_number from exhibits table since it's redundant (exhibits get lab_number through case_id)

ALTER TABLE exhibits DROP COLUMN IF EXISTS lab_number;

-- Update cases to use case_number as lab_number for existing data where lab_number is null
UPDATE cases 
SET lab_number = case_number 
WHERE lab_number IS NULL AND case_number LIKE 'FB/CYBER/%';

-- Add constraint to ensure case_number and lab_number are unique
ALTER TABLE cases ADD CONSTRAINT unique_case_number UNIQUE (case_number);
ALTER TABLE cases ADD CONSTRAINT unique_lab_number UNIQUE (lab_number);

-- Add constraint to ensure exhibit_number is unique
ALTER TABLE exhibits ADD CONSTRAINT unique_exhibit_number UNIQUE (exhibit_number);

-- Add proper foreign key constraint for case_id in exhibits
ALTER TABLE exhibits DROP CONSTRAINT IF EXISTS exhibits_case_id_fkey;
ALTER TABLE exhibits ADD CONSTRAINT exhibits_case_id_fkey 
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE;

-- Add comments for clarity
COMMENT ON COLUMN cases.lab_number IS 'Unique laboratory case number (e.g., FB/CYBER/2025/CASE/0001)';
COMMENT ON COLUMN cases.case_number IS 'Case reference number, can be same as lab_number';
COMMENT ON COLUMN exhibits.exhibit_number IS 'Unique exhibit identifier (e.g., EXH-0001, EXH-0002)';
COMMENT ON COLUMN exhibits.case_id IS 'Foreign key linking exhibit to its parent case - use this to get lab_number';

-- Create index for better performance on case lookups
CREATE INDEX IF NOT EXISTS idx_exhibits_case_id ON exhibits(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_lab_number ON cases(lab_number);
CREATE INDEX IF NOT EXISTS idx_exhibits_exhibit_number ON exhibits(exhibit_number);