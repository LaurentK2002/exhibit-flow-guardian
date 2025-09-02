-- First migration: Add new enum values only
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'exhibit_officer';  
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'commanding_officer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'analyst';