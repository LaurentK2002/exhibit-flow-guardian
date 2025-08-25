import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const stats = [
  {
    title: "Total Exhibits",
    value: "247",
    change: "+12 this week",
    icon: Database,
    color: "text-primary"
  },
  {
    title: "In Analysis",
    value: "18",
    change: "Active cases",
    icon: Clock,
    color: "text-status-analysis"
  },
  {
    title: "Completed",
    value: "156",
    change: "+8 this week",
    icon: CheckCircle,
    color: "text-status-complete"
  },
  {
    title: "Urgent Cases",
    value: "3",
    change: "Requires attention",
    icon: AlertTriangle,
    color: "text-status-urgent"
  }
];

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};