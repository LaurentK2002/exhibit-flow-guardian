import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Printer } from "lucide-react";
import { PrintableBarcodeLabels } from "./PrintableBarcodeLabels";
import { formatExhibitNumber } from "@/lib/exhibitNumber";

interface Case {
  id: string;
  lab_number: string;
  case_number: string;
  title: string;
}

interface Exhibit {
  id: string;
  exhibit_number: string;
  device_name: string;
  exhibit_type: string;
  case_id: string;
  cases: {
    lab_number: string;
    case_number: string;
  };
}

interface GenerateBarcodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateBarcodesDialog({ open, onOpenChange }: GenerateBarcodesDialogProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCases();
    }
  }, [open]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, lab_number, case_number, title')
        .order('lab_number', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load case files');
    }
  };

  const fetchExhibitsForCase = async (caseId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exhibits')
        .select(`
          id,
          exhibit_number,
          device_name,
          exhibit_type,
          case_id,
          cases!inner (
            lab_number,
            case_number
          )
        `)
        .eq('case_id', caseId)
        .order('exhibit_number');

      if (error) throw error;
      
      const normalized = (data || []).map((e, idx, arr) => ({
        ...e,
        exhibit_number: formatExhibitNumber(e.cases?.lab_number || e.cases?.case_number, idx, arr.length),
      }));
      setExhibits(normalized);
      
      if (!data || data.length === 0) {
        toast.info('No exhibits found for this case file');
      } else {
        toast.success(`Found ${data.length} exhibit${data.length > 1 ? 's' : ''} for this case`);
      }
    } catch (error) {
      console.error('Error fetching exhibits:', error);
      toast.error('Failed to load exhibits');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    setExhibits([]);
    fetchExhibitsForCase(caseId);
  };

  const handleGenerateLabels = () => {
    if (exhibits.length === 0) {
      toast.error('No exhibits to generate labels for');
      return;
    }
    setShowPrintView(true);
  };

  if (showPrintView) {
    return (
      <PrintableBarcodeLabels 
        exhibits={exhibits} 
        onClose={() => {
          setShowPrintView(false);
          onOpenChange(false);
        }} 
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Barcode Labels</DialogTitle>
          <DialogDescription>
            Select a case file to automatically generate barcode labels for all exhibits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select Case File (Lab Number)
            </label>
            <Select value={selectedCaseId} onValueChange={handleCaseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a case file..." />
              </SelectTrigger>
              <SelectContent>
                {cases.map((caseFile) => (
                  <SelectItem key={caseFile.id} value={caseFile.id}>
                    {caseFile.lab_number} - {caseFile.case_number} ({caseFile.title})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading exhibits...</span>
            </div>
          )}

          {!loading && exhibits.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-medium text-foreground mb-2">
                  Found {exhibits.length} exhibit{exhibits.length > 1 ? 's' : ''} for this case:
                </p>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {exhibits.map((exhibit) => (
                    <li key={exhibit.id} className="text-sm text-muted-foreground">
                      • {exhibit.exhibit_number} - {exhibit.device_name} ({exhibit.exhibit_type})
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={handleGenerateLabels} 
                className="w-full"
                size="lg"
              >
                <Printer className="h-4 w-4 mr-2" />
                Generate Printable Labels ({exhibits.length} labels)
              </Button>
            </div>
          )}

          {!loading && selectedCaseId && exhibits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No exhibits registered for this case file
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
