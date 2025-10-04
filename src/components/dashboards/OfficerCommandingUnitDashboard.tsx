import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/DashboardStats";
import { CaseTable } from "@/components/CaseTable";
import { ExhibitAssignment } from "@/components/ExhibitAssignment";
import { TeamManagement } from "@/components/TeamManagement";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CreateOfficialReportDialog } from "@/components/CreateOfficialReportDialog";
import { OfficialReportsTable } from "@/components/OfficialReportsTable";
import { FileText } from "lucide-react";
import { ReportReviewPanel } from "@/components/ReportReviewPanel";
import { ProfessionalReportReview } from "@/components/ProfessionalReportReview";
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardStats />
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <UnassignedCasesForOCU />
          <CaseTable />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <ExhibitAssignment />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Tabs defaultValue="analyst" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analyst">Analyst Reports</TabsTrigger>
              <TabsTrigger value="professional">Professional Reports</TabsTrigger>
              <TabsTrigger value="official">Official Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="analyst">
              <ReportReviewPanel />
            </TabsContent>

            <TabsContent value="professional">
              <ProfessionalReportReview />
            </TabsContent>

            <TabsContent value="official">
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
          </Tabs>
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