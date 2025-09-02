import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type CaseStatus = "open" | "under_investigation" | "pending_review" | "closed" | "archived";

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