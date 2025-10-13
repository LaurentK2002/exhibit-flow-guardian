import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CasePhaseOutPanelProps {
  caseId: string;
  caseStatus: string;
  onStatusChange?: () => void;
}

export const CasePhaseOutPanel = ({ caseId, caseStatus, onStatusChange }: CasePhaseOutPanelProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>('');
  const [approvalType, setApprovalType] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvailableTransitions = () => {
    const transitions: { status: string; label: string; approvalType: string; description: string }[] = [];

    switch (caseStatus) {
      case 'in_progress':
      case 'under_review':
        transitions.push({
          status: 'analysis_complete',
          label: 'Mark Analysis Complete',
          approvalType: 'report_submission',
          description: 'Mark this case as analysis complete and prepare for report submission',
        });
        break;
      case 'analysis_complete':
        transitions.push({
          status: 'report_submitted',
          label: 'Submit Final Report',
          approvalType: 'report_submission',
          description: 'Submit the final analysis report for review and approval',
        });
        break;
      case 'report_approved':
        transitions.push({
          status: 'evidence_returned',
          label: 'Confirm Evidence Return',
          approvalType: 'evidence_return',
          description: 'Confirm that all evidence has been returned to proper custody',
        });
        break;
      case 'evidence_returned':
        transitions.push({
          status: 'closed',
          label: 'Close Case',
          approvalType: 'final_closure',
          description: 'Close this case and prepare for archival',
        });
        break;
      case 'closed':
        transitions.push({
          status: 'archived',
          label: 'Archive Case',
          approvalType: 'final_closure',
          description: 'Archive this case for long-term storage',
        });
        break;
    }

    return transitions;
  };

  const openTransitionDialog = (status: string, type: string) => {
    setNextStatus(status);
    setApprovalType(type);
    setIsDialogOpen(true);
  };

  const handleSubmitTransition = async () => {
    if (!user || !nextStatus) return;

    setIsSubmitting(true);

    try {
      // Create approval request if needed
      if (approvalType) {
        const { error: approvalError } = await supabase.from('case_approvals').insert({
          case_id: caseId,
          approval_type: approvalType as any,
          approval_status: 'pending',
          submitted_by: user.id,
          comments,
        });

        if (approvalError) throw approvalError;
      }

      // Update case status
      const { error: caseError } = await supabase
        .from('cases')
        .update({ status: nextStatus as any })
        .eq('id', caseId);

      if (caseError) throw caseError;

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: caseId,
        user_id: user.id,
        activity_type: 'status_change',
        description: `Case status changed to ${nextStatus.replace(/_/g, ' ')}`,
        metadata: { previous_status: caseStatus, new_status: nextStatus, comments },
      });

      toast({
        title: 'Status Updated',
        description: approvalType
          ? 'Case status updated and approval request submitted.'
          : 'Case status updated successfully.',
      });

      setIsDialogOpen(false);
      setComments('');
      onStatusChange?.();
    } catch (error) {
      console.error('Error updating case status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update case status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const transitions = getAvailableTransitions();

  if (transitions.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Case Phase-Out Options</CardTitle>
          <CardDescription>Move this case to the next phase in the workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {transitions.map((transition) => (
            <div
              key={transition.status}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="capitalize">
                    {caseStatus.replace(/_/g, ' ')}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className="capitalize bg-primary/10 text-primary border-primary/20">
                    {transition.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{transition.description}</p>
              </div>
              <Button onClick={() => openTransitionDialog(transition.status, transition.approvalType)} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                {transition.label}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Transition</DialogTitle>
            <DialogDescription>
              {approvalType
                ? 'This will submit an approval request and update the case status.'
                : 'This will update the case status.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">
                  {caseStatus.replace(/_/g, ' ')}
                </Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="capitalize bg-primary/10 text-primary border-primary/20">
                  {nextStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Comments {approvalType && <span className="text-muted-foreground">(Optional)</span>}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any relevant notes or comments..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTransition} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
