import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Database } from "@/integrations/supabase/types";
import { CaseStatusBadge, CaseStatus } from "./CaseStatusBadge";
import { CaseDetailsDialog } from "./CaseDetailsDialog";

type Case = Database['public']['Tables']['cases']['Row'] & {
  profiles?: {
    full_name: string;
    role: string;
  } | null;
  supervisor?: {
    full_name: string;
  } | null;
  exhibits_count?: number;
  activities_count?: number;
};

export const CaseTable = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          profiles:assigned_to(full_name, role)
        `)
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases((data as any) || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Real-time updates
  useRealtime('cases', fetchCases);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading cases...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Cases</span>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Case Number</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Analyst</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Case Title</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No cases found. <br />
                    <span className="text-sm">Create some cases to get started.</span>
                  </td>
                </tr>
              ) : (
                cases.map((caseItem) => (
                  <tr key={caseItem.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-mono text-sm font-medium text-foreground">{caseItem.lab_number || caseItem.case_number}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-foreground">
                        {caseItem.profiles?.full_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm font-medium text-foreground">{caseItem.title}</div>
                    </td>
                    <td className="py-3 px-2">
                      <CaseStatusBadge status={(caseItem.status as CaseStatus) || 'open'} />
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={getPriorityVariant(caseItem.priority || 'medium')} className="text-xs">
                        {caseItem.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCaseId(caseItem.id);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CaseDetailsDialog
        caseId={selectedCaseId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </Card>
  );
};