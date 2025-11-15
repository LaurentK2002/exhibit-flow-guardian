import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's role from user_roles table (ONLY source of truth now)
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching role:', roleError);
        }
        
        const userRole = roleData?.role;
        setRole(userRole);

        if (userRole) {
          // Fetch permissions for the role
          const { data: permData, error: permError } = await supabase
            .from('role_permissions')
            .select('permission')
            .eq('role', userRole);

          if (permError) throw permError;
          
          setPermissions(permData?.map(p => p.permission) || []);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleAndPermissions();
  }, [user]);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]) => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: string[]) => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role,
  };
};
