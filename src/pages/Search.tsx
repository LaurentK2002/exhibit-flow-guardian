import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SearchAndFilter, type SearchFilters } from "@/components/SearchAndFilter";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    status: "all",
    priority: "all",
    assignedTo: "all",
    dateRange: { from: undefined, to: undefined },
    type: "all",
  });

  useEffect(() => {
    document.title = "Search";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', 'Search across cases, exhibits, and users.');
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
        <h1 className="sr-only">Search</h1>
        <SearchAndFilter 
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters({
            search: "",
            status: "all",
            priority: "all",
            assignedTo: "all",
            dateRange: { from: undefined, to: undefined },
            type: "all",
          })}
        />
      </main>
    </div>
  );
}
