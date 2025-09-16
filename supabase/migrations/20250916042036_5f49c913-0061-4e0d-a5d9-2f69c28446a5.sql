-- Add lab_number field to exhibits table for the new lab numbering system
ALTER TABLE exhibits ADD COLUMN IF NOT EXISTS lab_number character varying UNIQUE;