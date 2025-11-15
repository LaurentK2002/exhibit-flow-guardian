import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, Target, Users, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  casesCompleted: number;
  efficiency: number;
  status: string;
}

interface TeamStats {
  teamSize: number;
  avgEfficiency: number;
  totalCasesThisMonth: number;
  currentCapacity: number;
}

export const StaffProductivity = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    teamSize: 0,
    avgEfficiency: 0,
    totalCasesThisMonth: 0,
    currentCapacity: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchProductivityData = async () => {
    try {
      // Fetch analyst user IDs from user_roles
      const { data: analystRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'forensic_analyst');

      if (rolesError) throw rolesError;

      const analystIds = analystRoles?.map(r => r.user_id) || [];

      // Fetch only active forensic analysts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .in('id', analystIds);

      if (profilesError) throw profilesError;

      // Fetch cases assigned to each team member
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('assigned_to, status');

      if (casesError) throw casesError;

      // Calculate stats per team member
      const membersWithStats = profiles?.map(profile => {
        const assignedCases = cases?.filter(c => c.assigned_to === profile.id) || [];
        const completedCases = assignedCases.filter(c => c.status === 'closed').length;
        const efficiency = assignedCases.length > 0 
          ? Math.round((completedCases / assignedCases.length) * 100)
          : 0;

        let status = 'needs_attention';
        if (efficiency >= 85) status = 'excellent';
        else if (efficiency >= 70) status = 'good';

        const userRole = analystRoles?.find(r => r.user_id === profile.id)?.role || 'forensic_analyst';

        return {
          id: profile.id,
          name: profile.full_name,
          role: userRole,
          casesCompleted: completedCases,
          efficiency,
          status
        };
      }) || [];

      setTeamMembers(membersWithStats);

      // Calculate overall stats
      const teamSize = profiles?.length || 0;
      const avgEfficiency = membersWithStats.length > 0
        ? Math.round(membersWithStats.reduce((sum, m) => sum + m.efficiency, 0) / membersWithStats.length)
        : 0;
      const totalCasesThisMonth = membersWithStats.reduce((sum, m) => sum + m.casesCompleted, 0);
      const currentCapacity = teamSize > 0 
        ? Math.round((cases?.length || 0) / (teamSize * 10) * 100)
        : 0;

      setStats({
        teamSize,
        avgEfficiency,
        totalCasesThisMonth,
        currentCapacity: Math.min(currentCapacity, 100)
      });
    } catch (error) {
      console.error('Error fetching productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductivityData();
  }, []);

  useRealtime('profiles', fetchProductivityData);
  useRealtime('cases', fetchProductivityData);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'needs_attention': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <TrendingUp className="h-4 w-4" />;
      case 'good': return <Target className="h-4 w-4" />;
      case 'needs_attention': return <TrendingDown className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Team Size</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {loading ? "..." : stats.teamSize}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Active members</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Avg Efficiency</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {loading ? "..." : `${stats.avgEfficiency}%`}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">Team performance</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Cases Completed</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {loading ? "..." : stats.totalCasesThisMonth}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">Team total</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Workload</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {loading ? "..." : `${stats.currentCapacity}%`}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">Current capacity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Performance Metrics
          </CardTitle>
          <CardDescription>Team member productivity and efficiency tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading team data...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teamMembers.map((member, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge className={getStatusColor(member.status)}>
                    {getStatusIcon(member.status)}
                    <span className="ml-1 capitalize">{member.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Cases Completed</p>
                    <p className="text-2xl font-bold text-primary">{member.casesCompleted}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Efficiency Rating</p>
                    <div className="flex items-center gap-2">
                      <Progress value={member.efficiency} className="flex-1" />
                      <span className="text-sm font-medium">{member.efficiency}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Current Load</p>
                    <p className="text-sm text-muted-foreground">
                      {member.casesCompleted > 15 ? 'High' : member.casesCompleted > 10 ? 'Medium' : 'Light'} workload
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};