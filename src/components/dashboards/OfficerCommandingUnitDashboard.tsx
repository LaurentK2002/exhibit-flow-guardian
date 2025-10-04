import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/DashboardStats";
import { CaseTable } from "@/components/CaseTable";
import { ExhibitAssignment } from "@/components/ExhibitAssignment";
import { TeamManagement } from "@/components/TeamManagement";
import { RecentActivity } from "@/components/RecentActivity";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CreateOfficialReportDialog } from "@/components/CreateOfficialReportDialog";
import { OfficialReportsTable } from "@/components/OfficialReportsTable";
import { FileText, Users, TrendingUp, AlertCircle, Send } from "lucide-react";
import { CaseSearch } from "@/components/CaseSearch";
import { ReportReviewPanel } from "@/components/ReportReviewPanel";
import { UnassignedCasesForOCU } from "@/components/UnassignedCasesForOCU";

export const OfficerCommandingUnitDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Command Center</h1>
          <p className="text-muted-foreground">Operational oversight and exhibit management</p>
        </div>
        <Badge variant="default" className="px-4 py-2">
          Officer Commanding Unit
        </Badge>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="review">Report Review</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CaseSearch />
          <DashboardStats />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Unit Operations Overview
                </CardTitle>
                <CardDescription>
                  Key operational metrics and unit performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Pending Exhibit Assignments</p>
                    <p className="text-sm text-muted-foreground">Exhibits awaiting analyst assignment</p>
                  </div>
                  <Badge variant="destructive">12</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Active Analyses</p>
                    <p className="text-sm text-muted-foreground">Currently being processed</p>
                  </div>
                  <Badge variant="default">28</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Completed This Week</p>
                    <p className="text-sm text-muted-foreground">Finished analyses</p>
                  </div>
                  <Badge variant="secondary">15</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Priority Actions
                </CardTitle>
                <CardDescription>
                  Immediate actions requiring OCU attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('assignments')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Assign 12 pending exhibits to analysts
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('analytics')}>
                  <Users className="h-4 w-4 mr-2" />
                  Review analyst workload distribution
                </Button>
                <CreateOfficialReportDialog>
                  <Button variant="outline" className="w-full justify-start">
                    <Send className="h-4 w-4 mr-2" />
                    Generate official report for CO
                  </Button>
                </CreateOfficialReportDialog>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('cases')}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Address 3 overdue case analyses
                </Button>
              </CardContent>
            </Card>
          </div>

          <RecentActivity />
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <UnassignedCasesForOCU />
          <CaseTable />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <ExhibitAssignment />
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <ReportReviewPanel />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Monitor team performance and manage analyst assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Official Reports</h2>
              <p className="text-muted-foreground">
                Generate and manage official reports for the Commanding Officer
              </p>
            </div>
            <CreateOfficialReportDialog>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Create New Report
              </Button>
            </CreateOfficialReportDialog>
          </div>
          <OfficialReportsTable />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unit Analytics</CardTitle>
              <CardDescription>
                Performance metrics and operational insights for command reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};