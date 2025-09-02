-- Insert sample cases with correct enum values
INSERT INTO public.cases (case_number, title, description, status, priority, assigned_to, supervisor_id, incident_date, opened_date) VALUES
('2024-001', 'Mobile Device Analysis - Theft Case', 'Analysis of iPhone recovered from theft suspect', 'open', 'high', 'e8885afa-60f9-48a2-a346-8277059020c9', 'e8885afa-60f9-48a2-a346-8277059020c9', '2024-01-15 10:30:00', '2024-01-16 09:00:00'),
('2024-002', 'Computer Forensics - Fraud Investigation', 'Desktop computer analysis for financial fraud case', 'under_investigation', 'critical', 'e8885afa-60f9-48a2-a346-8277059020c9', 'e8885afa-60f9-48a2-a346-8277059020c9', '2024-01-20 14:15:00', '2024-01-21 08:30:00'),
('2024-003', 'Network Device Analysis', 'Router analysis for cybercrime investigation', 'pending_review', 'medium', 'e8885afa-60f9-48a2-a346-8277059020c9', 'e8885afa-60f9-48a2-a346-8277059020c9', '2024-01-25 16:45:00', '2024-01-26 10:00:00');

-- Insert sample exhibits linked to the cases
INSERT INTO public.exhibits (exhibit_number, device_name, exhibit_type, brand, model, serial_number, case_id, assigned_analyst, received_by, status, description) VALUES
('EXH-2024-001', 'iPhone 14 Pro', 'mobile_device', 'Apple', 'iPhone 14 Pro', 'IMEI123456789', (SELECT id FROM cases WHERE case_number = '2024-001'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'e8885afa-60f9-48a2-a346-8277059020c9', 'in_analysis', 'Black iPhone 14 Pro recovered from suspect'),
('EXH-2024-002', 'Dell Desktop Computer', 'computer', 'Dell', 'OptiPlex 7090', 'SN987654321', (SELECT id FROM cases WHERE case_number = '2024-002'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'e8885afa-60f9-48a2-a346-8277059020c9', 'analysis_complete', 'Office desktop used for fraudulent activities'),
('EXH-2024-003', 'Network Router', 'network_device', 'Cisco', 'ISR 4331', 'RT456789123', (SELECT id FROM cases WHERE case_number = '2024-003'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'e8885afa-60f9-48a2-a346-8277059020c9', 'received', 'Corporate router suspected of compromise');

-- Insert sample reports
INSERT INTO public.reports (title, report_type, content, case_id, exhibit_id, generated_by, is_final) VALUES
('Initial Analysis Report - iPhone 14 Pro', 'preliminary', 'Initial examination reveals encrypted device with Face ID enabled. Extraction in progress.', (SELECT id FROM cases WHERE case_number = '2024-001'), (SELECT id FROM exhibits WHERE exhibit_number = 'EXH-2024-001'), 'e8885afa-60f9-48a2-a346-8277059020c9', false),
('Final Forensic Report - Dell Computer', 'final', 'Complete analysis of hard drive revealed evidence of financial fraud. 247 suspicious transactions identified.', (SELECT id FROM cases WHERE case_number = '2024-002'), (SELECT id FROM exhibits WHERE exhibit_number = 'EXH-2024-002'), 'e8885afa-60f9-48a2-a346-8277059020c9', true);

-- Insert sample case activities
INSERT INTO public.case_activities (case_id, user_id, activity_type, description) VALUES
((SELECT id FROM cases WHERE case_number = '2024-001'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'case_created', 'Case opened for mobile device analysis'),
((SELECT id FROM cases WHERE case_number = '2024-001'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'exhibit_received', 'iPhone 14 Pro received and logged'),
((SELECT id FROM cases WHERE case_number = '2024-002'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'case_created', 'Case opened for computer forensics'),
((SELECT id FROM cases WHERE case_number = '2024-002'), 'e8885afa-60f9-48a2-a346-8277059020c9', 'analysis_complete', 'Forensic analysis completed - evidence found');