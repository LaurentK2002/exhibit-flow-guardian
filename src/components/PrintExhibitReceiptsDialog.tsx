import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Printer, X } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
type Exhibit = Database['public']['Tables']['exhibits']['Row'] & {
  cases?: {
    case_number: string;
    ir_number: string;
    title: string;
    priority: Database['public']['Enums']['case_priority'];
    incident_date: string;
    location: string;
    lab_number: string;
    status: string;
    description: string;
    victim_name: string;
    suspect_name: string;
    case_notes: string;
  } | null;
  received_profile?: {
    full_name: string;
    badge_number: string;
    department: string;
  } | null;
};

interface Case {
  id: string;
  lab_number: string;
  case_number: string;
  title: string;
}

interface PrintExhibitReceiptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const exhibitTypeMap: Record<Database['public']['Enums']['exhibit_type'], string> = {
  mobile_device: "Mobile Device",
  computer: "Computer",
  storage_media: "Storage Media", 
  network_device: "Network Device",
  other: "Other"
};

const priorityMap: Record<Database['public']['Enums']['case_priority'], string> = {
  low: "Low",
  medium: "Medium", 
  high: "High",
  critical: "Critical"
};

export function PrintExhibitReceiptsDialog({ open, onOpenChange }: PrintExhibitReceiptsDialogProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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
          *,
          cases!inner (
            case_number,
            ir_number,
            title,
            priority,
            incident_date,
            location,
            lab_number,
            status,
            description,
            victim_name,
            suspect_name,
            case_notes
          )
        `)
        .eq('case_id', caseId)
        .order('exhibit_number');

      if (error) throw error;
      
      // Fetch received profiles separately
      const exhibitsWithProfiles = await Promise.all((data || []).map(async (exhibit) => {
        if (exhibit.received_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, badge_number, department')
            .eq('id', exhibit.received_by)
            .single();
          
          return { ...exhibit, received_profile: profile || undefined };
        }
        return { ...exhibit, received_profile: undefined };
      }));
      
      setExhibits(exhibitsWithProfiles as Exhibit[]);
      
      if (!exhibitsWithProfiles || exhibitsWithProfiles.length === 0) {
        toast.info('No exhibits found for this case file');
      } else {
        toast.success(`Found ${exhibitsWithProfiles.length} exhibit${exhibitsWithProfiles.length > 1 ? 's' : ''} for this case`);
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

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showPrintView && exhibits.length > 0) {
    const firstExhibit = exhibits[0];
    const caseInfo = firstExhibit.cases;
    const receivedProfile = firstExhibit.received_profile;
    
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        <div className="no-print sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Case Exhibit Receipt</h2>
            <p className="text-sm text-muted-foreground">
              One receipt for {exhibits.length} exhibit{exhibits.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button 
              onClick={() => {
                setShowPrintView(false);
                onOpenChange(false);
              }} 
              variant="outline" 
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        <div ref={printRef} className="p-8">
          <div className="bg-white text-black p-8 max-w-5xl mx-auto print:p-6">
            {/* Official Header */}
            <div className="text-center border-b-2 border-black pb-6 mb-6">
              <h1 className="text-2xl font-bold mb-2">TANZANIA POLICE FORCE</h1>
              <h2 className="text-xl font-semibold mb-1">CYBER CRIMES UNIT</h2>
              <h3 className="text-lg font-medium">DIGITAL EXHIBITS RECEIPT</h3>
              <p className="text-sm mt-2 text-gray-600">Official Documentation of Digital Evidence Reception</p>
            </div>

            {/* Case Information */}
            <div className="mb-6">
              <h4 className="font-bold text-base mb-3 bg-gray-200 p-2">CASE INFORMATION</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-semibold">Lab Number:</span> {caseInfo?.lab_number || 'N/A'}</p>
                  <p><span className="font-semibold">IR Number:</span> {caseInfo?.ir_number || 'N/A'}</p>
                  <p><span className="font-semibold">Case Number:</span> {caseInfo?.case_number || 'N/A'}</p>
                  <p><span className="font-semibold">Case Title:</span> {caseInfo?.title || 'N/A'}</p>
                  <p><span className="font-semibold">Priority:</span> {caseInfo?.priority ? priorityMap[caseInfo.priority] : 'N/A'}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Status:</span> {caseInfo?.status ? caseInfo.status.toUpperCase() : 'N/A'}</p>
                  <p><span className="font-semibold">Location:</span> {caseInfo?.location || 'N/A'}</p>
                  <p><span className="font-semibold">Incident Date:</span> {caseInfo?.incident_date ? formatDate(caseInfo.incident_date) : 'N/A'}</p>
                </div>
              </div>
              {caseInfo?.description && (
                <div className="mt-2">
                  <p className="font-semibold text-sm">Case Description:</p>
                  <p className="text-sm text-gray-700">{caseInfo.description}</p>
                </div>
              )}
              {(caseInfo?.victim_name || caseInfo?.suspect_name) && (
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  {caseInfo?.victim_name && (
                    <p><span className="font-semibold">Victim Name:</span> {caseInfo.victim_name}</p>
                  )}
                  {caseInfo?.suspect_name && (
                    <p><span className="font-semibold">Suspect Name:</span> {caseInfo.suspect_name}</p>
                  )}
                </div>
              )}
            </div>

            {/* Reception Details */}
            <div className="mb-6">
              <h4 className="font-bold text-base mb-3 bg-gray-200 p-2">RECEPTION DETAILS</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-semibold">Received Date:</span> {formatDate(firstExhibit.received_date)}</p>
                  <p><span className="font-semibold">Received By:</span> {receivedProfile?.full_name || 'System User'}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Badge Number:</span> {receivedProfile?.badge_number || 'N/A'}</p>
                  <p><span className="font-semibold">Department:</span> {receivedProfile?.department || 'Cyber Crimes Unit'}</p>
                </div>
              </div>
            </div>

            {/* All Exhibits Table */}
            <div className="mb-6">
              <h4 className="font-bold text-base mb-3 bg-gray-200 p-2">EXHIBITS RECEIVED ({exhibits.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 p-2 text-left">#</th>
                      <th className="border border-gray-400 p-2 text-left">Exhibit Number</th>
                      <th className="border border-gray-400 p-2 text-left">Type</th>
                      <th className="border border-gray-400 p-2 text-left">Device Name</th>
                      <th className="border border-gray-400 p-2 text-left">Brand/Model</th>
                      <th className="border border-gray-400 p-2 text-left">Serial/IMEI</th>
                      <th className="border border-gray-400 p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exhibits.map((exhibit, index) => (
                      <tr key={exhibit.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 p-2">{index + 1}</td>
                        <td className="border border-gray-400 p-2 font-mono">{exhibit.exhibit_number}</td>
                        <td className="border border-gray-400 p-2">{exhibitTypeMap[exhibit.exhibit_type]}</td>
                        <td className="border border-gray-400 p-2">{exhibit.device_name}</td>
                        <td className="border border-gray-400 p-2">
                          {exhibit.brand && exhibit.model ? `${exhibit.brand} ${exhibit.model}` : exhibit.brand || exhibit.model || 'N/A'}
                        </td>
                        <td className="border border-gray-400 p-2 font-mono text-xs">
                          {exhibit.serial_number || exhibit.imei || 'N/A'}
                        </td>
                        <td className="border border-gray-400 p-2 capitalize">{exhibit.status.replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Exhibit Information */}
            <div className="mb-6">
              <h4 className="font-bold text-base mb-3 bg-gray-200 p-2">DETAILED EXHIBIT INFORMATION</h4>
              <div className="space-y-3">
                {exhibits.map((exhibit, index) => (
                  <div key={exhibit.id} className="border border-gray-300 p-3 rounded text-xs">
                    <p className="font-semibold mb-2">Exhibit {index + 1}: {exhibit.exhibit_number}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="font-semibold">Device:</span> {exhibit.device_name}</div>
                      <div><span className="font-semibold">Type:</span> {exhibitTypeMap[exhibit.exhibit_type]}</div>
                      <div><span className="font-semibold">Brand:</span> {exhibit.brand || 'N/A'}</div>
                      <div><span className="font-semibold">Model:</span> {exhibit.model || 'N/A'}</div>
                      <div><span className="font-semibold">Serial:</span> {exhibit.serial_number || 'N/A'}</div>
                      {exhibit.imei && <div><span className="font-semibold">IMEI:</span> {exhibit.imei}</div>}
                      {exhibit.mac_address && <div><span className="font-semibold">MAC:</span> {exhibit.mac_address}</div>}
                      <div><span className="font-semibold">Storage:</span> {exhibit.storage_location || 'Standard Evidence Room'}</div>
                    </div>
                    {exhibit.description && (
                      <div className="mt-2">
                        <span className="font-semibold">Description:</span> {exhibit.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Declaration */}
            <div className="mb-6 p-3 border border-gray-400 bg-gray-50 text-xs">
              <h4 className="font-bold mb-2">LEGAL DECLARATION</h4>
              <p className="leading-relaxed">
                This document serves as official proof that the above-mentioned {exhibits.length} digital exhibit{exhibits.length > 1 ? 's have' : ' has'} been 
                received by the Tanzania Police Force Cyber Crimes Unit in accordance with established 
                evidence handling procedures. All exhibits have been properly catalogued and secured 
                following chain of custody protocols. This receipt is valid for legal proceedings and court presentations.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="border-b border-black mb-2 h-12"></div>
                <p className="text-xs text-center">
                  <strong>Receiving Officer</strong><br />
                  {receivedProfile?.full_name || 'System User'}<br />
                  Badge: {receivedProfile?.badge_number || 'N/A'}
                </p>
              </div>
              <div>
                <div className="border-b border-black mb-2 h-12"></div>
                <p className="text-xs text-center">
                  <strong>Supervisor</strong><br />
                  Name: ___________________<br />
                  Badge: __________________
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-3">
              <p>Generated: {new Date().toLocaleString()}</p>
              <p>Tanzania Police Force - Cyber Crimes Unit | Evidence Management System</p>
              <p className="font-semibold mt-1">Total Exhibits Received: {exhibits.length}</p>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print Exhibit Receipts</DialogTitle>
          <DialogDescription>
            Select a case file by lab number to print comprehensive receipts for all exhibits
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
                    {caseFile.lab_number === caseFile.case_number ? `${caseFile.lab_number} (${caseFile.title})` : `${caseFile.lab_number} - ${caseFile.case_number} (${caseFile.title})`}
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
                      • {exhibit.exhibit_number} - {exhibit.device_name} ({exhibitTypeMap[exhibit.exhibit_type]})
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={() => setShowPrintView(true)} 
                className="w-full"
                size="lg"
              >
                <Printer className="h-4 w-4 mr-2" />
                Generate Receipt (All {exhibits.length} Exhibit{exhibits.length > 1 ? 's' : ''})
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
