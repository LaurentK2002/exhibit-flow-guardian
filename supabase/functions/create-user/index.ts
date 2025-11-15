import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with user's token to verify their identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client for checking user permissions
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Set the user's session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('Authenticated user ID:', user.id);

    // Create admin client to check permissions (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user has admin role using user_roles table
    const { data: userRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('User role data:', userRole);
    console.log('Role error:', roleError);

    if (roleError) {
      throw new Error('Unable to verify user permissions');
    }

    // Check for admin or administrator role
    const allowedRoles = ['admin', 'administrator'];
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      throw new Error('Only administrators can create users');
    }

    // Parse request body
    const body = await req.json();
    const { email, password, fullName, badgeNumber, role, department, phone } = body;

    if (!email || !password || !fullName || !role) {
      throw new Error('Missing required fields: email, password, fullName, role');
    }

    // Create the user (adminClient already initialized above)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        badge_number: badgeNumber,
      },
    });

    if (createError) {
      throw createError;
    }

    // Update the profile with additional information and create user_roles entry
    if (newUser.user) {
      // Update profile
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          department: department || 'Cyber Crimes Unit',
          phone: phone || null,
        })
        .eq('id', newUser.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Insert role into user_roles table
      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role,
        });

      if (roleError) {
        console.error('Role insert error:', roleError);
        // Don't throw here, user was created successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user: newUser.user 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    
    let errorMessage = error.message;
    if (error.message?.includes('User already registered')) {
      errorMessage = 'A user with this email already exists';
    } else if (error.message?.includes('not authorized')) {
      errorMessage = 'You do not have permission to create users';
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});