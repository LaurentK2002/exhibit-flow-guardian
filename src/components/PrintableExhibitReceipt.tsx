import { forwardRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    description: string;
    victim_name: string;
    suspect_name: string;
    status: Database['public']['Enums']['case_status'];
    region: string;
    district: string;
  } | null;
  received_profile?: {
    full_name: string;
    badge_number: string;
    department: string;
  } | null;
};

interface PrintableExhibitReceiptProps {
  exhibit: Exhibit;
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

const statusMap: Record<Database['public']['Enums']['case_status'], string> = {
  open: "Open",
  under_investigation: "Under Investigation",
  in_progress: "In Analysis",
  pending_review: "Pending Review",
  closed: "Closed",
  archived: "Archived",
  analysis_complete: "Analysis Complete",
  report_submitted: "Report Submitted",
  report_approved: "Report Approved",
  evidence_returned: "Evidence Returned"
};

export const PrintableExhibitReceipt = forwardRef<HTMLDivElement, PrintableExhibitReceiptProps>(
  ({ exhibit }, ref) => {
    const formatDate = (dateString: string) => {
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

    const chainOfCustodyEvents = Array.isArray(exhibit.chain_of_custody) 
      ? exhibit.chain_of_custody as any[] 
      : [];

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto print:p-6">
        {/* Official Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">TANZANIA POLICE FORCE</h1>
          <h2 className="text-xl font-semibold mb-1">CYBER CRIMES UNIT</h2>
          <h3 className="text-lg font-medium">DIGITAL EXHIBIT RECEIPT</h3>
          <p className="text-sm mt-2 text-gray-600">Official Documentation of Digital Evidence Reception</p>
        </div>

        {/* 1. CASE INFORMATION */}
        <div className="mb-8">
          <h4 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">1. CASE INFORMATION</h4>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-40">Lab Number:</span>
                <span className="font-mono">{exhibit.cases?.lab_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">IR Number:</span>
                <span className="font-mono">{exhibit.cases?.ir_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Date:</span>
                <span>{exhibit.cases?.incident_date ? new Date(exhibit.cases.incident_date).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-40">Crime:</span>
                <span>{exhibit.cases?.title || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Region:</span>
                <span>{exhibit.cases?.region || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">District:</span>
                <span>{exhibit.cases?.district || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Station:</span>
                <span>{exhibit.cases?.location || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RECEPTION DETAILS */}
        <div className="mb-8">
          <h4 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">2. RECEPTION DETAILS</h4>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-40">Received Date:</span>
                <span>{new Date(exhibit.received_date).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Status:</span>
                <span className="capitalize">{exhibit.status.replace('_', ' ')}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Storage Location:</span>
                <span>{exhibit.storage_location || 'Standard Evidence Room'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-40">Received By:</span>
                <span>{exhibit.received_profile?.full_name || 'System User'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Force Number:</span>
                <span>{exhibit.received_profile?.badge_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Department:</span>
                <span>{exhibit.received_profile?.department || 'Cyber Crimes Unit'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DETAILED INFORMATION ABOUT RECEIVED EXHIBIT(S) */}
        <div className="mb-8">
          <h4 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">3. DETAILED INFORMATION ABOUT RECEIVED EXHIBIT(S)</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex">
                  <span className="font-semibold w-40">Exhibit Number:</span>
                  <span className="font-mono">{exhibit.exhibit_number}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-40">Exhibit Type:</span>
                  <span>{exhibitTypeMap[exhibit.exhibit_type]}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-40">Device Name:</span>
                  <span>{exhibit.device_name}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-40">Brand:</span>
                  <span>{exhibit.brand || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-40">Model:</span>
                  <span>{exhibit.model || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="font-semibold w-40">Serial Number:</span>
                  <span className="font-mono text-xs">{exhibit.serial_number || 'N/A'}</span>
                </div>
                {exhibit.imei && (
                  <div className="flex">
                    <span className="font-semibold w-40">IMEI:</span>
                    <span className="font-mono text-xs">{exhibit.imei}</span>
                  </div>
                )}
                {exhibit.mac_address && (
                  <div className="flex">
                    <span className="font-semibold w-40">MAC Address:</span>
                    <span className="font-mono text-xs">{exhibit.mac_address}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-semibold w-40">Storage Location:</span>
                  <span>{exhibit.storage_location || 'Standard Evidence Room'}</span>
                </div>
              </div>
            </div>
            
            {exhibit.description && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Exhibit Description:</p>
                <p className="text-sm leading-relaxed p-3 bg-gray-50 border border-gray-300">{exhibit.description}</p>
              </div>
            )}
            
            {exhibit.analysis_notes && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Analysis Notes:</p>
                <p className="text-sm leading-relaxed p-3 bg-gray-50 border border-gray-300">{exhibit.analysis_notes}</p>
              </div>
            )}

            {exhibit.cases?.description && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Case Description:</p>
                <p className="text-sm leading-relaxed p-3 bg-gray-50 border border-gray-300">{exhibit.cases.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chain of Custody */}
        {chainOfCustodyEvents.length > 0 && (
          <div className="mb-8">
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">CHAIN OF CUSTODY TIMELINE</h4>
            <div className="border border-gray-300 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left border-b border-gray-300">#</th>
                    <th className="p-2 text-left border-b border-gray-300">Date/Time</th>
                    <th className="p-2 text-left border-b border-gray-300">Event Type</th>
                    <th className="p-2 text-left border-b border-gray-300">Officer</th>
                    <th className="p-2 text-left border-b border-gray-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {chainOfCustodyEvents.map((event: any, index: number) => (
                    <tr key={index} className="border-b border-gray-200 last:border-b-0">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 text-xs">{formatDate(event.timestamp)}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                          {event.event_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="text-xs">
                          <p>{event.officer_name || 'N/A'}</p>
                          <p className="text-gray-600">Badge: {event.officer_badge || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        <p>{event.description || 'N/A'}</p>
                        {event.location && <p className="text-gray-600 mt-1">📍 {event.location}</p>}
                        {event.notes && <p className="text-gray-600 mt-1 italic">Note: {event.notes}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. LEGAL DECLARATION */}
        <div className="mb-8 p-4 border-2 border-black bg-gray-50">
          <h4 className="font-bold text-lg mb-3">4. LEGAL DECLARATION</h4>
          <p className="text-sm leading-relaxed mb-4">
            This document serves as official proof that the above-mentioned digital exhibit has been 
            received by the Tanzania Police Force Cyber Crimes Unit in accordance with established 
            evidence handling procedures. The exhibit has been properly catalogued and secured 
            following chain of custody protocols.
          </p>
          <p className="text-sm font-semibold">
            This receipt is valid for legal proceedings and court presentations.
          </p>
        </div>

        {/* 5. SIGNATURES SECTION */}
        <div className="mb-8">
          <h4 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">5. INFORMATION AND SIGNATURES</h4>
          <div className="grid grid-cols-2 gap-12">
            {/* Delivering Officer */}
            <div className="border border-gray-400 p-4">
              <p className="font-bold text-center mb-4">DELIVERING OFFICER</p>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex">
                  <span className="font-semibold w-32">Name:</span>
                  <span>_______________________</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Force Number:</span>
                  <span>_______________________</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Designation:</span>
                  <span>_______________________</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Station:</span>
                  <span>_______________________</span>
                </div>
              </div>
              <div className="border-b-2 border-black mb-2 h-16"></div>
              <p className="text-xs text-center">
                <strong>Signature & Date</strong>
              </p>
            </div>

            {/* Receiving Officer */}
            <div className="border border-gray-400 p-4">
              <p className="font-bold text-center mb-4">RECEIVING OFFICER</p>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex">
                  <span className="font-semibold w-32">Name:</span>
                  <span>{exhibit.received_profile?.full_name || 'System User'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Force Number:</span>
                  <span>{exhibit.received_profile?.badge_number || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Designation:</span>
                  <span>Exhibit Officer</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Department:</span>
                  <span>{exhibit.received_profile?.department || 'Cyber Crimes Unit'}</span>
                </div>
              </div>
              <div className="border-b-2 border-black mb-2 h-16"></div>
              <p className="text-xs text-center">
                <strong>Signature & Date:</strong> {new Date(exhibit.received_date).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
          <p>Generated on: {new Date().toLocaleString()}</p>
          <p>Tanzania Police Force - Cyber Crimes Unit | Evidence Management System</p>
          <p>This document is computer-generated and does not require a signature unless specified by law.</p>
        </div>
      </div>
    );
  }
);

PrintableExhibitReceipt.displayName = 'PrintableExhibitReceipt';