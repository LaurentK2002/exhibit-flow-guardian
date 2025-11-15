import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SecurityOverview } from "@/components/security/SecurityOverview";
import { AuditLogsDashboard } from "@/components/security/AuditLogsDashboard";
import { SessionManagement } from "@/components/security/SessionManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChiefOfCyberGuard } from "@/components/auth/ChiefOfCyberGuard";
import { Shield, FileText, Users } from "lucide-react";

export default function Security() {
  useEffect(() => {
    document.title = "Security Alerts & Audit";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', 'View security alerts and audit logs.');
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = window.location.href;
    document.head.appendChild(link);
    return () => { if (meta && prev) meta.setAttribute('content', prev); document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security & Compliance
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor security events, audit logs, and system access (Chief of Cyber Access Required)
          </p>
        </div>

        <ChiefOfCyberGuard showWarning>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Overview
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Sessions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <SecurityOverview />
            </TabsContent>

            <TabsContent value="audit">
              <AuditLogsDashboard />
            </TabsContent>

            <TabsContent value="sessions">
              <SessionManagement />
            </TabsContent>
          </Tabs>
        </ChiefOfCyberGuard>
      </main>
    </div>
  );
}
