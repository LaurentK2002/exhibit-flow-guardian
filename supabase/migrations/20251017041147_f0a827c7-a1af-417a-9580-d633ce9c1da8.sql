-- Add 'in_progress' to case_status enum
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'in_progress';