import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ExhibitStatus = "received" | "analysis" | "complete" | "released" | "urgent";

interface StatusBadgeProps {
  status: ExhibitStatus;
  className?: string;
}

const statusConfig = {
  received: { 
    label: "Received", 
    className: "bg-status-received text-white" 
  },
  analysis: { 
    label: "In Analysis", 
    className: "bg-status-analysis text-white" 
  },
  complete: { 
    label: "Complete", 
    className: "bg-status-complete text-white" 
  },
  released: { 
    label: "Released", 
    className: "bg-status-released text-white" 
  },
  urgent: { 
    label: "Urgent", 
    className: "bg-status-urgent text-white animate-pulse" 
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