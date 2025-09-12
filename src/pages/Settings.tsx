import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SystemSettings } from "@/components/SystemSettings";

export default function Settings() {
  useEffect(() => {
    document.title = "System Settings";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', 'Configure system settings and preferences.');
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
        <h1 className="sr-only">System Settings</h1>
        <SystemSettings />
      </main>
    </div>
  );
}
