import { forwardRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

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
                <span className="font-semibold w-32">Case Number:</span>
                <span className="font-mono">{exhibit.cases?.case_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Case Title:</span>
                <span>{exhibit.cases?.title || 'N/A'}</span>
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
                <span className="font-semibold w-32">Badge Number:</span>
                <span>{exhibit.received_profile?.badge_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Department:</span>
                <span>{exhibit.received_profile?.department || 'Cyber Crimes Unit'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {exhibit.description && (
          <div className="mb-8">
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">DESCRIPTION</h4>
            <p className="text-sm leading-relaxed">{exhibit.description}</p>
          </div>
        )}

        {/* Chain of Custody Summary */}
        {chainOfCustodyEvents.length > 0 && (
          <div className="mb-8">
            <h4 className="font-bold text-lg mb-4 border-b border-gray-300 pb-2">CHAIN OF CUSTODY EVENTS</h4>
            <div className="text-sm">
              <p><strong>Total Events:</strong> {chainOfCustodyEvents.length}</p>
              <p><strong>Latest Event:</strong> {formatDate(chainOfCustodyEvents[chainOfCustodyEvents.length - 1]?.timestamp || exhibit.received_date)}</p>
            </div>
          </div>
        )}

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