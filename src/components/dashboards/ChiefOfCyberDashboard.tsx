import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, BarChart3, Users, FileText, TrendingUp, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { DashboardStats } from "@/components/DashboardStats";
import { TeamManagement } from "@/components/TeamManagement";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { StaffProductivity } from "@/components/role-specific/StaffProductivity";
import { OfficialReportsTable } from "@/components/OfficialReportsTable";
import { PendingApprovals } from "@/components/approvals/PendingApprovals";
import { CaseSearch } from "@/components/CaseSearch";

export const ChiefOfCyberDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chief of Cyber Command Center</h1>
          <p className="text-muted-foreground">Strategic oversight and departmental leadership</p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <Shield className="h-4 w-4 mr-1" />
          Chief of Cyber
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CaseSearch />
          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Strategic Cyber Command
                </CardTitle>
                <CardDescription>High-level cyber threat intelligence and operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Operational Status</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Threat Level</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Elevated</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Executive Actions</CardTitle>
                <CardDescription>Strategic command tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Department Performance Review
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Strategic Approvals
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Executive Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Cyber Threat Assessment
                </Button>
              </CardContent>
            </Card>
          </div>

          <StaffProductivity />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Official Reports</CardTitle>
              <CardDescription>Review and approve departmental reports</CardDescription>
            </CardHeader>
            <CardContent>
              <OfficialReportsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Strategic decisions and approvals requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <PendingApprovals />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
