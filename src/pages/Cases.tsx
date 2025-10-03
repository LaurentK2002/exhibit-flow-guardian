import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { CaseManagement } from "@/components/CaseManagement";
import { CaseSearch } from "@/components/CaseSearch";
import { CaseTable } from "@/components/CaseTable";

export default function Cases() {
  useEffect(() => {
    document.title = "Cases - Case Management";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', 'Case management dashboard for all users.');
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = window.location.href;
    document.head.appendChild(link);
    return () => { if (meta && prev) meta.setAttribute('content', prev); document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 py-8 space-y-6 max-w-7xl">
        <h1 className="sr-only">Case Management</h1>
        <CaseSearch />
        <CaseManagement />
        <section>
          <CaseTable />
        </section>
      </main>
    </div>
  );
}
