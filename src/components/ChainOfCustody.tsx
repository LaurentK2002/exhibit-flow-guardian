import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface Exhibit {
  id: string;
  exhibit_number: string;
  device_name: string;
  status: string;
  received_date: string;
  chain_of_custody: any;
  case_id: string;
  cases?: {
    case_number: string;
    lab_number: string;
  };
  received_profile?: {
    full_name: string;
    badge_number: string;
  };
}

export const ChainOfCustody = () => {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExhibits();
  }, []);

  const fetchExhibits = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibits')
        .select(`
          *,
          cases (
            case_number,
            lab_number
          )
        `)
        .order('received_date', { ascending: false });

      if (error) throw error;
      setExhibits(data || []);
    } catch (error) {
      console.error('Error fetching exhibits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chain of Custody</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading exhibits...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chain of Custody Management
          </CardTitle>
          <CardDescription>Track and manage digital evidence custody chain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{exhibits.length}</div>
              <div className="text-sm text-muted-foreground">Total Exhibits</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {exhibits.filter(e => e.status === 'received').length}
              </div>
              <div className="text-sm text-muted-foreground">Recently Received</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {exhibits.filter(e => e.status === 'in_analysis').length}
              </div>
              <div className="text-sm text-muted-foreground">In Analysis</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {exhibits.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Analysis Complete</div>
            </div>
          </div>

          <div className="flex gap-4 items-center mb-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exhibits, case numbers..."
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};