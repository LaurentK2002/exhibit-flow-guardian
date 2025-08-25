-- Create comprehensive database schema for cyber crimes unit

-- Create enum types for better data integrity
CREATE TYPE public.case_status AS ENUM ('open', 'under_investigation', 'pending_review', 'closed', 'archived');
CREATE TYPE public.case_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.exhibit_status AS ENUM ('received', 'in_analysis', 'analysis_complete', 'released', 'destroyed', 'archived');
CREATE TYPE public.exhibit_type AS ENUM ('mobile_device', 'computer', 'storage_media', 'network_device', 'other');
CREATE TYPE public.user_role AS ENUM ('investigator', 'forensic_analyst', 'supervisor', 'administrator', 'case_officer');

-- Cases table - central to the system
CREATE TABLE public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status case_status DEFAULT 'open',
    priority case_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    opened_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_date TIMESTAMP WITH TIME ZONE,
    incident_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    victim_name TEXT,
    suspect_name TEXT,
    case_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with roles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    badge_number VARCHAR(20) UNIQUE,
    role user_role DEFAULT 'investigator',
    department TEXT DEFAULT 'Cyber Crimes Unit',
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital exhibits table
CREATE TABLE public.exhibits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibit_number VARCHAR(50) UNIQUE NOT NULL,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    exhibit_type exhibit_type NOT NULL,
    device_name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    imei TEXT,
    mac_address TEXT,
    description TEXT,
    status exhibit_status DEFAULT 'received',
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID REFERENCES auth.users(id),
    assigned_analyst UUID REFERENCES auth.users(id),
    storage_location TEXT,
    chain_of_custody JSONB DEFAULT '[]',
    analysis_notes TEXT,
    evidence_files JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case activities/timeline
CREATE TABLE public.case_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    exhibit_id UUID REFERENCES public.exhibits(id),
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    content TEXT,
    file_path TEXT,
    generated_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cases
CREATE POLICY "Users can view cases they're involved in" ON public.cases
    FOR SELECT USING (
        assigned_to = auth.uid() OR 
        supervisor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor')
        )
    );

CREATE POLICY "Supervisors and admins can manage cases" ON public.cases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor')
        )
    );

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles 
    FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'administrator'
        )
    );

-- RLS Policies for exhibits
CREATE POLICY "Users can view exhibits from their cases" ON public.exhibits
    FOR SELECT USING (
        assigned_analyst = auth.uid() OR
        received_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE id = case_id AND (assigned_to = auth.uid() OR supervisor_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor')
        )
    );

CREATE POLICY "Analysts and supervisors can manage exhibits" ON public.exhibits
    FOR ALL USING (
        assigned_analyst = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor', 'forensic_analyst')
        )
    );

-- RLS Policies for case activities
CREATE POLICY "Users can view activities from their cases" ON public.case_activities
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE id = case_id AND (assigned_to = auth.uid() OR supervisor_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor')
        )
    );

CREATE POLICY "All authenticated users can create activities" ON public.case_activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can view reports from their cases" ON public.reports
    FOR SELECT USING (
        generated_by = auth.uid() OR
        reviewed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE id = case_id AND (assigned_to = auth.uid() OR supervisor_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor')
        )
    );

CREATE POLICY "Users can manage their own reports" ON public.reports
    FOR ALL USING (
        generated_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('administrator', 'supervisor')
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exhibits_updated_at BEFORE UPDATE ON public.exhibits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for development
INSERT INTO public.cases (case_number, title, description, status, priority, incident_date, location, victim_name, suspect_name) VALUES
('CR-2024-0089', 'Mobile Device Fraud Investigation', 'Investigation of fraudulent activities using mobile banking applications', 'under_investigation', 'high', '2024-01-10', 'Dar es Salaam', 'John Mwalimu', 'Unknown'),
('CR-2024-0087', 'Corporate Data Breach', 'Unauthorized access to corporate database containing customer information', 'open', 'critical', '2024-01-08', 'Arusha', 'ABC Corporation', 'Investigation Ongoing'),
('CR-2024-0091', 'Social Media Harassment', 'Cyberbullying and harassment case through social media platforms', 'pending_review', 'medium', '2024-01-12', 'Mwanza', 'Sarah Kimaro', 'Michael Stevens'),
('CR-2024-0088', 'Financial Cyber Crime', 'Investigation of online banking fraud and money laundering', 'under_investigation', 'critical', '2024-01-09', 'Dodoma', 'Tanzania Commercial Bank', 'Multiple Suspects');