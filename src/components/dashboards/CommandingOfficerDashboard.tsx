import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, BarChart3, UserCheck, Star, CheckCircle, FileText } from "lucide-react";
import { DashboardStats } from "@/components/DashboardStats";
import { TeamManagement } from "@/components/TeamManagement";
import { CaseAssignment } from "@/components/CaseAssignment";
import { StaffProductivity } from "@/components/role-specific/StaffProductivity";
import { OfficialReportsTable } from "@/components/OfficialReportsTable";

export const CommandingOfficerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground">Team leadership and case oversight</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Star className="h-4 w-4 mr-1" />
          Commanding Officer
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardStats />
          <StaffProductivity />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Strategic Command Overview
                </CardTitle>
                <CardDescription>High-level operational insights and decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-blue-800 dark:text-blue-200">Department Goals</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Q1 case resolution target: 85% (Currently: 87%)</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="font-medium text-green-800 dark:text-green-200">Team Expansion</p>
                    <p className="text-sm text-green-600 dark:text-green-400">3 new analysts starting next month</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="font-medium text-orange-800 dark:text-orange-200">Training Initiative</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Mobile forensics certification program</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Command Actions</CardTitle>
                <CardDescription>Leadership and oversight tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Staff Performance Review
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Final Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Department Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Unit Reports</h2>
            <p className="text-muted-foreground">
              Review official reports submitted by the Officer Commanding Unit
            </p>
          </div>
          <OfficialReportsTable />
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Reports and documents requiring your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Forensic Analysis Report - Case #CC2024-001</p>
                    <p className="text-sm text-muted-foreground">Submitted by Analyst Johnson</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Review</Button>
                    <Button size="sm">Approve</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};