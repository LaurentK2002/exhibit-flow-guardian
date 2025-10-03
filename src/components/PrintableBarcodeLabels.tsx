import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import JsBarcode from "jsbarcode";

interface Exhibit {
  id: string;
  exhibit_number: string;
  device_name: string;
  exhibit_type: string;
  cases: {
    lab_number: string;
    case_number: string;
  };
}

interface PrintableBarcodeLabelsProps {
  exhibits: Exhibit[];
  onClose: () => void;
}

export function PrintableBarcodeLabels({ exhibits, onClose }: PrintableBarcodeLabelsProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate barcodes after component mounts
    exhibits.forEach((exhibit) => {
      try {
        const canvas = document.getElementById(`barcode-${exhibit.id}`);
        if (canvas) {
          JsBarcode(canvas, exhibit.exhibit_number, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
        }
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    });
  }, [exhibits]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Print controls - hidden when printing */}
      <div className="no-print sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground">Barcode Labels</h2>
          <p className="text-sm text-muted-foreground">
            {exhibits.length} label{exhibits.length > 1 ? 's' : ''} ready to print
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} size="lg">
            <Printer className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
          <Button onClick={onClose} variant="outline" size="lg">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="p-8">
        <div className="grid grid-cols-2 gap-4">
          {exhibits.map((exhibit) => (
            <div 
              key={exhibit.id} 
              className="border-2 border-dashed border-border rounded-lg p-4 bg-white text-black print:break-inside-avoid"
              style={{ pageBreakInside: 'avoid' }}
            >
              <div className="text-center space-y-2">
                <div className="font-bold text-lg">
                  {exhibit.cases.lab_number}
                </div>
                <div className="text-sm text-gray-600">
                  Case: {exhibit.cases.case_number}
                </div>
                <div className="py-2">
                  <svg id={`barcode-${exhibit.id}`} className="mx-auto"></svg>
                </div>
                <div className="text-sm font-semibold border-t pt-2">
                  {exhibit.device_name}
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  {exhibit.exhibit_type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          @page {
            size: A4;
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
