import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { CommandingOfficerDashboard } from "@/components/dashboards/CommandingOfficerDashboard";
import { OfficerCommandingUnitDashboard } from "@/components/dashboards/OfficerCommandingUnitDashboard";
import { ExhibitOfficerDashboard } from "@/components/dashboards/ExhibitOfficerDashboard";
import { AnalystDashboard } from "@/components/dashboards/AnalystDashboard";
import { DashboardStats } from "@/components/DashboardStats";
import { RoleSwitcher } from "@/components/RoleSwitcher";

// Fallback dashboard for users without specific roles
const DefaultDashboard = () => (
  <div className="space-y-6">
    <DashboardStats />
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold mb-4">Welcome to the System</h2>
      <p className="text-muted-foreground">Please contact your administrator to assign you a role.</p>
    </div>
  </div>
);

const Index = () => {
  const { profile } = useAuth();
  const { role } = usePermissions();
  const [currentViewRole, setCurrentViewRole] = useState<string>(role || '');

  // Update currentViewRole when role changes
  useEffect(() => {
    if (role) {
      setCurrentViewRole(role);
    }
  }, [role]);

  // Route users to their role-specific dashboard based on current view role
  const renderDashboard = (role: string = currentViewRole) => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'commanding_officer':
        return <CommandingOfficerDashboard />;
      case 'officer_commanding_unit':
        return <OfficerCommandingUnitDashboard />;
      case 'exhibit_officer':
        return <ExhibitOfficerDashboard />;
      case 'analyst':
        return <AnalystDashboard />;
      default:
        return <DefaultDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        {/* Role switcher - only visible to admin users */}
        <RoleSwitcher 
          currentViewRole={currentViewRole} 
          onRoleChange={setCurrentViewRole} 
        />
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;