import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, Settings, BarChart3, Database, Shield, UserCheck, 
  Server, AlertTriangle, Activity, Crown, Lock, Eye,
  TrendingUp, UserPlus, FileText, Bell, Zap
} from "lucide-react";
import { DashboardStats } from "@/components/DashboardStats";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { UserManagement } from "@/components/UserManagement";
import { SystemSettings } from "@/components/SystemSettings";
import { SecurityOverview } from "@/components/security/SecurityOverview";
import { UserPresence } from "@/components/UserPresence";

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Enhanced Admin Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Crown className="h-8 w-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">System Administration</h1>
              <p className="text-red-100 text-lg">Complete control and oversight of all systems</p>
            </div>
          </div>
          <Badge className="bg-yellow-500 text-yellow-900 text-lg px-4 py-2 hover:bg-yellow-400">
            <Crown className="h-5 w-5 mr-2" />
            SUPER ADMIN
          </Badge>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Users</p>
                <p className="text-2xl font-bold">127</p>
              </div>
              <Users className="h-8 w-8 text-red-200" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">System Health</p>
                <p className="text-2xl font-bold text-green-300">98%</p>
              </div>
              <Activity className="h-8 w-8 text-green-300" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Security Alerts</p>
                <p className="text-2xl font-bold text-yellow-300">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-300" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Active Sessions</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Eye className="h-8 w-8 text-blue-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Security Notice:</strong> 3 failed login attempts detected from unusual locations
          </AlertDescription>
        </Alert>
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Server className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>System Update:</strong> Database backup completed successfully
          </AlertDescription>
        </Alert>
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Performance:</strong> System running at optimal capacity
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4" />
            Command Center
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            User Control
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 text-sm">
            <Server className="h-4 w-4" />
            System Control
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Analytics Hub
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4" />
            Security Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <UserPresence />
          
          {/* System Command Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <Zap className="h-5 w-5" />
                  Administrative Command Center
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-400">
                  High-priority system operations and controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button size="lg" className="h-16 bg-red-600 hover:bg-red-700 text-white flex-col">
                    <UserPlus className="h-6 w-6 mb-1" />
                    Create Admin User
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 border-red-300 text-red-700 flex-col hover:bg-red-50">
                    <Shield className="h-6 w-6 mb-1" />
                    Security Lockdown
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 border-red-300 text-red-700 flex-col hover:bg-red-50">
                    <Database className="h-6 w-6 mb-1" />
                    Emergency Backup
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 border-red-300 text-red-700 flex-col hover:bg-red-50">
                    <Bell className="h-6 w-6 mb-1" />
                    System Broadcast
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-400">
                  Real-time system health monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-700 dark:text-blue-300">Database Performance</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">94%</span>
                    </div>
                    <Progress value={94} className="h-2 bg-blue-200" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-700 dark:text-blue-300">Server Resources</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">87%</span>
                    </div>
                    <Progress value={87} className="h-2 bg-blue-200" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-700 dark:text-blue-300">Security Score</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">98%</span>
                    </div>
                    <Progress value={98} className="h-2 bg-blue-200" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-700 dark:text-blue-300">User Satisfaction</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">91%</span>
                    </div>
                    <Progress value={91} className="h-2 bg-blue-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <FileText className="h-5 w-5" />
                  Critical System Events
                </CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  High-priority administrative actions and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium text-sm text-red-800 dark:text-red-200">Security Breach Attempt</p>
                        <p className="text-xs text-red-600 dark:text-red-400">Multiple failed admin login attempts</p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">URGENT</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">New Admin Account Created</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">User elevated to administrator privileges</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">1h ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-green-800 dark:text-green-200">System Backup Completed</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Full database backup and verification</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">30m ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  <Crown className="h-5 w-5" />
                  Admin Power Tools
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-400">
                  Advanced administrative functions and utilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800">
                  <Users className="h-4 w-4 mr-2" />
                  Mass User Management
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced System Config
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Command Center
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800">
                  <Database className="h-4 w-4 mr-2" />
                  Database Administration
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Advanced Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="audit">
          <SecurityOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};