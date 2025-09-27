import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PrintableExhibitReceipt } from "./PrintableExhibitReceipt";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Printer, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Exhibit = Database['public']['Tables']['exhibits']['Row'] & {
  cases?: {
    case_number: string;
    title: string;
    priority: Database['public']['Enums']['case_priority'];
    incident_date: string;
    location: string;
    lab_number: string;
  } | null;
  received_profile?: {
    full_name: string;
    badge_number: string;
    department: string;
  } | null;
};

interface ExhibitPrintDialogProps {
  exhibitId: string;
  exhibitNumber: string;
  trigger?: React.ReactNode;
}

export const ExhibitPrintDialog = ({ exhibitId, exhibitNumber, trigger }: ExhibitPrintDialogProps) => {
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchExhibitDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exhibits')
        .select(`
          *,
          cases:case_id (
            case_number,
            title,
            priority,
            incident_date,
            location,
            lab_number
          ),
          received_profile:received_by (
            full_name,
            badge_number,
            department
          )
        `)
        .eq('id', exhibitId)
        .single();

      if (error) throw error;
      setExhibit(data as unknown as Exhibit);
    } catch (error) {
      console.error('Error fetching exhibit details:', error);
      toast({
        title: "Error",
        description: "Failed to load exhibit details for printing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printRef.current) {
      const printContent = printRef.current.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Exhibit Receipt - ${exhibitNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; line-height: 1.4; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
              .text-2xl { font-size: 1.5rem; }
              .text-xl { font-size: 1.25rem; }
              .text-lg { font-size: 1.125rem; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .font-mono { font-family: monospace; }
              .text-center { text-align: center; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-8 { margin-bottom: 2rem; }
              .pb-2 { padding-bottom: 0.5rem; }
              .pb-6 { padding-bottom: 1.5rem; }
              .p-4 { padding: 1rem; }
              .pt-4 { padding-top: 1rem; }
              .border-b { border-bottom: 1px solid #000; }
              .border-b-2 { border-bottom: 2px solid #000; }
              .border-t { border-top: 1px solid #ccc; }
              .border { border: 1px solid #999; }
              .border-black { border-color: #000; }
              .border-gray-300 { border-color: #d1d5db; }
              .border-gray-400 { border-color: #9ca3af; }
              .bg-gray-50 { background-color: #f9fafb; }
              .text-gray-500 { color: #6b7280; }
              .text-gray-600 { color: #4b5563; }
              .text-black { color: #000; }
              .bg-white { background-color: #fff; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .gap-8 { gap: 2rem; }
              .gap-12 { gap: 3rem; }
              .space-y-3 > * + * { margin-top: 0.75rem; }
              .flex { display: flex; }
              .w-32 { width: 8rem; }
              .h-16 { height: 4rem; }
              .max-w-4xl { max-width: 56rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .leading-relaxed { line-height: 1.625; }
              .capitalize { text-transform: capitalize; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
      toast({
        title: "Print Ready",
        description: "Exhibit receipt has been sent to printer.",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !exhibit) {
      fetchExhibitDetails();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" title="Print Receipt">
            <Printer className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exhibit Receipt - {exhibitNumber}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading exhibit details...</div>
          </div>
        ) : exhibit ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 no-print">
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
            </div>
            
            <PrintableExhibitReceipt ref={printRef} exhibit={exhibit} />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load exhibit details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};