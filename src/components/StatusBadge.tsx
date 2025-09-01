import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ExhibitStatus = "received" | "in_analysis" | "analysis_complete" | "released" | "destroyed" | "archived";

interface StatusBadgeProps {
  status: ExhibitStatus;
  className?: string;
}

const statusConfig = {
  received: { 
    label: "Received", 
    className: "bg-status-received text-white" 
  },
  in_analysis: { 
    label: "In Analysis", 
    className: "bg-status-analysis text-white" 
  },
  analysis_complete: { 
    label: "Analysis Complete", 
    className: "bg-status-complete text-white" 
  },
  released: { 
    label: "Released", 
    className: "bg-status-released text-white" 
  },
  destroyed: { 
    label: "Destroyed", 
    className: "bg-destructive text-white" 
  },
  archived: { 
    label: "Archived", 
    className: "bg-muted text-muted-foreground" 
  }
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
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