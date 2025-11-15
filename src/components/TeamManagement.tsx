import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserCheck, Clock, Award } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  badge_number: string;
  is_active: boolean;
  activeCases: number;
  completedCases: number;
}

export const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    try {
      // Get all user IDs except admin/administrator roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .not('role', 'in', '(admin,administrator)');

      if (rolesError) throw rolesError;

      const userIds = userRoles?.map(r => r.user_id) || [];
      
      // Fetch profiles for those users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .eq('is_active', true);

      if (error) throw error;

      // Fetch all cases to calculate stats
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('analyst_id, status');

      if (casesError) throw casesError;

      // Calculate real stats for each member
      const membersWithStats = profiles?.map(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.id);
        const memberCases = cases?.filter(c => c.analyst_id === profile.id) || [];
        const activeCases = memberCases.filter(c => 
          !['closed', 'archived', 'evidence_returned'].includes(c.status)
        ).length;
        const completedCases = memberCases.filter(c => 
          ['closed', 'archived', 'analysis_complete', 'report_approved', 'evidence_returned'].includes(c.status)
        ).length;

        return {
          ...profile,
          role: userRole?.role || 'analyst',
          activeCases,
          completedCases,
        };
      }) || [];

      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Realtime sync for cases and profiles
  useRealtime('cases', fetchTeamMembers);
  useRealtime('profiles', fetchTeamMembers);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chief_of_cyber': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'commanding_officer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'officer_commanding_unit': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'supervisor': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'investigator': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'forensic_analyst': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'analyst': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'exhibit_officer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading team members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Overview
          </CardTitle>
          <CardDescription>Current team performance and workload distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{teamMembers.length}</div>
              <div className="text-sm text-muted-foreground">Active Team Members</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {teamMembers.reduce((sum, member) => sum + member.activeCases, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Active Cases</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {teamMembers.reduce((sum, member) => sum + member.completedCases, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Cases Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Individual team member performance and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.full_name}`} />
                      <AvatarFallback>
                        {member.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{member.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{member.badge_number}</p>
                    </div>
                  </div>
                  
                  <Badge className={`${getRoleColor(member.role)} mb-3`}>
                    {member.role.replace('_', ' ')}
                  </Badge>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Active Cases
                      </span>
                      <span className="font-medium">{member.activeCases}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Completed
                      </span>
                      <span className="font-medium">{member.completedCases}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};