import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, Target, Users, Award } from "lucide-react";

export const StaffProductivity = () => {
  const teamMembers = [
    { name: "Dr. Sarah Johnson", role: "Senior Analyst", casesCompleted: 15, efficiency: 94, status: "excellent" },
    { name: "Mike Chen", role: "Digital Forensics", casesCompleted: 12, efficiency: 87, status: "good" },
    { name: "Lisa Rodriguez", role: "Network Analyst", casesCompleted: 9, efficiency: 78, status: "good" },
    { name: "David Park", role: "Mobile Forensics", casesCompleted: 8, efficiency: 65, status: "needs_attention" },
    { name: "Emma Thompson", role: "Exhibit Officer", casesCompleted: 22, efficiency: 91, status: "excellent" },
  ];

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
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">23</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Active members</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Avg Efficiency</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">87%</div>
            <p className="text-xs text-green-600 dark:text-green-400">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Cases/Month</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">156</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">Team total</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Workload</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">82%</div>
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
        </CardContent>
      </Card>
    </div>
  );
};