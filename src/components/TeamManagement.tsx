import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserCheck, Clock, Award } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Fetch team members (analysts and exhibit officers)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['analyst', 'exhibit_officer'])
        .eq('is_active', true);

      if (error) throw error;

      // Mock data for active and completed cases (in real app, this would be calculated)
      const membersWithStats = profiles?.map(profile => ({
        ...profile,
        activeCases: Math.floor(Math.random() * 10) + 1,
        completedCases: Math.floor(Math.random() * 50) + 10,
      })) || [];

      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
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