import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, QrCode, Truck, Archive, Plus, Printer, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { CaseTable } from "@/components/CaseTable";
import { ChainOfCustody } from "@/components/ChainOfCustody";
import { EvidenceQueue } from "@/components/role-specific/EvidenceQueue";
import { AddExhibitDialog } from "@/components/AddExhibitDialog";
import { GenerateBarcodesDialog } from "@/components/GenerateBarcodesDialog";
import { PrintExhibitReceiptsDialog } from "@/components/PrintExhibitReceiptsDialog";
import { GenerateProfessionalReportDialog } from "@/components/GenerateProfessionalReportDialog";
import { OfficialReportsTable } from "@/components/OfficialReportsTable";
import { CaseSearch } from "@/components/CaseSearch";

export const ExhibitOfficerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExhibit, setShowAddExhibit] = useState(false);
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [showPrintReceipts, setShowPrintReceipts] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Evidence Management</h1>
            <p className="text-muted-foreground">Digital exhibits and chain of custody</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Package className="h-4 w-4 mr-1" />
          Exhibit Officer
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="exhibits" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Case Files
          </TabsTrigger>
          <TabsTrigger value="custody" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Chain of Custody
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CaseSearch />
          
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
                <CardTitle>Case Processing Tools</CardTitle>
                <CardDescription>Specialized exhibit management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowAddExhibit(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New case File
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowBarcodeGenerator(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Barcode Labels
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowPrintReceipts(true)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Exhibit Receipts
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
          <CaseTable />
        </TabsContent>

        <TabsContent value="custody">
          <ChainOfCustody />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Professional Reports</h2>
                <p className="text-muted-foreground">Generate comprehensive evidence management reports with statistics and case details</p>
              </div>
              <GenerateProfessionalReportDialog />
            </div>
            <OfficialReportsTable />
          </div>
        </TabsContent>
      </Tabs>

      <AddExhibitDialog 
        open={showAddExhibit} 
        onOpenChange={setShowAddExhibit}
      />

      <GenerateBarcodesDialog 
        open={showBarcodeGenerator} 
        onOpenChange={setShowBarcodeGenerator}
      />

      <PrintExhibitReceiptsDialog 
        open={showPrintReceipts} 
        onOpenChange={setShowPrintReceipts}
      />
    </div>
  );
};