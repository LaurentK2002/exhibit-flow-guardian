import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Lock, Users, Database, Activity } from "lucide-react";

export const SecurityOverview = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">3</div>
            <p className="text-xs text-red-600 dark:text-red-400">2 critical, 1 warning</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">27</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">98%</div>
            <p className="text-xs text-green-600 dark:text-green-400">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Incidents
            </CardTitle>
            <CardDescription>Recent security events requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Multiple failed login attempts detected</span>
                  <Badge variant="destructive">Critical</Badge>
                </AlertDescription>
              </Alert>
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                <Lock className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Privilege escalation attempt blocked</span>
                  <Badge variant="secondary">Warning</Badge>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Resources
            </CardTitle>
            <CardDescription>Database and server monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{width: '67%'}}></div>
                  </div>
                  <span className="text-sm">67%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted h-2 rounded-full">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '43%'}}></div>
                  </div>
                  <span className="text-sm">43%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Load</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted h-2 rounded-full">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '28%'}}></div>
                  </div>
                  <span className="text-sm">28%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};