import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText } from "lucide-react";

interface Activity {
  id: string;
  type: "exhibit_received" | "analysis_complete" | "case_assigned" | "report_generated";
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "exhibit_received",
    title: "New exhibit received",
    description: "iPhone 14 Pro added to case CR-2024-0089",
    timestamp: "2 hours ago",
    user: "Det. Johnson"
  },
  {
    id: "2", 
    type: "analysis_complete",
    title: "Forensic analysis completed",
    description: "MacBook Air analysis finished for CR-2024-0087",
    timestamp: "4 hours ago",
    user: "Tech. Smith"
  },
  {
    id: "3",
    type: "case_assigned",
    title: "Case reassigned",
    description: "CR-2024-0091 assigned to Det. Williams",
    timestamp: "6 hours ago",
    user: "Supervisor Brown"
  },
  {
    id: "4",
    type: "report_generated", 
    title: "Forensic report generated",
    description: "Final report for External HDD analysis",
    timestamp: "1 day ago",
    user: "Tech. Davis"
  }
];

const activityIcons = {
  exhibit_received: FileText,
  analysis_complete: Clock,
  case_assigned: User,
  report_generated: FileText
};

const activityColors = {
  exhibit_received: "bg-status-received",
  analysis_complete: "bg-status-complete", 
  case_assigned: "bg-status-analysis",
  report_generated: "bg-primary"
};

export const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.user}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};