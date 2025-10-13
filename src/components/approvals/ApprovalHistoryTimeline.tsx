import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApprovalHistory {
  id: string;
  approval_type: string;
  approval_status: string;
  comments: string | null;
  created_at: string;
  approved_at: string | null;
  submitter: {
    full_name: string;
    role: string;
  };
  approver?: {
    full_name: string;
    role: string;
  };
}

interface ApprovalHistoryTimelineProps {
  caseId: string;
}

export const ApprovalHistoryTimeline = ({ caseId }: ApprovalHistoryTimelineProps) => {
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('case_approvals')
          .select(`
            *,
            submitter:profiles!case_approvals_submitted_by_fkey(full_name, role),
            approver:profiles!case_approvals_approved_by_fkey(full_name, role)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data as unknown as ApprovalHistory[]);
      } catch (error) {
        console.error('Error fetching approval history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`approval-history-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_approvals',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'revision_requested':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      case 'revision_requested':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Revision Requested</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getApprovalTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No approval history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-background border-2 border-border">
                  {getStatusIcon(item.approval_status)}
                </div>
                {index < history.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border my-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{getApprovalTypeLabel(item.approval_type)}</h4>
                    <p className="text-sm text-muted-foreground">
                      Submitted by {item.submitter.full_name}
                    </p>
                  </div>
                  {getStatusBadge(item.approval_status)}
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    <span className="text-xs">
                      ({format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')})
                    </span>
                  </div>

                  {item.approved_at && item.approver && (
                    <div className="text-muted-foreground">
                      {item.approval_status === 'approved' ? 'Approved' : 
                       item.approval_status === 'rejected' ? 'Rejected' : 'Revision requested'} by{' '}
                      <span className="font-medium">{item.approver.full_name}</span>
                      {' '}
                      {formatDistanceToNow(new Date(item.approved_at), { addSuffix: true })}
                    </div>
                  )}

                  {item.comments && (
                    <div className="p-3 bg-muted rounded-lg mt-2">
                      <p className="text-sm">{item.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
