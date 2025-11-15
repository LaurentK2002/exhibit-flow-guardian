import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Mail, Phone, Shield, Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  role?: string;
};

export const UserTable = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      // Get user roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Merge roles with profiles
      const usersWithRoles = (data || []).map(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'investigator'
        };
      });

      setUsers(usersWithRoles as any);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Real-time updates
  useRealtime('profiles', fetchUsers);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator': return 'destructive';
      case 'supervisor': return 'default';
      case 'forensic_analyst': return 'secondary';
      case 'investigator': return 'outline';
      case 'exhibit_officer': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator': return Shield;
      case 'supervisor': return Users;
      default: return Shield;
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const logProfileAccess = async () => {
    try {
      await supabase.rpc('log_profile_access');
    } catch (error) {
      console.error('Error logging profile access:', error);
    }
  };

  const viewProfile = async (userId: string) => {
    // Log the profile access
    await logProfileAccess();
    // Additional profile viewing logic can be added here
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading users...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Members</span>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Department</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Badge #</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found. <br />
                    <span className="text-sm">Add team members to get started.</span>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role || 'investigator');
                  
                  return (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.full_name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={getRoleColor(user.role || 'investigator')} className="text-xs">
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {formatRole(user.role || 'investigator')}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-foreground">{user.department || 'Cyber Crimes Unit'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-mono text-foreground">{user.badge_number || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-2">
                          {user.email && (
                            <Button variant="ghost" size="sm" title="Send Email">
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {user.phone && (
                            <Button variant="ghost" size="sm" title="Call">
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View Profile"
                          onClick={() => viewProfile(user.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};