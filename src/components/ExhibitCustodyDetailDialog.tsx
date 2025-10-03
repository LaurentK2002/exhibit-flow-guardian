import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, User, FileText, Download, Package, UserCheck, ArrowRight } from 'lucide-react';

interface CustodyEvent {
  timestamp: string;
  event_type: string;
  description: string;
  officer_name: string;
  officer_badge: string;
  location?: string;
  notes?: string;
  previous_status?: string;
  new_status?: string;
}

interface Exhibit {
  id: string;
  exhibit_number: string;
  device_name: string;
  status: string;
  received_date: string;
  chain_of_custody: CustodyEvent[] | any;
  cases?: {
    case_number: string;
    lab_number: string;
  };
  received_profile?: {
    full_name: string;
    badge_number: string;
  };
}

interface ExhibitCustodyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exhibit: Exhibit | null;
}

export const ExhibitCustodyDetailDialog = ({ open, onOpenChange, exhibit }: ExhibitCustodyDetailDialogProps) => {
  if (!exhibit) return null;

  const custodyEvents: CustodyEvent[] = Array.isArray(exhibit.chain_of_custody) 
    ? exhibit.chain_of_custody 
    : [];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'received':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'assigned':
        return <UserCheck className="h-5 w-5 text-purple-600" />;
      case 'status_change':
        return <ArrowRight className="h-5 w-5 text-orange-600" />;
      case 'transferred':
        return <ArrowRight className="h-5 w-5 text-green-600" />;
      case 'returned':
        return <Download className="h-5 w-5 text-gray-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'received':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'status_change':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'transferred':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'returned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleDownloadCustodyReport = () => {
    let report = `CHAIN OF CUSTODY REPORT\n`;
    report += `${'='.repeat(80)}\n\n`;
    report += `EXHIBIT INFORMATION\n`;
    report += `-`.repeat(80) + `\n`;
    report += `Exhibit Number: ${exhibit.exhibit_number}\n`;
    report += `Device Name: ${exhibit.device_name}\n`;
    report += `Case Number: ${exhibit.cases?.case_number || 'N/A'}\n`;
    report += `Lab Number: ${exhibit.cases?.lab_number || 'N/A'}\n`;
    report += `Current Status: ${exhibit.status.replace('_', ' ').toUpperCase()}\n`;
    report += `Received Date: ${formatDateTime(exhibit.received_date)}\n`;
    report += `\n`;
    
    report += `CUSTODY CHAIN EVENTS (${custodyEvents.length} Total)\n`;
    report += `${'='.repeat(80)}\n\n`;
    
    custodyEvents.forEach((event, index) => {
      report += `Event #${index + 1}\n`;
      report += `-`.repeat(80) + `\n`;
      report += `Date/Time: ${formatDateTime(event.timestamp)}\n`;
      report += `Event Type: ${event.event_type.replace('_', ' ').toUpperCase()}\n`;
      report += `Officer: ${event.officer_name} (Badge: ${event.officer_badge})\n`;
      if (event.location) report += `Location: ${event.location}\n`;
      if (event.previous_status && event.new_status) {
        report += `Status Change: ${event.previous_status.replace('_', ' ')} → ${event.new_status.replace('_', ' ')}\n`;
      }
      report += `Description: ${event.description}\n`;
      if (event.notes) report += `Notes: ${event.notes}\n`;
      report += `\n`;
    });
    
    report += `\n${'='.repeat(80)}\n`;
    report += `Report Generated: ${new Date().toLocaleString()}\n`;
    report += `Tanzania Police Force - Cyber Crimes Unit\n`;
    report += `Evidence Management System\n`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custody-report-${exhibit.exhibit_number}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chain of Custody - {exhibit.exhibit_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Device Name</p>
              <p className="font-semibold">{exhibit.device_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Case Number</p>
              <p className="font-semibold font-mono">{exhibit.cases?.case_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge className="mt-1">{exhibit.status.replace('_', ' ')}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="font-semibold">{custodyEvents.length}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Custody Timeline</h3>
            <Button size="sm" variant="outline" onClick={handleDownloadCustodyReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>

          <Separator />

          <ScrollArea className="h-[500px] pr-4">
            {custodyEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No custody events recorded yet.</p>
                <p className="text-sm mt-2">Initial receipt event will be logged automatically.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {custodyEvents.map((event, index) => (
                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-muted last:border-l-0 last:pb-0">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          <Badge className={getEventBadgeColor(event.event_type)}>
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(event.timestamp)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="font-medium">{event.description}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{event.officer_name}</span>
                          <span className="text-xs">•</span>
                          <span className="font-mono text-xs">Badge: {event.officer_badge}</span>
                        </div>

                        {event.location && (
                          <p className="text-sm text-muted-foreground">
                            📍 Location: {event.location}
                          </p>
                        )}

                        {event.previous_status && event.new_status && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{event.previous_status.replace('_', ' ')}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge variant="outline">{event.new_status.replace('_', ' ')}</Badge>
                          </div>
                        )}

                        {event.notes && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                            <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                            <p>{event.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
