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

        {/* Receipt Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">EXHIBIT INFORMATION</h4>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-32">Exhibit Number:</span>
                <span className="font-mono">{exhibit.exhibit_number}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Case Lab Number:</span>
                <span className="font-mono">{exhibit.cases?.lab_number || 'Pending Assignment'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Device Type:</span>
                <span>{exhibitTypeMap[exhibit.exhibit_type]}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Device Name:</span>
                <span>{exhibit.device_name}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Brand/Model:</span>
                <span>{exhibit.brand && exhibit.model ? `${exhibit.brand} ${exhibit.model}` : 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Serial Number:</span>
                <span className="font-mono">{exhibit.serial_number || 'N/A'}</span>
              </div>
              {exhibit.imei && (
                <div className="flex">
                  <span className="font-semibold w-32">IMEI:</span>
                  <span className="font-mono">{exhibit.imei}</span>
                </div>
              )}
              {exhibit.mac_address && (
                <div className="flex">
                  <span className="font-semibold w-32">MAC Address:</span>
                  <span className="font-mono">{exhibit.mac_address}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">CASE INFORMATION</h4>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-32">IR Number:</span>
                <span className="font-mono">{exhibit.cases?.ir_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Case Number:</span>
                <span className="font-mono">{exhibit.cases?.case_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Case Title:</span>
                <span>{exhibit.cases?.title || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Status:</span>
                <span>{exhibit.cases?.status ? statusMap[exhibit.cases.status] : 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Priority:</span>
                <span>{exhibit.cases?.priority ? priorityMap[exhibit.cases.priority] : 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Incident Date:</span>
                <span>{exhibit.cases?.incident_date ? formatDate(exhibit.cases.incident_date) : 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Location:</span>
                <span>{exhibit.cases?.location || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Region:</span>
                <span>{exhibit.cases?.region || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">District:</span>
                <span>{exhibit.cases?.district || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="mb-8">
          <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">RECEIPT DETAILS</h4>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-32">Received Date:</span>
                <span>{formatDate(exhibit.received_date)}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Status:</span>
                <span className="capitalize">{exhibit.status.replace('_', ' ')}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Storage Location:</span>
                <span>{exhibit.storage_location || 'Standard Evidence Room'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-semibold w-32">Received By:</span>
                <span>{exhibit.received_profile?.full_name || 'System User'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Force Number:</span>
                <span>{exhibit.received_profile?.badge_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Department:</span>
                <span>{exhibit.received_profile?.department || 'Cyber Crimes Unit'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Case Description */}
        {exhibit.cases?.description && (
          <div className="mb-8">
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">CASE DESCRIPTION</h4>
            <p className="text-sm leading-relaxed">{exhibit.cases.description}</p>
          </div>
        )}

        {/* Exhibit Description */}
        {exhibit.description && (
          <div className="mb-8">
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">EXHIBIT DESCRIPTION</h4>
            <p className="text-sm leading-relaxed">{exhibit.description}</p>
          </div>
        )}

        {/* Chain of Custody - Comprehensive Timeline */}
        <div className="mb-8">
          <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">COMPLETE CHAIN OF CUSTODY</h4>
          {chainOfCustodyEvents.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm"><strong>Total Custody Events:</strong> {chainOfCustodyEvents.length}</p>
                  <p className="text-sm"><strong>First Event:</strong> {formatDate(chainOfCustodyEvents[0]?.timestamp || exhibit.received_date)}</p>
                </div>
                <div>
                  <p className="text-sm"><strong>Latest Event:</strong> {formatDate(chainOfCustodyEvents[chainOfCustodyEvents.length - 1]?.timestamp || exhibit.received_date)}</p>
                  <p className="text-sm"><strong>Days in Custody:</strong> {Math.floor((new Date().getTime() - new Date(exhibit.received_date).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                </div>
              </div>

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
                          {event.previous_status && event.new_status && (
                            <p className="text-gray-600 mt-1">
                              Status: {event.previous_status.replace('_', ' ')} → {event.new_status.replace('_', ' ')}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-gray-600 mt-1 italic">Note: {event.notes}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No custody events recorded. Initial receipt pending.</p>
          )}
        </div>

        {/* Legal Declaration */}
        <div className="mb-8 p-4 border border-gray-400 bg-gray-50">
          <h4 className="font-bold text-lg mb-3">LEGAL DECLARATION</h4>
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

        {/* Signatures Section */}
        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <div className="border-b border-black mb-2 h-16"></div>
            <p className="text-sm text-center">
              <strong>Receiving Officer Signature</strong><br />
              Name: {exhibit.received_profile?.full_name || 'System User'}<br />
              Badge: {exhibit.received_profile?.badge_number || 'N/A'}<br />
              Date: {formatDate(exhibit.received_date)}
            </p>
          </div>
          <div>
            <div className="border-b border-black mb-2 h-16"></div>
            <p className="text-sm text-center">
              <strong>Supervisor Signature</strong><br />
              Name: ________________________<br />
              Badge: _______________________<br />
              Date: ________________________
            </p>
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