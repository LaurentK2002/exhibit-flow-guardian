import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Package, Clock, CheckCircle, AlertCircle, Smartphone, Laptop, HardDrive } from "lucide-react";

export const EvidenceQueue = () => {
  const evidenceQueue: any[] = [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'queued': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'queued': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Evidence Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No evidence in queue yet.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Evidence Processing Queue
          </CardTitle>
          <CardDescription>Current evidence items in various stages of processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evidenceQueue.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.type} - {item.model}</p>
                      <p className="text-sm text-muted-foreground">ID: {item.id} • Case: {item.caseNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1 capitalize">{item.status}</span>
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Received</p>
                    <p className="text-sm text-muted-foreground">{item.receivedTime}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Est. Completion</p>
                    <p className="text-sm text-muted-foreground">{item.estimatedCompletion}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="flex-1" />
                      <span className="text-sm">{item.progress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'queued' && (
                      <Button size="sm" className="w-full">Start Processing</Button>
                    )}
                    {item.status === 'processing' && (
                      <Button size="sm" variant="outline" className="w-full">View Details</Button>
                    )}
                    {item.status === 'ready' && (
                      <Button size="sm" variant="default" className="w-full">Assign Analyst</Button>
                    )}
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