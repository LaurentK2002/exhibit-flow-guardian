import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Microscope, 
  Laptop, 
  Smartphone, 
  Wifi, 
  HardDrive, 
  Play, 
  Pause, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";

export const AnalysisWorkbench = () => {
  // No mock data - component shows empty states until real data is available
  const activeAnalyses: any[] = [];
  const availableTools: any[] = [];
  const recentFindings: any[] = [];

  const getAnalysisStatusBadge = (analysisStatus: string) => {
    switch (analysisStatus) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_analysis':
        return <Badge className="bg-blue-500 text-white">In Analysis</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getToolStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_use': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'maintenance': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Analyses</TabsTrigger>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
          <TabsTrigger value="findings">Recent Findings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Currently Running Analyses
              </CardTitle>
              <CardDescription>Monitor your active forensic processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeAnalyses.map((analysis, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{analysis.type} - {analysis.device}</p>
                        <p className="text-sm text-muted-foreground">
                          Case: {analysis.caseNumber} • Tool: {analysis.tool}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.status === 'running' ? (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <Play className="h-3 w-3 mr-1" />
                            Running
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            <Pause className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Analysis Status</p>
                        {getAnalysisStatusBadge(analysis.analysisStatus)}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Time Remaining</p>
                        <p className="text-sm text-muted-foreground">{analysis.timeRemaining}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Started</p>
                        <p className="text-sm text-muted-foreground">{analysis.startTime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.status === 'running' ? (
                          <Button size="sm" variant="outline" className="w-full">
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        ) : (
                          <Button size="sm" className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                Forensic Tools Arsenal
              </CardTitle>
              <CardDescription>Your available analysis tools and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTools.map((tool, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <Badge className={getToolStatusColor(tool.status)}>
                        {tool.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-sm text-muted-foreground mb-3">{tool.type}</p>
                      <Button 
                        size="sm" 
                        className="w-full" 
                        disabled={tool.status !== 'available'}
                        variant={tool.status === 'available' ? 'default' : 'outline'}
                      >
                        {tool.status === 'available' ? 'Launch Tool' : 
                         tool.status === 'in_use' ? 'In Use' : 'Maintenance'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Recent Findings & Alerts
              </CardTitle>
              <CardDescription>Important discoveries from your recent analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFindings.map((finding, index) => (
                  <div key={index} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {finding.severity === 'high' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{finding.finding}</p>
                        <p className="text-sm text-muted-foreground">Case: {finding.caseNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(finding.severity)}>
                        {finding.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{finding.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};