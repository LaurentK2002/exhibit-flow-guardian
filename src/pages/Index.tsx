import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { UserPresence } from "@/components/UserPresence";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { CommandingOfficerDashboard } from "@/components/dashboards/CommandingOfficerDashboard";
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
  const [viewingRole, setViewingRole] = useState<string>('');

  // Use viewing role for admins, otherwise use actual role
  const effectiveRole = profile?.role === 'admin' && viewingRole ? viewingRole : profile?.role;

  // Route users to their role-specific dashboard
  const renderDashboard = () => {
    const role = effectiveRole;
    
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'commanding_officer':
        return <CommandingOfficerDashboard />;
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
      <main className="container mx-auto px-6 py-8">
        <UserPresence />
        {profile?.role === 'admin' && (
          <RoleSwitcher 
            currentViewRole={effectiveRole || profile?.role || ''} 
            onRoleChange={setViewingRole}
          />
        )}
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;