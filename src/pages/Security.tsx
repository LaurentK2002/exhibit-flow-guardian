import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SecurityOverview } from "@/components/security/SecurityOverview";
import { AuditLogsDashboard } from "@/components/security/AuditLogsDashboard";

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
      <main className="container mx-auto px-6 py-8">
        <h1 className="sr-only">Security</h1>
        <SecurityOverview />
        <section className="mt-6">
          <AuditLogsDashboard />
        </section>
      </main>
    </div>
  );
}
