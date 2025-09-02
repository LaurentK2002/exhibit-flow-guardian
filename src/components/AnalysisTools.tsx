import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Laptop, HardDrive, Wifi, Camera, Database } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  status: 'available' | 'in_use' | 'maintenance';
}

const analysisTools: Tool[] = [
  {
    id: '1',
    name: 'Mobile Device Extractor',
    description: 'Extract data from smartphones and tablets',
    category: 'Mobile Forensics',
    icon: Smartphone,
    status: 'available'
  },
  {
    id: '2',
    name: 'Computer Imaging Suite',
    description: 'Create forensic images of computer systems',
    category: 'Computer Forensics',
    icon: Laptop,
    status: 'available'
  },
  {
    id: '3',
    name: 'Hard Drive Analyzer',
    description: 'Deep analysis of storage devices',
    category: 'Storage Analysis',
    icon: HardDrive,
    status: 'in_use'
  },
  {
    id: '4',
    name: 'Network Traffic Analyzer',
    description: 'Monitor and analyze network communications',
    category: 'Network Forensics',
    icon: Wifi,
    status: 'available'
  },
  {
    id: '5',
    name: 'Digital Media Recovery',
    description: 'Recover deleted photos, videos, and documents',
    category: 'Media Recovery',
    icon: Camera,
    status: 'available'
  },
  {
    id: '6',
    name: 'Database Forensics Tool',
    description: 'Analyze database structures and recover data',
    category: 'Database Analysis',
    icon: Database,
    status: 'maintenance'
  }
];

export const AnalysisTools = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_use': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'maintenance': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'in_use': return 'In Use';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Forensic Analysis Tools</CardTitle>
          <CardDescription>Professional tools for digital investigation and evidence analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysisTools.filter(t => t.status === 'available').length}
              </div>
              <div className="text-sm text-muted-foreground">Available Tools</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analysisTools.filter(t => t.status === 'in_use').length}
              </div>
              <div className="text-sm text-muted-foreground">Currently in Use</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analysisTools.filter(t => t.status === 'maintenance').length}
              </div>
              <div className="text-sm text-muted-foreground">Under Maintenance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card key={tool.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{tool.category}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(tool.status)}>
                    {getStatusText(tool.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1" 
                    disabled={tool.status !== 'available'}
                  >
                    {tool.status === 'available' ? 'Launch Tool' : 'Unavailable'}
                  </Button>
                  <Button size="sm" variant="outline">
                    Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Usage Guidelines</CardTitle>
          <CardDescription>Important guidelines for using forensic analysis tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Chain of Custody</h4>
              <p className="text-sm text-muted-foreground">
                Always maintain proper chain of custody documentation when using analysis tools. 
                Log all tool usage and document findings thoroughly.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Data Integrity</h4>
              <p className="text-sm text-muted-foreground">
                Create forensic images before analysis. Never work on original evidence. 
                Verify hash values before and after analysis.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Tool Validation</h4>
              <p className="text-sm text-muted-foreground">
                Ensure all tools are properly validated and tested before use in actual cases. 
                Document tool versions and configurations used.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Report Generation</h4>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive reports for all analysis performed. 
                Include methodology, findings, and conclusions in your reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};