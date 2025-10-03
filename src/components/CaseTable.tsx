import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Users, Clock, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Database } from "@/integrations/supabase/types";
import { CaseStatusBadge, CaseStatus } from "./CaseStatusBadge";
import { UpdateCasePriorityDialog } from "./UpdateCasePriorityDialog";
import { useAuth } from "@/contexts/AuthContext";

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
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false);
  const { profile } = useAuth();
  
  const canUpdatePriority = profile?.role === 'commanding_officer' || profile?.role === 'officer_commanding_unit';

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          profiles:assigned_to(full_name, role),
          supervisor:supervisor_id(full_name)
        `)
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get exhibit counts for each case
      const casesWithCounts = await Promise.all(
        (data || []).map(async (caseItem) => {
          const { count: exhibitsCount } = await supabase
            .from('exhibits')
            .select('*', { count: 'exact', head: true })
            .eq('case_id', caseItem.id);

          const { count: activitiesCount } = await supabase
            .from('case_activities')
            .select('*', { count: 'exact', head: true })
            .eq('case_id', caseItem.id);

          return {
            ...caseItem,
            exhibits_count: exhibitsCount || 0,
            activities_count: activitiesCount || 0
          };
        })
      );

      setCases(casesWithCounts as any);
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
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Lab Number</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Assigned To</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Exhibits</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No cases found. <br />
                    <span className="text-sm">Create some cases to get started.</span>
                  </td>
                </tr>
              ) : (
                cases.map((caseItem) => (
                  <tr key={caseItem.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-mono text-sm font-medium text-foreground">{caseItem.lab_number || caseItem.case_number}</span>
                      <div className="text-xs text-muted-foreground">Lab Number</div>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="text-sm font-medium text-foreground">{caseItem.title}</div>
                        {caseItem.location && (
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {caseItem.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-foreground">
                        {caseItem.profiles?.full_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={getPriorityVariant(caseItem.priority || 'medium')} className="text-xs">
                        {caseItem.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </td>
                     <td className="py-3 px-2">
                       <CaseStatusBadge status={(caseItem.status as CaseStatus) || 'open'} />
                     </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {caseItem.exhibits_count || 0}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {caseItem.activities_count || 0}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdatePriority && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Update Priority"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setIsPriorityDialogOpen(true);
                            }}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="View Team">
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      {selectedCase && (
        <UpdateCasePriorityDialog
          caseId={selectedCase.id}
          caseNumber={selectedCase.case_number}
          caseTitle={selectedCase.title}
          currentPriority={selectedCase.priority || 'medium'}
          userRole={profile?.role || ''}
          open={isPriorityDialogOpen}
          onOpenChange={setIsPriorityDialogOpen}
          onUpdate={fetchCases}
        />
      )}
    </Card>
  );
};