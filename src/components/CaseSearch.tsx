import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CaseStatusBadge, CaseStatus } from "./CaseStatusBadge";
import { CaseDetailsDialog } from "./CaseDetailsDialog";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  case_number: string;
  lab_number: string | null;
  title: string;
  status: string;
  priority: string;
  analyst?: { full_name: string } | null;
}

export const CaseSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const canSearchAllCases = () => {
    if (!profile?.role) return false;
    const allowedRoles = [
      "administrator",
      "commanding_officer",
      "officer_commanding_unit",
      "exhibit_officer",
      "supervisor",
    ];
    return allowedRoles.includes(profile.role);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to search cases",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("cases")
        .select(
          "id, case_number, lab_number, title, status, priority, analyst_id"
        )
        .ilike('lab_number', `%${searchQuery}%`);

      // If user is an analyst, only show their assigned cases
      if (profile?.role === "forensic_analyst") {
        query = query.eq("analyst_id", user.id);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Results",
          description: profile?.role === "forensic_analyst" 
            ? "No assigned cases found matching your search"
            : "No cases found matching your search",
        });
      }

      setSearchResults((data as any) || []);
    } catch (error) {
      console.error("Error searching cases:", error);
      toast({
        title: "Error",
        description: "Failed to search cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
placeholder={
                  profile?.role === "forensic_analyst"
                    ? "Search your assigned cases by lab number..."
                    : "Search cases by lab number..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <Button variant="outline" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {profile?.role === "forensic_analyst" && (
            <p className="text-sm text-muted-foreground mt-2">
              You can only search cases assigned to you
            </p>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Search Results ({searchResults.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear Results
                </Button>
              </div>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-semibold text-sm">
                          {result.case_number}
                        </span>
                        {result.lab_number && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-mono text-sm">
                              {result.lab_number}
                            </span>
                          </>
                        )}
                        <CaseStatusBadge
                          status={(result.status as CaseStatus) || "open"}
                        />
                        <Badge variant={getPriorityColor(result.priority)}>
                          {result.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-medium">{result.title}</p>
                      {result.analyst && (
                        <p className="text-sm text-muted-foreground">
                          Analyst: {result.analyst.full_name}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCaseId(result.id);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CaseDetailsDialog
        caseId={selectedCaseId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};
