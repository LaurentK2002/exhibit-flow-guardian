import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, UserCheck, Clock, AlertCircle, RotateCcw, Users } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Exhibit = Database['public']['Tables']['exhibits']['Row'] & {
  cases?: {
    case_number: string;
    priority: Database['public']['Enums']['case_priority'];
  } | null;
  analyst_profile?: {
    full_name: string;
    badge_number: string;
  } | null;
};

interface Analyst {
  id: string;
  full_name: string;
  badge_number: string;
}

export const ExhibitAssignment = () => {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibit, setSelectedExhibit] = useState<Exhibit | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExhibits();
    fetchAnalysts();
  }, []);

  const fetchExhibits = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibits')
        .select(`
          *,
          cases:case_id (
            case_number,
            priority
          ),
          analyst_profile:assigned_analyst (
            full_name,
            badge_number
          )
        `)
        .order('received_date', { ascending: false });

      if (error) throw error;
      setExhibits((data as unknown) as Exhibit[] || []);
    } catch (error) {
      console.error('Error fetching exhibits:', error);
    }
  };

  const fetchAnalysts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, badge_number')
        .eq('role', 'forensic_analyst')
        .eq('is_active', true);

      if (error) throw error;
      setAnalysts(data || []);
    } catch (error) {
      console.error('Error fetching analysts:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignExhibit = async (exhibitId: string, analystId: string, isReassignment = false) => {
    try {
      // Update exhibit assignment
      const { error: updateError } = await supabase
        .from('exhibits')
        .update({ 
          assigned_analyst: analystId,
          status: 'in_analysis',
          updated_at: new Date().toISOString()
        })
        .eq('id', exhibitId);

      if (updateError) throw updateError;

      // Log the assignment activity
      const exhibit = exhibits.find(e => e.id === exhibitId);
      const analyst = analysts.find(a => a.id === analystId);
      
      const { error: activityError } = await supabase
        .from('case_activities')
        .insert({
          case_id: exhibit?.case_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          activity_type: isReassignment ? 'exhibit_reassigned' : 'exhibit_assigned',
          description: `Exhibit ${exhibit?.exhibit_number} ${isReassignment ? 'reassigned to' : 'assigned to'} ${analyst?.full_name}`,
          metadata: {
            exhibit_id: exhibitId,
            exhibit_number: exhibit?.exhibit_number,
            analyst_id: analystId,
            analyst_name: analyst?.full_name,
            timestamp: new Date().toISOString()
          }
        });

      if (activityError) console.warn('Failed to log activity:', activityError);

      toast({
        title: "Success",
        description: `Exhibit ${isReassignment ? 'reassigned' : 'assigned'} successfully`,
      });

      fetchExhibits(); // Refresh exhibits
      setShowReassignDialog(false);
      setSelectedExhibit(null);
    } catch (error) {
      console.error('Error assigning exhibit:', error);
      toast({
        title: "Error",
        description: `Failed to ${isReassignment ? 'reassign' : 'assign'} exhibit`,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_analysis': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'analysis_complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'released': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'destroyed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const unassignedExhibits = exhibits.filter(e => !e.assigned_analyst);
  const assignedExhibits = exhibits.filter(e => e.assigned_analyst);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exhibit Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading exhibits...</p>
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
          <CardDescription>Assign exhibits to analysts and manage workload distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {unassignedExhibits.length}
              </div>
              <div className="text-sm text-muted-foreground">Unassigned Exhibits</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {exhibits.filter(e => e.status === 'in_analysis').length}
              </div>
              <div className="text-sm text-muted-foreground">In Analysis</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {exhibits.filter(e => e.cases?.priority === 'critical' || e.cases?.priority === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
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

      {/* Unassigned Exhibits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Exhibits Requiring Assignment
          </CardTitle>
          <CardDescription>Assign unassigned exhibits to available analysts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exhibit #</TableHead>
                  <TableHead>Case #</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Assign To</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedExhibits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      All exhibits are assigned to analysts
                    </TableCell>
                  </TableRow>
                ) : (
                  unassignedExhibits.map((exhibit) => (
                    <TableRow key={exhibit.id}>
                      <TableCell className="font-mono font-medium">{exhibit.exhibit_number}</TableCell>
                      <TableCell>{exhibit.cases?.case_number || 'N/A'}</TableCell>
                      <TableCell>{exhibit.device_name}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(exhibit.cases?.priority || 'medium')}>
                          {exhibit.cases?.priority || 'medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(exhibit.received_date || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(analystId) => {
                            const selectElement = document.querySelector(
                              `[data-exhibit-id="${exhibit.id}"]`
                            ) as HTMLSelectElement;
                            if (selectElement) {
                              selectElement.setAttribute('data-selected-analyst', analystId);
                            }
                          }}
                        >
                          <SelectTrigger className="w-48" data-exhibit-id={exhibit.id}>
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
                            const selectElement = document.querySelector(
                              `[data-exhibit-id="${exhibit.id}"]`
                            ) as HTMLSelectElement;
                            const analystId = selectElement?.getAttribute('data-selected-analyst');
                            if (analystId) {
                              assignExhibit(exhibit.id, analystId);
                            }
                          }}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Exhibits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Assigned Exhibits
          </CardTitle>
          <CardDescription>View and manage already assigned exhibits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exhibit #</TableHead>
                  <TableHead>Case #</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedExhibits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No exhibits assigned yet
                    </TableCell>
                  </TableRow>
                ) : (
                  assignedExhibits.map((exhibit) => (
                    <TableRow key={exhibit.id}>
                      <TableCell className="font-mono font-medium">{exhibit.exhibit_number}</TableCell>
                      <TableCell>{exhibit.cases?.case_number || 'N/A'}</TableCell>
                      <TableCell>{exhibit.device_name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exhibit.analyst_profile?.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {exhibit.analyst_profile?.badge_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(exhibit.status || 'received')}>
                          {exhibit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(exhibit.cases?.priority || 'medium')}>
                          {exhibit.cases?.priority || 'medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedExhibit(exhibit);
                            setShowReassignDialog(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reassignment Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Exhibit</DialogTitle>
            <DialogDescription>
              Change the analyst assigned to exhibit {selectedExhibit?.exhibit_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm"><strong>Current Analyst:</strong> {selectedExhibit?.analyst_profile?.full_name}</p>
              <p className="text-sm"><strong>Device:</strong> {selectedExhibit?.device_name}</p>
              <p className="text-sm"><strong>Case:</strong> {selectedExhibit?.cases?.case_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select New Analyst</label>
              <Select 
                onValueChange={(analystId) => {
                  const dialogElement = document.querySelector('[data-reassign-dialog]') as HTMLElement;
                  if (dialogElement) {
                    dialogElement.setAttribute('data-new-analyst', analystId);
                  }
                }}
              >
                <SelectTrigger data-reassign-dialog>
                  <SelectValue placeholder="Select new analyst" />
                </SelectTrigger>
                <SelectContent>
                  {analysts
                    .filter(analyst => analyst.id !== selectedExhibit?.assigned_analyst)
                    .map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      {analyst.full_name} ({analyst.badge_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReassignDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const dialogElement = document.querySelector('[data-reassign-dialog]') as HTMLElement;
                  const newAnalystId = dialogElement?.getAttribute('data-new-analyst');
                  if (newAnalystId && selectedExhibit) {
                    assignExhibit(selectedExhibit.id, newAnalystId, true);
                  }
                }}
              >
                Reassign Exhibit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};