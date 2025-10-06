import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, UserCheck, Clock, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from "@/hooks/useRealtime";
import { useToast } from "@/components/ui/use-toast";

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  analyst_id: string | null;
  created_at: string;
}

interface Analyst {
  id: string;
  full_name: string;
  badge_number: string;
}

export const CaseAssignment = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysts, setSelectedAnalysts] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCases();
    fetchAnalysts();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .is('assigned_to', null)
        .is('analyst_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Double-check filtering to ensure only truly unassigned cases
      const unassignedCases = (data || []).filter(
        c => !c.assigned_to && !c.analyst_id
      );
      setCases(unassignedCases);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    }
  };

  // Real-time refresh when cases table changes
  useRealtime('cases', fetchCases);

  const fetchAnalysts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, badge_number')
        .in('role', ['analyst', 'forensic_analyst'])
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching analysts:', error);
        setAnalysts([]);
      } else {
        setAnalysts(data || []);
      }
    } catch (error) {
      console.error('Error fetching analysts:', error);
      setAnalysts([]);
    } finally {
      setLoading(false);
    }
  };

  const assignCase = async (caseId: string, analystId: string) => {
    try {
      // Get an active exhibit officer to link to the case
      const { data: exhibitOfficer } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'exhibit_officer')
        .eq('is_active', true)
        .limit(1)
        .single();

      // Update case with analyst and exhibit officer
      const { error } = await supabase
        .from('cases')
        .update({ 
          analyst_id: analystId,
          assigned_to: analystId,
          exhibit_officer_id: exhibitOfficer?.id || null
        })
        .eq('id', caseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Case assigned successfully to analyst and exhibit officer",
      });

      // Immediately remove from local state for instant UI update
      setCases(prevCases => prevCases.filter(c => c.id !== caseId));
      
      // Refresh cases list to ensure consistency
      await fetchCases();
    } catch (error) {
      console.error('Error assigning case:', error);
      toast({
        title: "Error",
        description: "Failed to assign case",
        variant: "destructive",
      });
      // Refetch on error to restore correct state
      fetchCases();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Case Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading cases...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Case Assignment Dashboard
          </CardTitle>
          <CardDescription>Assign cases to analysts and manage workload distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {cases.length}
              </div>
              <div className="text-sm text-muted-foreground">Unassigned Cases</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {cases.filter(c => c.priority === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {cases.filter(c => c.priority === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Priority</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysts.length}
              </div>
              <div className="text-sm text-muted-foreground">Available Analysts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cases Requiring Assignment</CardTitle>
          <CardDescription>Assign cases to available analysts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Assign To</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.case_number}</TableCell>
                    <TableCell>{caseItem.title}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedAnalysts[caseItem.id] || ""}
                        onValueChange={(analystId) => {
                          setSelectedAnalysts((prev) => ({ ...prev, [caseItem.id]: analystId }));
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select analyst" />
                        </SelectTrigger>
                        <SelectContent>
                          {analysts.map((analyst) => (
                            <SelectItem key={analyst.id} value={analyst.id}>
                              {analyst.full_name} ({analyst.badge_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => {
                          const analystId = selectedAnalysts[caseItem.id];
                          if (!analystId) {
                            toast({
                              title: "Select analyst",
                              description: "Please choose an analyst first.",
                              variant: "destructive",
                            });
                            return;
                          }
                          assignCase(caseItem.id, analystId);
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};