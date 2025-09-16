import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, QrCode, Truck, Archive, Plus, FolderPlus } from "lucide-react";
import { ExhibitTable } from "@/components/ExhibitTable";
import { ChainOfCustody } from "@/components/ChainOfCustody";
import { EvidenceQueue } from "@/components/role-specific/EvidenceQueue";
import { AddExhibitDialog } from "@/components/AddExhibitDialog";
import { CreateCaseFileDialog } from "@/components/CreateCaseFileDialog";

export const ExhibitOfficerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExhibit, setShowAddExhibit] = useState(false);
  const [showCreateCaseFile, setShowCreateCaseFile] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Evidence Management</h1>
          <p className="text-muted-foreground">Digital exhibits and chain of custody</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Package className="h-4 w-4 mr-1" />
          Exhibit Officer
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="exhibits" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Exhibits
          </TabsTrigger>
          <TabsTrigger value="custody" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Chain of Custody
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            Case Files
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EvidenceQueue />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Chain of Custody Alerts
                </CardTitle>
                <CardDescription>Items requiring custody attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">No custody alerts</p>
                        <p className="text-xs text-muted-foreground">New alerts will appear here as you add data.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence Processing Tools</CardTitle>
                <CardDescription>Specialized exhibit management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowAddExhibit(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Intake New Evidence
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowCreateCaseFile(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Case File
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Barcode Labels
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Custody Documentation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  Storage Management
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exhibits">
          <ExhibitTable />
        </TabsContent>

        <TabsContent value="custody">
          <ChainOfCustody />
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>Case File Management</CardTitle>
              <CardDescription>Create and manage case files with documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Create new case files and upload supporting documents</p>
                <Button onClick={() => setShowCreateCaseFile(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create New Case File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Exhibit Reports</CardTitle>
              <CardDescription>Generate and manage evidence reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Generate comprehensive exhibit reports</p>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddExhibitDialog 
        open={showAddExhibit} 
        onOpenChange={setShowAddExhibit}
        onSuccess={() => {
          // Refresh the exhibits table or show success message
        }}
      />
      
      <CreateCaseFileDialog 
        open={showCreateCaseFile} 
        onOpenChange={setShowCreateCaseFile}
        onSuccess={() => {
          // Refresh case files or show success message
        }}
      />
    </div>
  );
};