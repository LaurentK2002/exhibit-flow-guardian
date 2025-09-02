import { Navigation } from "@/components/Navigation";
import { DashboardStats } from "@/components/DashboardStats";
import { ExhibitTable } from "@/components/ExhibitTable";
import { RecentActivity } from "@/components/RecentActivity";
import { AddCaseDialog } from "@/components/AddCaseDialog";
import { AddExhibitDialog } from "@/components/AddExhibitDialog";
import { SearchAndFilter, SearchFilters } from "@/components/SearchAndFilter";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CaseManagement } from "@/components/CaseManagement";
import { UserPresence } from "@/components/UserPresence";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const Index = () => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [showAddExhibit, setShowAddExhibit] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    dateRange: { from: undefined, to: undefined },
    type: 'all'
  });

  const handleCaseAdded = () => {
    // Refresh dashboard stats and activities
    window.location.reload();
  };

  const handleExhibitAdded = () => {
    // Refresh dashboard stats and activities
    window.location.reload();
  };

  const handleNewCase = () => {
    setShowAddCase(true);
  };

  const handleNewExhibit = () => {
    setShowAddExhibit(true);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
      dateRange: { from: undefined, to: undefined },
      type: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-4xl font-bold mb-3">
              Digital Forensics Command Center
            </h2>
            <p className="text-blue-100 text-lg max-w-2xl">
              Advanced cyber crimes investigation and digital evidence management system for Tanzania Police Force
            </p>
            <div className="flex items-center mt-4 space-x-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                🔒 Secure Environment
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                🚀 Real-time Processing
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                📊 Advanced Analytics
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <SearchAndFilter 
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />

        {/* Stats Section */}
        <DashboardStats />

        {/* Main Tabs Interface */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <ExhibitTable />
                
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={handleNewExhibit}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 animate-fade-in"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <div className="text-sm font-medium">New Exhibit</div>
                      </div>
                    </button>
                    <button 
                      onClick={handleNewCase}
                      className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 animate-fade-in"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📋</div>
                        <div className="text-sm font-medium">New Case</div>
                      </div>
                    </button>
                    <button className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 animate-fade-in">
                      <div className="text-center">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-sm font-medium">Generate Report</div>
                      </div>
                    </button>
                    <button className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 animate-fade-in">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔍</div>
                        <div className="text-sm font-medium">Search Archive</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <RecentActivity />
                <UserPresence />
                
                {/* System Status */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Forensic Tools</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Evidence Storage</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">85% Available</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Network Security</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Secure</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Real-time Sync</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cases">
            <CaseManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="team">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <UserPresence />
              </div>
              <div>
                <RecentActivity />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddCaseDialog 
        open={showAddCase}
        onOpenChange={setShowAddCase}
        onSuccess={handleCaseAdded}
      />
      
      <AddExhibitDialog 
        open={showAddExhibit}
        onOpenChange={setShowAddExhibit}
        onSuccess={handleExhibitAdded}
      />
    </div>
  );
};

export default Index;
