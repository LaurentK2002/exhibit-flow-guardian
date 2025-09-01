-- Insert sample exhibits to demonstrate the system
INSERT INTO public.exhibits (
    exhibit_number, case_id, exhibit_type, device_name, brand, model, 
    serial_number, imei, description, status, storage_location
) 
SELECT 
    'EXH-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
    c.id,
    exhibit_data.exhibit_type,
    exhibit_data.device_name,
    exhibit_data.brand,
    exhibit_data.model,
    exhibit_data.serial_number,
    exhibit_data.imei,
    exhibit_data.description,
    exhibit_data.status::exhibit_status,
    exhibit_data.storage_location
FROM (
    SELECT * FROM cases LIMIT 4
) c
CROSS JOIN (
    VALUES 
        ('mobile_device', 'iPhone 14 Pro', 'Apple', 'A2890', 'F2LX9K7H8P93', '357123456789012', 'Seized from suspect during arrest. Device appears to contain encrypted messaging apps.', 'in_analysis', 'Vault A-201'),
        ('computer', 'MacBook Air M2', 'Apple', 'MLXW3', 'C02Z1234567A', NULL, 'Corporate laptop with potential evidence of data breach. SSD shows signs of recent file deletion.', 'analysis_complete', 'Vault B-102'),
        ('mobile_device', 'Samsung Galaxy S23', 'Samsung', 'SM-S911U', 'RF8N123456789', '356789012345678', 'Recovered from crime scene. Contains possible victim communications and location data.', 'received', 'Vault A-203'),
        ('storage_media', 'External HDD 2TB', 'Seagate', 'STGX2000400', 'WX12345678901', NULL, 'External drive found hidden in suspect vehicle. Encrypted with unknown password.', 'in_analysis', 'Secure Storage Room 3')
) AS exhibit_data(exhibit_type, device_name, brand, model, serial_number, imei, description, status, storage_location);

-- Insert sample case activities to show recent activity
INSERT INTO public.case_activities (case_id, activity_type, description, metadata)
SELECT 
    c.id,
    activity_data.activity_type,
    activity_data.description,
    activity_data.metadata::jsonb
FROM (
    SELECT * FROM cases LIMIT 4
) c
CROSS JOIN (
    VALUES 
        ('exhibit_received', 'Digital exhibit received and logged into evidence system', '{"exhibit_type": "mobile_device", "received_by": "Evidence Clerk"}'),
        ('analysis_started', 'Forensic analysis initiated using advanced mobile forensic tools', '{"analyst": "Senior Forensic Analyst", "tools": ["Cellebrite UFED", "Oxygen Suite"]}'),
        ('evidence_updated', 'Chain of custody updated - exhibit transferred to analysis lab', '{"transfer_reason": "Forensic examination", "location": "Digital Forensics Lab 2"}'),
        ('analysis_complete', 'Comprehensive forensic analysis completed with detailed findings', '{"findings": "Multiple evidence items recovered", "report_pages": 47}')
) AS activity_data(activity_type, description, metadata);