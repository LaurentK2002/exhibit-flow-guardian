import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, ExhibitStatus } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";

interface Exhibit {
  id: string;
  caseNumber: string;
  deviceType: string;
  serialNumber: string;
  receivedDate: string;
  assignedTo: string;
  status: ExhibitStatus;
  priority: "High" | "Medium" | "Low";
}

const sampleExhibits: Exhibit[] = [
  {
    id: "EXH-001",
    caseNumber: "CR-2024-0089",
    deviceType: "iPhone 14 Pro",
    serialNumber: "F2LX9K7H8P",
    receivedDate: "2024-01-15",
    assignedTo: "Det. Johnson",
    status: "analysis",
    priority: "High"
  },
  {
    id: "EXH-002", 
    caseNumber: "CR-2024-0087",
    deviceType: "MacBook Air",
    serialNumber: "C02Z1234567",
    receivedDate: "2024-01-14",
    assignedTo: "Tech. Smith",
    status: "complete",
    priority: "Medium"
  },
  {
    id: "EXH-003",
    caseNumber: "CR-2024-0091",
    deviceType: "Samsung Galaxy S23",
    serialNumber: "RF8N123456",
    receivedDate: "2024-01-16",
    assignedTo: "Det. Williams",
    status: "received",
    priority: "Low"
  },
  {
    id: "EXH-004",
    caseNumber: "CR-2024-0088",
    deviceType: "External HDD 2TB",
    serialNumber: "WX12345678",
    receivedDate: "2024-01-13",
    assignedTo: "Tech. Davis",
    status: "urgent",
    priority: "High"
  }
];

export const ExhibitTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Digital Exhibits</span>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Exhibit ID</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Case Number</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Device</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Assigned To</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleExhibits.map((exhibit) => (
                <tr key={exhibit.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-2">
                    <span className="font-mono text-sm font-medium text-foreground">{exhibit.id}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-foreground">{exhibit.caseNumber}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">{exhibit.deviceType}</div>
                      <div className="text-xs text-muted-foreground font-mono">{exhibit.serialNumber}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-foreground">{exhibit.assignedTo}</span>
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={exhibit.status} />
                  </td>
                  <td className="py-3 px-2">
                    <Badge 
                      variant={exhibit.priority === "High" ? "destructive" : exhibit.priority === "Medium" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {exhibit.priority}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};