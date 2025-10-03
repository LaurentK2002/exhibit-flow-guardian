import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Microscope, FileText, Clock, CheckCircle, AlertCircle, Laptop } from "lucide-react";
import { MyAssignedCases } from "@/components/MyAssignedCases";
import { AnalysisTools } from "@/components/AnalysisTools";
import { AnalysisWorkbench } from "@/components/role-specific/AnalysisWorkbench";
import { CaseSearch } from "@/components/CaseSearch";

export const AnalystDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Forensic Analysis Workstation</h1>
          <p className="text-muted-foreground">Digital investigation and analysis tools</p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <Microscope className="h-4 w-4 mr-1" />
          Forensic Analyst
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Cases
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Analysis Tools
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CaseSearch />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">My Cases</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">12</div>
                <p className="text-xs text-blue-600 dark:text-blue-400">3 high priority</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Active Analysis</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">3</div>
                <p className="text-xs text-orange-600 dark:text-orange-400">Tools running</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">47</div>
                <p className="text-xs text-green-600 dark:text-green-400">This month</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Urgent</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800 dark:text-red-200">2</div>
                <p className="text-xs text-red-600 dark:text-red-400">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          <AnalysisWorkbench />
        </TabsContent>

        <TabsContent value="cases">
          <MyAssignedCases />
        </TabsContent>

        <TabsContent value="analysis">
          <AnalysisTools />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>My Analysis Reports</CardTitle>
              <CardDescription>Generated forensic analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Mobile Device Analysis Report</p>
                    <p className="text-sm text-muted-foreground">Case #CC2024-015 • Generated 2 hours ago</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm">Download</Button>
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