-- Clear all case and exhibit data while keeping users and system configuration
-- This will reset all numbers and data for testing new data entry

-- Clear dependent tables first (foreign key relationships)
DELETE FROM case_activities;
DELETE FROM reports;
DELETE FROM exhibits;
DELETE FROM cases;

-- Clear audit logs (optional - keeps system clean for testing)
DELETE FROM audit_logs;

-- Note: Keeping profiles, role_permissions, and user_sessions intact