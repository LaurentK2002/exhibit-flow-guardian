import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Circle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { AddExhibitDialog } from "./AddExhibitDialog";

type Case = Database['public']['Tables']['cases']['Row'] & {
  profiles?: {
    full_name: string;
    role: string;
  } | null;
  supervisor?: {
    full_name: string;
  } | null;
  _count?: {
    exhibits: number;
    activities: number;
  };
};

export const CaseManagement = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOpenCaseDialog, setShowOpenCaseDialog] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          profiles:assigned_to(full_name, role),
          supervisor:supervisor_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCases((data || []) as any);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Real-time updates
  useRealtime('cases', fetchCases);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'under_investigation': return 'bg-yellow-500';
      case 'pending_review': return 'bg-purple-500';
      case 'closed': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'open': return 10;
      case 'under_investigation': return 50;
      case 'pending_review': return 80;
      case 'closed': return 100;
      case 'archived': return 100;
      default: return 0;
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseItem.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseItem.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });


  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">Loading cases...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Case Management</h2>
          <p className="text-muted-foreground">Manage and track investigation cases</p>
        </div>
        <Button onClick={() => setShowOpenCaseDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Open Case File
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCases.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No cases found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "Create your first case to get started"}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setShowOpenCaseDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Case
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-mono text-muted-foreground">{caseItem.case_number}</p>
                    <h3 className="font-semibold text-foreground mt-1">{caseItem.title}</h3>
                  </div>
                  <Badge variant={getPriorityColor(caseItem.priority || 'medium')}>
                    {caseItem.priority?.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {caseItem.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{getProgressValue(caseItem.status || 'open')}%</span>
                  </div>
                  <Progress value={getProgressValue(caseItem.status || 'open')} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-muted-foreground">
                      <FileText className="h-4 w-4 mr-1" />
                      {caseItem._count?.exhibits || 0}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {caseItem._count?.activities || 0}
                    </div>
                  </div>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status || 'open')} text-white`}>
                    <Circle className="h-2 w-2 mr-1" />
                    {caseItem.status?.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-1" />
                    {caseItem.profiles?.full_name || 'Unassigned'}
                  </div>
                  
                  {caseItem.incident_date && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(caseItem.incident_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {caseItem.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {caseItem.location}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddExhibitDialog 
        open={showOpenCaseDialog}
        onOpenChange={setShowOpenCaseDialog}
        onSuccess={fetchCases}
      />
    </div>
  );
};