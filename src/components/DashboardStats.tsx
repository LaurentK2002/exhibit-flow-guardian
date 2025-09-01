import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalExhibits: number;
  inAnalysis: number;
  completed: number;
  criticalCases: number;
  totalCases: number;
  activeUsers: number;
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalExhibits: 0,
    inAnalysis: 0,
    completed: 0,
    criticalCases: 0,
    totalCases: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch exhibit counts
      const { data: exhibits, error: exhibitsError } = await supabase
        .from('exhibits')
        .select('status');

      if (exhibitsError) throw exhibitsError;

      // Fetch case counts  
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('priority, status');

      if (casesError) throw casesError;

      // Fetch active user count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Calculate statistics
      const totalExhibits = exhibits?.length || 0;
      const inAnalysis = exhibits?.filter(e => e.status === 'in_analysis').length || 0;
      const completed = exhibits?.filter(e => e.status === 'analysis_complete').length || 0;
      const criticalCases = cases?.filter(c => c.priority === 'critical').length || 0;
      const totalCases = cases?.length || 0;
      const activeUsers = profiles?.length || 0;

      setStats({
        totalExhibits,
        inAnalysis,
        completed,
        criticalCases,
        totalCases,
        activeUsers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: "Total Exhibits",
      value: stats.totalExhibits.toString(),
      change: `${stats.totalCases} active cases`,
      icon: Database,
      color: "text-primary"
    },
    {
      title: "In Analysis",
      value: stats.inAnalysis.toString(),
      change: "Active forensic work",
      icon: Clock,
      color: "text-status-analysis"
    },
    {
      title: "Analysis Complete",
      value: stats.completed.toString(),
      change: "Ready for review",
      icon: CheckCircle,
      color: "text-status-complete"
    },
    {
      title: "Critical Cases",
      value: stats.criticalCases.toString(),
      change: "Require immediate attention",
      icon: AlertTriangle,
      color: "text-destructive"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};