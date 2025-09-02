-- Update your user profile to have admin role so you can see the role switcher
-- Replace 'laurentkalugula@gmail.com' with your actual email if different
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'laurentkalugula@gmail.com';

-- Also ensure the profile record exists and is active
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin',
  true
FROM auth.users au
WHERE au.email = 'laurentkalugula@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_active = true;