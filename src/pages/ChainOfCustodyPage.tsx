import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { ChainOfCustody } from "@/components/ChainOfCustody";

export default function ChainOfCustodyPage() {
  useEffect(() => {
    document.title = "Chain of Custody";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', 'Track and audit chain of custody for exhibits.');
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
        <h1 className="sr-only">Chain of Custody</h1>
        <ChainOfCustody />
      </main>
    </div>
  );
}
