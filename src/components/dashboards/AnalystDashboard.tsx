import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Microscope, FileText, Clock, CheckCircle, AlertCircle, Laptop } from "lucide-react";
import { MyAssignedCases } from "@/components/MyAssignedCases";
import { AnalysisTools } from "@/components/AnalysisTools";

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Cases</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 high priority</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Currently analyzing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Requires immediate attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Current Analysis Tasks</CardTitle>
                <CardDescription>Your active forensic investigations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Mobile Device Analysis - iPhone 13</p>
                      <p className="text-sm text-muted-foreground">Case #CC2024-015 • Data extraction in progress</p>
                      <div className="w-full bg-muted h-2 rounded-full mt-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-4">75%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Network Traffic Analysis</p>
                      <p className="text-sm text-muted-foreground">Case #CC2024-012 • Suspicious activity detected</p>
                      <div className="w-full bg-muted h-2 rounded-full mt-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '30%'}}></div>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-4">30%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Tools</CardTitle>
                <CardDescription>Quick access to forensic tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Laptop className="h-4 w-4 mr-2" />
                  Mobile Forensics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Microscope className="h-4 w-4 mr-2" />
                  Network Analysis
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
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