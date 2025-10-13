import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CaseApprovalActionsProps {
  caseId: string;
  approvalId: string;
  approvalType: string;
  currentStatus: string;
  onApprovalComplete?: () => void;
}

export const CaseApprovalActions = ({
  caseId,
  approvalId,
  approvalType,
  currentStatus,
  onApprovalComplete,
}: CaseApprovalActionsProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDialog = (selectedAction: 'approve' | 'reject' | 'revision') => {
    setAction(selectedAction);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!action || !user) return;

    setIsSubmitting(true);

    try {
      // Update approval record
      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested';
      
      const { error: approvalError } = await supabase
        .from('case_approvals')
        .update({
          approval_status: newStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          comments,
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // Update case status if approved
      if (action === 'approve') {
        let newCaseStatus: 'report_approved' | 'evidence_returned' | 'closed' | 'archived' = currentStatus as any;
        
        switch (approvalType) {
          case 'report_submission':
            newCaseStatus = 'report_approved';
            break;
          case 'report_approval':
            newCaseStatus = 'evidence_returned';
            break;
          case 'evidence_return':
            newCaseStatus = 'closed';
            break;
          case 'final_closure':
            newCaseStatus = 'archived';
            break;
        }

        const { error: caseError } = await supabase
          .from('cases')
          .update({ status: newCaseStatus as any })
          .eq('id', caseId);

        if (caseError) throw caseError;
      }

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: caseId,
        user_id: user.id,
        activity_type: `approval_${action}`,
        description: `${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Requested revision for'} ${approvalType.replace(/_/g, ' ')}`,
        metadata: { approval_id: approvalId, comments },
      });

      toast({
        title: action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Revision Requested',
        description: `${approvalType.replace(/_/g, ' ')} has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back for revision'}.`,
      });

      setIsDialogOpen(false);
      setComments('');
      onApprovalComplete?.();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to process approval. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDialogContent = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Request',
          description: `Are you sure you want to approve this ${approvalType.replace(/_/g, ' ')}?`,
          icon: <CheckCircle className="h-6 w-6 text-success" />,
        };
      case 'reject':
        return {
          title: 'Reject Request',
          description: `Are you sure you want to reject this ${approvalType.replace(/_/g, ' ')}? Please provide a reason.`,
          icon: <XCircle className="h-6 w-6 text-destructive" />,
        };
      case 'revision':
        return {
          title: 'Request Revision',
          description: `Please specify what needs to be revised for this ${approvalType.replace(/_/g, ' ')}.`,
          icon: <AlertCircle className="h-6 w-6 text-warning" />,
        };
      default:
        return { title: '', description: '', icon: null };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => openDialog('approve')}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openDialog('revision')}
          className="gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Request Revision
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => openDialog('reject')}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {dialogContent.icon}
              <DialogTitle>{dialogContent.title}</DialogTitle>
            </div>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comments {(action === 'reject' || action === 'revision') && <span className="text-destructive">*</span>}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Add optional comments...'
                    : action === 'reject'
                    ? 'Explain why this is being rejected...'
                    : 'Specify what needs to be revised...'
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || ((action === 'reject' || action === 'revision') && !comments.trim())}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Request Revision'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
