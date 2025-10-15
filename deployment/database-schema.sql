-- Forensics Case Management Database Schema
-- For Local PostgreSQL Deployment

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'investigator', 'forensic_analyst', 'exhibit_officer', 'commanding_officer');
CREATE TYPE case_status AS ENUM ('open', 'under_investigation', 'pending_review', 'closed', 'archived');
CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE exhibit_status AS ENUM ('received', 'in_analysis', 'analysis_complete', 'released', 'destroyed', 'archived');
CREATE TYPE exhibit_type AS ENUM ('mobile_device', 'computer', 'storage_media', 'network_device', 'other');

-- Users/Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    badge_number VARCHAR(50) UNIQUE,
    role user_role DEFAULT 'investigator',
    department TEXT DEFAULT 'Cyber Crimes Unit',
    phone TEXT,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL, -- For local auth
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases Table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status case_status DEFAULT 'open',
    priority case_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES profiles(id),
    supervisor_id UUID REFERENCES profiles(id),
    exhibit_officer_id UUID REFERENCES profiles(id),
    analyst_id UUID REFERENCES profiles(id),
    incident_date TIMESTAMP WITH TIME ZONE,
    opened_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    victim_name TEXT,
    suspect_name TEXT,
    case_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exhibits Table
CREATE TABLE exhibits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exhibit_number VARCHAR(50) UNIQUE NOT NULL,
    case_id UUID REFERENCES cases(id),
    exhibit_type exhibit_type NOT NULL,
    device_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    imei TEXT,
    mac_address TEXT,
    description TEXT,
    status exhibit_status DEFAULT 'received',
    storage_location TEXT,
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID REFERENCES profiles(id),
    assigned_analyst UUID REFERENCES profiles(id),
    analysis_notes TEXT,
    chain_of_custody JSONB DEFAULT '[]',
    evidence_files JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Activities Table
CREATE TABLE case_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    user_id UUID REFERENCES profiles(id),
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    exhibit_id UUID REFERENCES exhibits(id),
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    content TEXT,
    file_path TEXT,
    generated_by UUID REFERENCES profiles(id),
    reviewed_by UUID REFERENCES profiles(id),
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_exhibits_status ON exhibits(status);
CREATE INDEX idx_exhibits_case_id ON exhibits(case_id);
CREATE INDEX idx_activities_case_id ON case_activities(case_id);

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO profiles (full_name, badge_number, role, email, password_hash) 
VALUES ('System Administrator', 'ADMIN001', 'admin', 'admin@police.local', '$2b$10$example_hash_change_this');

-- Insert default permissions
INSERT INTO role_permissions (role, permission) VALUES
('admin', 'manage_users'),
('admin', 'manage_cases'),
('admin', 'manage_exhibits'),
('admin', 'view_reports'),
('admin', 'system_settings'),
('supervisor', 'manage_cases'),
('supervisor', 'assign_cases'),
('supervisor', 'view_reports'),
('forensic_analyst', 'manage_exhibits'),
('forensic_analyst', 'create_reports'),
('exhibit_officer', 'manage_exhibits'),
('investigator', 'view_cases'),
('commanding_officer', 'view_all');

-- Storage bucket setup for case documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('case-documents', 'case-documents', false);

-- Storage policies for reference letters and case documents
-- Allow analysts to view reference letters for their assigned cases
CREATE POLICY "Analysts can view reference letters for assigned cases"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents' 
  AND (name LIKE 'reference-letters/%')
  AND EXISTS (
    SELECT 1 FROM cases
    WHERE analyst_id = auth.uid()
    AND (
      name LIKE 'reference-letters/' || SPLIT_PART(lab_number, '/', 5) || '-%'
      OR name LIKE 'reference-letters/' || SPLIT_PART(case_number, '/', 4) || '-%'
    )
  )
);

-- Allow exhibit officers to manage reference letters
CREATE POLICY "Exhibit officers can upload reference letters"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-documents'
  AND (name LIKE 'reference-letters/%')
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'exhibit_officer'
  )
);

CREATE POLICY "Exhibit officers can delete reference letters"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-documents'
  AND (name LIKE 'reference-letters/%')
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'exhibit_officer'
  )
);

CREATE POLICY "Exhibit officers can update reference letters"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case-documents'
  AND (name LIKE 'reference-letters/%')
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'exhibit_officer'
  )
);

-- Allow case participants to view their case documents
CREATE POLICY "Case participants can view their case documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents'
  AND EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id::text = SPLIT_PART(name, '/', 1)
    AND (
      cases.assigned_to = auth.uid()
      OR cases.supervisor_id = auth.uid()
      OR cases.analyst_id = auth.uid()
      OR cases.exhibit_officer_id = auth.uid()
    )
  )
);