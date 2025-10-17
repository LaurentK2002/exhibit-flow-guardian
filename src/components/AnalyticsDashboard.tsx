import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  Database,
  FileText,
  Activity
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  casesTrend: Array<{ month: string; cases: number; solved: number }>;
  exhibitsByType: Array<{ name: string; value: number; color: string }>;
  performanceMetrics: {
    avgCaseResolution: number;
    casesSolvedThisMonth: number;
    activeAnalysts: number;
    priorityCaseBacklog: number;
  };
  workloadData: Array<{ analyst: string; active: number; completed: number }>;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    casesTrend: [
      { month: 'Jan', cases: 45, solved: 38 },
      { month: 'Feb', cases: 52, solved: 44 },
      { month: 'Mar', cases: 48, solved: 41 },
      { month: 'Apr', cases: 61, solved: 53 },
      { month: 'May', cases: 55, solved: 48 },
      { month: 'Jun', cases: 67, solved: 58 },
    ],
    exhibitsByType: [
      { name: 'Mobile Device', value: 45, color: '#3b82f6' },
      { name: 'Computer', value: 28, color: '#10b981' },
      { name: 'Storage Media', value: 18, color: '#f59e0b' },
      { name: 'Network Device', value: 12, color: '#ef4444' },
      { name: 'Other', value: 8, color: '#8b5cf6' },
    ],
    performanceMetrics: {
      avgCaseResolution: 12.5,
      casesSolvedThisMonth: 58,
      activeAnalysts: 8,
      priorityCaseBacklog: 15,
    },
    workloadData: [
      { analyst: 'Dr. Mwalimu', active: 8, completed: 23 },
      { analyst: 'Insp. Chakula', active: 6, completed: 19 },
      { analyst: 'Sgt. Kimbo', active: 5, completed: 16 },
      { analyst: 'Cpl. Manga', active: 4, completed: 14 },
      { analyst: 'PC Ndizi', active: 3, completed: 12 },
    ]
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Add real-time updates
  useEffect(() => {
    const casesChannel = supabase
      .channel('cases-analytics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchAnalytics)
      .subscribe();

    const exhibitsChannel = supabase
      .channel('exhibits-analytics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exhibits' }, fetchAnalytics)
      .subscribe();

    return () => {
      supabase.removeChannel(casesChannel);
      supabase.removeChannel(exhibitsChannel);
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch real data from database
      const { data: cases } = await supabase
        .from('cases')
        .select('id, created_at, status, priority, closed_date, opened_date, assigned_to');

      const { data: exhibits } = await supabase
        .from('exhibits')
        .select('exhibit_type, status, case_id, assigned_analyst');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .eq('is_active', true)
        .in('role', ['analyst', 'forensic_analyst']);

      // Process cases trend by month (last 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const casesTrend = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthCases = cases?.filter(c => {
          const caseDate = new Date(c.created_at);
          return caseDate >= monthStart && caseDate <= monthEnd;
        }).length || 0;
        
        const solvedCases = cases?.filter(c => {
          const closedDate = c.closed_date ? new Date(c.closed_date) : null;
          return closedDate && closedDate >= monthStart && closedDate <= monthEnd;
        }).length || 0;
        
        casesTrend.push({
          month: monthNames[date.getMonth()],
          cases: monthCases,
          solved: solvedCases
        });
      }

      // Process exhibits by type
      const typeColors: Record<string, string> = {
        'mobile_device': '#3b82f6',
        'computer': '#10b981',
        'storage_media': '#f59e0b',
        'network_device': '#ef4444',
        'other': '#8b5cf6'
      };
      
      const exhibitTypeMap: Record<string, number> = {};
      exhibits?.forEach(e => {
        const type = e.exhibit_type || 'other';
        exhibitTypeMap[type] = (exhibitTypeMap[type] || 0) + 1;
      });
      
      const exhibitsByType = Object.entries(exhibitTypeMap).map(([type, count]) => ({
        name: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: count,
        color: typeColors[type] || '#8b5cf6'
      }));

      // Calculate performance metrics
      const closedCases = cases?.filter(c => c.status === 'closed' || c.status === 'archived') || [];
      const avgResolution = closedCases.length > 0
        ? closedCases.reduce((acc, c) => {
            if (c.opened_date && c.closed_date) {
              const days = Math.floor((new Date(c.closed_date).getTime() - new Date(c.opened_date).getTime()) / (1000 * 60 * 60 * 24));
              return acc + days;
            }
            return acc;
          }, 0) / closedCases.length
        : 0;

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const casesSolvedThisMonth = cases?.filter(c => {
        const closedDate = c.closed_date ? new Date(c.closed_date) : null;
        return closedDate && closedDate >= thisMonthStart;
      }).length || 0;

      const activeAnalysts = profiles?.length || 0;
      const priorityCaseBacklog = cases?.filter(c => 
        c.priority === 'critical' && c.status !== 'closed' && c.status !== 'archived'
      ).length || 0;

      // Calculate analyst workload
      const workloadData = profiles?.map(analyst => {
        const analystCases = cases?.filter(c => 
          c.assigned_to === analyst.id || 
          (exhibits?.some(e => e.assigned_analyst === analyst.id && e.case_id === c.id))
        ) || [];
        
        const active = analystCases.filter(c => 
          c.status !== 'closed' && c.status !== 'archived'
        ).length;
        
        const completed = analystCases.filter(c => 
          c.status === 'closed' || c.status === 'archived'
        ).length;
        
        return {
          analyst: analyst.full_name,
          active,
          completed
        };
      }) || [];

      setAnalytics({
        casesTrend,
        exhibitsByType,
        performanceMetrics: {
          avgCaseResolution: Math.round(avgResolution * 10) / 10,
          casesSolvedThisMonth,
          activeAnalysts,
          priorityCaseBacklog
        },
        workloadData
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Case Resolution</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.performanceMetrics.avgCaseResolution} days
                </p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span>15% faster</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cases Solved</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.performanceMetrics.casesSolvedThisMonth}
                </p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+22% this month</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Analysts</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.performanceMetrics.activeAnalysts}
                </p>
                <Progress value={85} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">85% capacity</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority Backlog</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.performanceMetrics.priorityCaseBacklog}
                </p>
                <Badge variant="destructive" className="mt-1">
                  Needs Attention
                </Badge>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Cases Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.casesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="cases" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="New Cases"
                />
                <Line 
                  type="monotone" 
                  dataKey="solved" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Solved Cases"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Exhibit Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Evidence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.exhibitsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.exhibitsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {analytics.exhibitsByType.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyst Workload */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Analyst Workload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.workloadData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="analyst" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="active" fill="#f59e0b" name="Active Cases" />
                <Bar dataKey="completed" fill="#10b981" name="Completed Cases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};