import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Package, Clock, CheckCircle, AlertCircle, Smartphone, Laptop, HardDrive } from "lucide-react";

export const EvidenceQueue = () => {
  const evidenceQueue = [
    {
      id: "EV-2024-001",
      type: "Smartphone",
      model: "iPhone 14 Pro",
      caseNumber: "CC2024-015",
      priority: "high",
      status: "processing",
      receivedTime: "2 hours ago",
      estimatedCompletion: "4 hours",
      progress: 65,
      icon: Smartphone
    },
    {
      id: "EV-2024-002", 
      type: "Laptop",
      model: "MacBook Pro 16\"",
      caseNumber: "CC2024-012",
      priority: "medium",
      status: "queued",
      receivedTime: "6 hours ago",
      estimatedCompletion: "8 hours",
      progress: 0,
      icon: Laptop
    },
    {
      id: "EV-2024-003",
      type: "External Drive",
      model: "Seagate 2TB",
      caseNumber: "CC2024-018",
      priority: "high",
      status: "ready",
      receivedTime: "1 day ago",
      estimatedCompletion: "2 hours",
      progress: 100,
      icon: HardDrive
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">In Queue</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">12</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Processing</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">5</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Ready</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">8</div>
            <p className="text-xs text-green-600 dark:text-green-400">For analyst assignment</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">3</div>
            <p className="text-xs text-red-600 dark:text-red-400">Urgent processing</p>
          </CardContent>
        </Card>
      </div>

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