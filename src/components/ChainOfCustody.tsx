import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Download, Eye, Clock } from "lucide-react";
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
  };
}

export const ChainOfCustody = () => {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
            case_number
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

  const filteredExhibits = exhibits.filter(exhibit =>
    exhibit.exhibit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibit.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibit.cases?.case_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_analysis': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'returned': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCustodyEvents = (custodyChain: any[]) => {
    if (!Array.isArray(custodyChain) || custodyChain.length === 0) {
      return 1; // At least received event
    }
    return custodyChain.length;
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

      <Card>
        <CardHeader>
          <CardTitle>Exhibit Custody Records</CardTitle>
          <CardDescription>Complete custody chain tracking for all exhibits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exhibit Number</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Custody Events</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExhibits.map((exhibit) => (
                  <TableRow key={exhibit.id}>
                    <TableCell className="font-medium">{exhibit.exhibit_number}</TableCell>
                    <TableCell>{exhibit.device_name}</TableCell>
                    <TableCell>{exhibit.cases?.case_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(exhibit.status)}>
                        {exhibit.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(exhibit.received_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {getCustodyEvents(exhibit.chain_of_custody)} events
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};