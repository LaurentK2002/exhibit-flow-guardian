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

export const CaseTable = ({ hideUnassigned = false }: { hideUnassigned?: boolean }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const casesData = data || [];
      
      // Fetch assigned user profiles separately
      const assignedUserIds = [...new Set(casesData.map((c: any) => c.assigned_to).filter(Boolean))];
      let profilesMap = new Map<string, any>();
      
      if (assignedUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', assignedUserIds as string[]);
        profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      }

      const enriched = casesData.map((c: any) => ({
        ...c,
        profiles: c.assigned_to ? profilesMap.get(c.assigned_to) : null,
      }));

      setCases(enriched as any);
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/30">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Case #</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Analyst</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Case Title</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Analyst Status</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Priority</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No cases found. <br />
                    <span className="text-sm">Create some cases to get started.</span>
                  </td>
                </tr>
              ) : (
                (hideUnassigned ? cases.filter((c) => c.assigned_to || c.analyst_id) : cases).map((caseItem) => (
                  <tr key={caseItem.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-medium text-foreground whitespace-nowrap">{caseItem.lab_number || caseItem.case_number}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-foreground whitespace-nowrap">
                        {caseItem.profiles?.full_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-medium text-foreground max-w-[200px] truncate">{caseItem.title}</div>
                    </td>
                    <td className="py-3 px-3">
                      <CaseStatusBadge status={(caseItem.status as CaseStatus) || 'open'} />
                    </td>
                    <td className="py-3 px-3">
                      {caseItem.analyst_status ? (
                        caseItem.analyst_status === 'pending' ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs whitespace-nowrap">Pending</Badge>
                        ) : caseItem.analyst_status === 'in_analysis' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs whitespace-nowrap">In Analysis</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap">Complete</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">Not Set</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={getPriorityVariant(caseItem.priority || 'medium')} className="text-xs whitespace-nowrap">
                        {caseItem.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCaseId(caseItem.id);
                          setDetailsOpen(true);
                        }}
                        className="whitespace-nowrap"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
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