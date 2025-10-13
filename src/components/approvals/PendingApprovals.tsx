import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaseApprovalActions } from './CaseApprovalActions';
import { Loader2, FileText, CheckCircle2, Package, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PendingApproval {
  id: string;
  case_id: string;
  approval_type: string;
  approval_status: string;
  submitted_by: string;
  comments: string | null;
  created_at: string;
  case: {
    case_number: string;
    title: string;
    lab_number: string;
    status: string;
  };
  submitter: {
    full_name: string;
    role: string;
  };
}

export const PendingApprovals = () => {
  const { profile } = useAuth();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('case_approvals')
        .select(`
          *,
          case:cases(case_number, title, lab_number, status),
          submitter:profiles!case_approvals_submitted_by_fkey(full_name, role)
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data as unknown as PendingApproval[]);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pending-approvals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_approvals',
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getApprovalTypeIcon = (type: string) => {
    switch (type) {
      case 'report_submission':
        return <FileText className="h-5 w-5" />;
      case 'report_approval':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'evidence_return':
        return <Package className="h-5 w-5" />;
      case 'final_closure':
        return <Archive className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getApprovalTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending approvals at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <Card key={approval.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getApprovalTypeIcon(approval.approval_type)}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {approval.case.title}
                  </CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{approval.case.case_number}</Badge>
                    {approval.case.lab_number && (
                      <Badge variant="outline">{approval.case.lab_number}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge className="bg-warning/10 text-warning border-warning/20">
                {getApprovalTypeLabel(approval.approval_type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Submitted by:</span>
                <p className="font-medium">{approval.submitter.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {approval.submitter.role.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {approval.comments && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Comments:</p>
                <p className="text-sm">{approval.comments}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <CaseApprovalActions
                caseId={approval.case_id}
                approvalId={approval.id}
                approvalType={approval.approval_type}
                currentStatus={approval.case.status}
                onApprovalComplete={fetchPendingApprovals}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
