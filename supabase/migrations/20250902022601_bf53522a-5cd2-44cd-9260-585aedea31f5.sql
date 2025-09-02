-- Enable realtime for all tables
ALTER TABLE public.cases REPLICA IDENTITY FULL;
ALTER TABLE public.exhibits REPLICA IDENTITY FULL;
ALTER TABLE public.case_activities REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.reports REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exhibits;  
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;