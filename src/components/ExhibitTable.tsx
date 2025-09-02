import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Plus, FolderPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { Database } from "@/integrations/supabase/types";
import { AddExhibitDialog } from "./AddExhibitDialog";

type Exhibit = Database['public']['Tables']['exhibits']['Row'] & {
  cases?: {
    case_number: string;
    priority: Database['public']['Enums']['case_priority'];
  } | null;
  profiles?: {
    full_name: string;
  } | null;
};

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

export const ExhibitTable = () => {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExhibit, setShowAddExhibit] = useState(false);

  const fetchExhibits = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibits')
        .select(`
          *,
          cases (
            case_number,
            priority
          ),
          profiles:assigned_analyst (
            full_name
          )
        `)
        .limit(10)
        .order('received_date', { ascending: false });

      if (error) throw error;
      setExhibits((data as unknown) as Exhibit[] || []);
    } catch (error) {
      console.error('Error fetching exhibits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibits();
  }, []);

  // Set up real-time updates for exhibits
  useRealtime('exhibits', fetchExhibits);

  const handleExhibitAdded = () => {
    fetchExhibits();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Digital Exhibits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading exhibits...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Digital Exhibits</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddExhibit(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exhibit
              </Button>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Exhibit #</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Case #</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Device</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Analyst</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exhibits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No exhibits found. <br />
                      <span className="text-sm">Add some exhibits to get started.</span>
                    </td>
                  </tr>
                ) : (
                  exhibits.map((exhibit) => (
                    <tr key={exhibit.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <span className="font-mono text-sm font-medium text-foreground">{exhibit.exhibit_number}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-foreground">{exhibit.cases?.case_number || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {exhibitTypeMap[exhibit.exhibit_type]} - {exhibit.device_name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {exhibit.serial_number || 'No S/N'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-foreground">
                          {exhibit.profiles?.full_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={exhibit.status} />
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={
                            exhibit.cases?.priority === "critical" ? "destructive" : 
                            exhibit.cases?.priority === "high" ? "destructive" :
                            exhibit.cases?.priority === "medium" ? "default" : 
                            "secondary"
                          }
                          className="text-xs"
                        >
                          {exhibit.cases?.priority ? priorityMap[exhibit.cases.priority] : 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download Report">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddExhibitDialog 
        open={showAddExhibit}
        onOpenChange={setShowAddExhibit}
        onSuccess={handleExhibitAdded}
      />
    </>
  );
};