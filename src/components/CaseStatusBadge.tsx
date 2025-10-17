import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type CaseStatus = "open" | "under_investigation" | "pending_review" | "closed" | "archived" | "in_progress" | "analysis_complete" | "report_submitted" | "report_approved" | "evidence_returned";

interface CaseStatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

const statusConfig = {
  open: { 
    label: "Open", 
    className: "bg-case-open text-white" 
  },
  under_investigation: { 
    label: "Under Investigation", 
    className: "bg-case-investigation text-white" 
  },
  in_progress: { 
    label: "In Analysis", 
    className: "bg-blue-500 text-white" 
  },
  analysis_complete: { 
    label: "Analysis Complete", 
    className: "bg-purple-500 text-white" 
  },
  report_submitted: { 
    label: "Submitted for Review", 
    className: "bg-amber-500 text-white" 
  },
  report_approved: { 
    label: "Report Approved", 
    className: "bg-green-500 text-white" 
  },
  evidence_returned: { 
    label: "Evidence Returned", 
    className: "bg-indigo-500 text-white" 
  },
  pending_review: { 
    label: "Pending Review", 
    className: "bg-case-review text-white" 
  },
  closed: { 
    label: "Closed", 
    className: "bg-case-closed text-white" 
  },
  archived: { 
    label: "Archived", 
    className: "bg-muted text-muted-foreground" 
  }
};

export const CaseStatusBadge = ({ status, className }: CaseStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};