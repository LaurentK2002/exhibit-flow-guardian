-- Add chief_of_cyber role to both enums
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'chief_of_cyber';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chief_of_cyber';