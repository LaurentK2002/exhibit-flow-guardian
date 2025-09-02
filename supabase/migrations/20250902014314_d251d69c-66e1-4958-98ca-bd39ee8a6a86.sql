-- Insert sample exhibits to demonstrate the system
INSERT INTO public.exhibits (
    exhibit_number, case_id, exhibit_type, device_name, brand, model, 
    serial_number, imei, description, status, storage_location
) VALUES 
    ('EXH-0001', (SELECT id FROM cases WHERE case_number = 'CR-2024-0089'), 'mobile_device'::exhibit_type, 'iPhone 14 Pro', 'Apple', 'A2890', 'F2LX9K7H8P93', '357123456789012', 'Seized from suspect during arrest. Device appears to contain encrypted messaging apps.', 'in_analysis'::exhibit_status, 'Vault A-201'),
    ('EXH-0002', (SELECT id FROM cases WHERE case_number = 'CR-2024-0087'), 'computer'::exhibit_type, 'MacBook Air M2', 'Apple', 'MLXW3', 'C02Z1234567A', NULL, 'Corporate laptop with potential evidence of data breach. SSD shows signs of recent file deletion.', 'analysis_complete'::exhibit_status, 'Vault B-102'),
    ('EXH-0003', (SELECT id FROM cases WHERE case_number = 'CR-2024-0091'), 'mobile_device'::exhibit_type, 'Samsung Galaxy S23', 'Samsung', 'SM-S911U', 'RF8N123456789', '356789012345678', 'Recovered from crime scene. Contains possible victim communications and location data.', 'received'::exhibit_status, 'Vault A-203'),
    ('EXH-0004', (SELECT id FROM cases WHERE case_number = 'CR-2024-0088'), 'storage_media'::exhibit_type, 'External HDD 2TB', 'Seagate', 'STGX2000400', 'WX12345678901', NULL, 'External drive found hidden in suspect vehicle. Encrypted with unknown password.', 'in_analysis'::exhibit_status, 'Secure Storage Room 3');

-- Insert sample case activities to show recent activity
INSERT INTO public.case_activities (case_id, activity_type, description, metadata) VALUES 
    ((SELECT id FROM cases WHERE case_number = 'CR-2024-0089'), 'exhibit_received', 'Digital exhibit iPhone 14 Pro received and logged into evidence system', '{"exhibit_type": "mobile_device", "received_by": "Evidence Clerk"}'),
    ((SELECT id FROM cases WHERE case_number = 'CR-2024-0087'), 'analysis_started', 'Forensic analysis initiated on MacBook Air using advanced forensic tools', '{"analyst": "Senior Forensic Analyst", "tools": ["Cellebrite UFED", "Oxygen Suite"]}'),
    ((SELECT id FROM cases WHERE case_number = 'CR-2024-0091'), 'evidence_updated', 'Chain of custody updated - Samsung Galaxy S23 transferred to analysis lab', '{"transfer_reason": "Forensic examination", "location": "Digital Forensics Lab 2"}'),
    ((SELECT id FROM cases WHERE case_number = 'CR-2024-0088'), 'analysis_complete', 'Comprehensive forensic analysis completed on External HDD with detailed findings', '{"findings": "Multiple evidence items recovered", "report_pages": 47}');