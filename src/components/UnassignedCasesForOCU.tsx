import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Database } from "@/integrations/supabase/types";
import { CaseStatusBadge, CaseStatus } from "./CaseStatusBadge";
import { Eye, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Case = Database['public']['Tables']['cases']['Row'] & {
  profiles?: {
    full_name: string;
    role: string;
  } | null;
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
};

export const UnassignedCasesForOCU = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [analysts, setAnalysts] = useState<Profile[]>([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  const fetchUnassignedCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .is('assigned_to', null)
        .is('analyst_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter out any cases that have assigned_to or analyst_id set
      const unassignedCases = (data || []).filter(
        c => !c.assigned_to && !c.analyst_id
      );
      setCases((unassignedCases as any) || []);
    } catch (error) {
      console.error('Error fetching unassigned cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysts = async () => {
    try {
      // Get analyst user IDs from user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'analyst');

      if (rolesError) throw rolesError;

      const analystIds = userRoles?.map(r => r.user_id) || [];

      // Fetch profiles for analysts
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', analystIds)
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching analysts:', error);
        setAnalysts([]);
      } else {
        const analystsWithRole = (data || []).map(a => ({ ...a, role: 'analyst' as const }));
        setAnalysts(analystsWithRole);
      }
    } catch (error) {
      console.error('Error fetching analysts:', error);
      setAnalysts([]);
    }
  };

  useEffect(() => {
    fetchUnassignedCases();
    fetchAnalysts();
  }, []);

  // Real-time updates
  useRealtime('cases', fetchUnassignedCases);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleAssignCase = async () => {
    if (!selectedCase || !selectedAnalyst) return;

    setAssigning(true);
    try {
      // Update both assigned_to and analyst_id for consistency
      const { error } = await supabase
        .from('cases')
        .update({ 
          assigned_to: selectedAnalyst,
          analyst_id: selectedAnalyst 
        })
        .eq('id', selectedCase.id);

      if (error) throw error;

      // Immediately remove from local state for instant UI update
      setCases(prevCases => prevCases.filter(c => c.id !== selectedCase.id));

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: selectedCase.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          activity_type: 'case_assigned',
          description: `Case ${selectedCase.case_number} assigned to analyst`,
        });

      toast({
        title: "Case Assigned",
        description: `Case ${selectedCase.case_number} has been assigned to the analyst.`,
      });

      setAssignDialogOpen(false);
      setSelectedCase(null);
      setSelectedAnalyst("");
      
      // Refresh the list to ensure consistency
      await fetchUnassignedCases();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Refetch on error to restore correct state
      fetchUnassignedCases();
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Cases</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Unassigned Cases Awaiting Assignment</span>
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {cases.length} Pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted/30">
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Case #</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Created</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Priority</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No unassigned cases. <br />
                      <span className="text-sm">All cases have been assigned to analysts.</span>
                    </td>
                  </tr>
                ) : (
                  cases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
                          {caseItem.lab_number || caseItem.case_number}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-xs font-medium text-foreground max-w-[300px] truncate">
                          {caseItem.title}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-foreground whitespace-nowrap">
                          {formatDate(caseItem.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <CaseStatusBadge status={(caseItem.status as CaseStatus) || 'open'} />
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={getPriorityVariant(caseItem.priority || 'medium')} className="text-xs whitespace-nowrap">
                          {caseItem.priority?.toUpperCase() || 'MEDIUM'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setAssignDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
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
      </Card>

      {/* Case Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.case_number}</DialogTitle>
            <DialogDescription>
              Full case file information
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Case Number</Label>
                  <p className="font-mono font-medium">{selectedCase.case_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Lab Number</Label>
                  <p className="font-mono font-medium">{selectedCase.lab_number || 'Not assigned'}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedCase.title}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedCase.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Victim Name</Label>
                  <p className="text-sm">{selectedCase.victim_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Suspect Name</Label>
                  <p className="text-sm">{selectedCase.suspect_name || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm">{selectedCase.location || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Incident Date</Label>
                  <p className="text-sm">{formatDate(selectedCase.incident_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <CaseStatusBadge status={(selectedCase.status as CaseStatus) || 'open'} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    <Badge variant={getPriorityVariant(selectedCase.priority || 'medium')}>
                      {selectedCase.priority?.toUpperCase() || 'MEDIUM'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm">{formatDate(selectedCase.created_at)}</p>
                </div>
              </div>

              {selectedCase.case_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Case Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedCase.case_notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setDetailsOpen(false);
                    setAssignDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Analyst
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Case to Analyst</DialogTitle>
            <DialogDescription>
              Select an analyst to assign case {selectedCase?.case_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Analyst</Label>
              <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an analyst..." />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      {analyst.full_name} - {analyst.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignCase} 
                disabled={!selectedAnalyst || assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Case'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
