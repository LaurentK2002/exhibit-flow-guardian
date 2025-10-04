import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText, Database, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { Database as DatabaseType } from "@/integrations/supabase/types";

type Activity = DatabaseType['public']['Tables']['case_activities']['Row'] & {
  profiles?: {
    full_name: string;
  } | null;
  cases?: {
    case_number: string;
    title: string;
  } | null;
};

const activityTypeConfig = {
  "exhibit_received": { 
    label: "Exhibit Received", 
    icon: Database, 
    color: "bg-blue-500" 
  },
  "analysis_started": { 
    label: "Analysis Started", 
    icon: Clock, 
    color: "bg-yellow-500" 
  },
  "analysis_complete": { 
    label: "Analysis Complete", 
    icon: FileText, 
    color: "bg-green-500" 
  },
  "case_assigned": { 
    label: "Case Assigned", 
    icon: User, 
    color: "bg-purple-500" 
  },
  "report_generated": { 
    label: "Report Generated", 
    icon: FileText, 
    color: "bg-indigo-500" 
  },
  "evidence_updated": { 
    label: "Evidence Updated", 
    icon: Database, 
    color: "bg-teal-500" 
  },
  "default": { 
    label: "Activity", 
    icon: AlertCircle, 
    color: "bg-gray-500" 
  }
};

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('case_activities')
        .select(`
          *,
          profiles!user_id(full_name),
          cases(case_number, title)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setActivities((data as unknown) as Activity[] || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Set up real-time updates for activities
  useRealtime('case_activities', fetchActivities);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading activities...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent System Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">System activities will appear here</p>
            </div>
          ) : (
            activities.map((activity) => {
              const config = activityTypeConfig[activity.activity_type as keyof typeof activityTypeConfig] || activityTypeConfig.default;
              const Icon = config.icon;
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {config.label}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.profiles?.full_name || 'System'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                      {activity.cases?.case_number && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.cases.case_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};