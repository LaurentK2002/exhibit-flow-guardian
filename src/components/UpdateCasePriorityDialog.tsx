import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

type CasePriority = Database['public']['Enums']['case_priority'];

interface UpdateCasePriorityDialogProps {
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  currentPriority: CasePriority;
  userRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const UpdateCasePriorityDialog = ({
  caseId,
  caseNumber,
  caseTitle,
  currentPriority,
  userRole,
  open,
  onOpenChange,
  onUpdate
}: UpdateCasePriorityDialogProps) => {
  const [newPriority, setNewPriority] = useState<CasePriority>(currentPriority);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get available priorities based on role
  const getAvailablePriorities = (): CasePriority[] => {
    if (userRole === 'commanding_officer') {
      // CO can set any priority including critical (urgent)
      return ['low', 'medium', 'high', 'critical'];
    } else if (userRole === 'officer_commanding_unit') {
      // OCU can set up to high priority but not critical
      return ['low', 'medium', 'high'];
    }
    return ['low', 'medium']; // Default for others
  };

  const availablePriorities = getAvailablePriorities();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPriority === currentPriority) {
      toast({
        title: "No Changes",
        description: "Priority is already set to this level",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cases')
        .update({ priority: newPriority })
        .eq('id', caseId);

      if (error) throw error;

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: caseId,
        activity_type: 'priority_changed',
        description: `Case priority updated from ${currentPriority.toUpperCase()} to ${newPriority.toUpperCase()}`,
        metadata: {
          old_priority: currentPriority,
          new_priority: newPriority
        }
      });

      toast({
        title: "Priority Updated",
        description: `Case priority changed from ${currentPriority.toUpperCase()} to ${newPriority.toUpperCase()}`,
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update case priority",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority: CasePriority) => {
    const labels: Record<CasePriority, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical/Urgent'
    };
    return labels[priority] || priority;
  };

  const getPriorityDescription = (priority: CasePriority) => {
    const descriptions: Record<CasePriority, string> = {
      low: 'Normal processing time',
      medium: 'Standard attention required',
      high: 'Requires prompt attention',
      critical: 'Immediate action required - highest priority (urgent)'
    };
    return descriptions[priority] || '';
  };

  const isUpgrade = () => {
    const priorityOrder: CasePriority[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = priorityOrder.indexOf(currentPriority);
    const newIndex = priorityOrder.indexOf(newPriority);
    return newIndex > currentIndex;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Update Case Priority
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Case:</span> {caseNumber}
            </div>
            <div className="text-sm text-muted-foreground">{caseTitle}</div>
          </div>

          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground">Current Priority</Label>
            <div className="font-semibold text-lg">{getPriorityLabel(currentPriority)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-priority">New Priority</Label>
            <Select value={newPriority} onValueChange={(value) => setNewPriority(value as CasePriority)}>
              <SelectTrigger id="new-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePriorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{getPriorityLabel(priority)}</span>
                      <span className="text-xs text-muted-foreground">
                        {getPriorityDescription(priority)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newPriority !== currentPriority && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {isUpgrade() ? (
                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              ) : (
                <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5" />
              )}
              <div className="text-sm text-blue-900 dark:text-blue-100">
                This will {isUpgrade() ? 'upgrade' : 'downgrade'} the case priority from{' '}
                <span className="font-semibold">{getPriorityLabel(currentPriority)}</span> to{' '}
                <span className="font-semibold">{getPriorityLabel(newPriority)}</span>
              </div>
            </div>
          )}

          {userRole === 'officer_commanding_unit' && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
              Note: Only Commanding Officers can set cases to Critical/Urgent priority
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newPriority === currentPriority}>
              {loading ? "Updating..." : "Update Priority"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
