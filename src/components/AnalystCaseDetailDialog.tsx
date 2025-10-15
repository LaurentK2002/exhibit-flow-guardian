import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText, Clock, User, MapPin, AlertCircle, Package, Download, Eye } from "lucide-react";

interface AnalystCaseDetailDialogProps {
  caseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

interface CaseDetails {
  id: string;
  case_number: string;
  lab_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  analyst_status: string;
  location: string;
  victim_name: string;
  suspect_name: string;
  case_notes: string;
  opened_date: string;
  incident_date: string;
  assigned_to_profile?: { full_name: string; badge_number: string };
  analyst_profile?: { full_name: string; badge_number: string };
  exhibits: Array<{
    id: string;
    exhibit_number: string;
    device_name: string;
    exhibit_type: string;
    status: string;
  }>;
  referenceLetters?: Array<{
    id: string;
    name: string;
    path: string;
    created_at: string | null;
  }>;
}

export const AnalystCaseDetailDialog = ({ 
  caseId, 
  open, 
  onOpenChange,
  onStatusUpdate 
}: AnalystCaseDetailDialogProps) => {
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [analystStatus, setAnalystStatus] = useState<string>('pending');
  const [analysisNotes, setAnalysisNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && caseId) {
      fetchCaseDetails();
    }
  }, [open, caseId]);

  const fetchCaseDetails = async () => {
    if (!caseId) return;
    
    setLoading(true);
    try {
      // 1) Fetch the base case row
      const { data: caseRow, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .maybeSingle();

      if (caseError) throw caseError;
      if (!caseRow) {
        toast.error('Case not found');
        setCaseDetails(null);
        return;
      }

      // 2) Fetch exhibits for the case
      const { data: exhibits, error: exhibitsError } = await supabase
        .from('exhibits')
        .select('id, exhibit_number, device_name, exhibit_type, status')
        .eq('case_id', caseId);

      if (exhibitsError) throw exhibitsError;

      // 2b) Fetch reference letters from storage
      const listAll = async (
        prefix: string
      ): Promise<{ id: string; name: string; created_at: string | null; path: string }[]> => {
        const results: { id: string; name: string; created_at: string | null; path: string }[] = [];
        const { data: items, error: listError } = await supabase.storage
          .from("case-documents")
          .list(prefix);
        if (listError) {
          console.error("Error listing storage items:", listError);
          return results;
        }
        for (const item of items || []) {
          const currentPath = prefix ? `${prefix}/${item.name}` : item.name;
          if (!item.id) {
            const children = await listAll(currentPath);
            results.push(...children);
          } else {
            results.push({
              id: item.id,
              name: item.name,
              created_at: item.created_at || null,
              path: currentPath,
            });
          }
        }
        return results;
      };

      const allRefFiles = await listAll("reference-letters");
      const labSeq = caseRow.lab_number?.split('/').pop() || caseRow.case_number?.split('/').pop();
      const matchedRefFiles = allRefFiles.filter((f) => {
        const fileName = f.name;
        return labSeq && fileName.startsWith(labSeq + '-');
      });

      const mostRecentRef = matchedRefFiles.length > 0 
        ? matchedRefFiles.reduce((latest, current) => {
            const latestDate = new Date(latest.created_at || 0);
            const currentDate = new Date(current.created_at || 0);
            return currentDate > latestDate ? current : latest;
          })
        : null;

      const refFilesToShow = mostRecentRef ? [mostRecentRef] : [];

      // 3) Fetch assigned and analyst profiles if present
      let assignedProfile: any = null;
      let analystProfile: any = null;
      const profileIds: string[] = [];
      if (caseRow.assigned_to) profileIds.push(caseRow.assigned_to);
      if (caseRow.analyst_id) profileIds.push(caseRow.analyst_id);

      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, badge_number')
          .in('id', profileIds);

        if (profilesError) throw profilesError;

        assignedProfile = profilesData?.find((p: any) => p.id === caseRow.assigned_to) || null;
        analystProfile = profilesData?.find((p: any) => p.id === caseRow.analyst_id) || null;
      }

      const details: CaseDetails = {
        id: caseRow.id,
        case_number: caseRow.case_number,
        lab_number: caseRow.lab_number,
        title: caseRow.title,
        description: caseRow.description,
        status: caseRow.status,
        priority: caseRow.priority,
        analyst_status: caseRow.analyst_status,
        location: caseRow.location,
        victim_name: caseRow.victim_name,
        suspect_name: caseRow.suspect_name,
        case_notes: caseRow.case_notes,
        opened_date: caseRow.opened_date,
        incident_date: caseRow.incident_date,
        assigned_to_profile: assignedProfile ? { full_name: assignedProfile.full_name, badge_number: assignedProfile.badge_number } : undefined,
        analyst_profile: analystProfile ? { full_name: analystProfile.full_name, badge_number: analystProfile.badge_number } : undefined,
        exhibits: exhibits || [],
        referenceLetters: refFilesToShow
      };

      setCaseDetails(details);
      setAnalystStatus(caseRow.analyst_status || 'pending');
      setAnalysisNotes(caseRow.case_notes || '');
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast.error('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!caseId) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('cases')
        .update({ 
          analyst_status: analystStatus,
          case_notes: analysisNotes
        })
        .eq('id', caseId);

      if (error) throw error;

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: caseId,
        user_id: user?.id,
        activity_type: 'status_change',
        description: `Analyst status updated to: ${analystStatus}`,
        metadata: { analyst_status: analystStatus }
      });

      toast.success('Case status updated successfully');
      onStatusUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Failed to update case status');
    } finally {
      setUpdating(false);
    }
  };

  const downloadDocument = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("case-documents")
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.split('/').pop() || fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const previewDocument = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("case-documents")
        .createSignedUrl(fileName, 60);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error previewing document:", error);
      toast.error("Failed to preview document");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getAnalystStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'in_analysis':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Analysis</Badge>;
      case 'complete':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Complete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Case Analysis - {caseDetails?.case_number}</DialogTitle>
          <DialogDescription>
            Review case details and update analysis status
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading case details...</div>
        ) : caseDetails ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="reference">
                Reference Letter
                {caseDetails.referenceLetters && caseDetails.referenceLetters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{caseDetails.referenceLetters.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="exhibits">Exhibits</TabsTrigger>
              <TabsTrigger value="analysis">Analysis Status</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{caseDetails.title}</CardTitle>
                      <CardDescription>{caseDetails.case_number} • {caseDetails.lab_number}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(caseDetails.priority)}>
                        {caseDetails.priority} priority
                      </Badge>
                      {getAnalystStatusBadge(caseDetails.analyst_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{caseDetails.description || 'No description provided'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Opened</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(caseDetails.opened_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{caseDetails.location || 'Not specified'}</p>
                      </div>
                    </div>

                    {caseDetails.assigned_to_profile && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Investigator</p>
                          <p className="text-sm text-muted-foreground">
                            {caseDetails.assigned_to_profile.full_name} ({caseDetails.assigned_to_profile.badge_number})
                          </p>
                        </div>
                      </div>
                    )}

                    {caseDetails.analyst_profile && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Assigned Analyst</p>
                          <p className="text-sm text-muted-foreground">
                            {caseDetails.analyst_profile.full_name} ({caseDetails.analyst_profile.badge_number})
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {caseDetails.case_notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Case Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{caseDetails.case_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reference" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reference Letter from Station
                  </CardTitle>
                  <CardDescription>
                    Instructions from the station regarding what needs to be analyzed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {caseDetails.referenceLetters && caseDetails.referenceLetters.length > 0 ? (
                    <div className="space-y-3">
                      {caseDetails.referenceLetters.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              {doc.created_at && (
                                <p className="text-sm text-muted-foreground">
                                  Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => previewDocument(doc.path)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadDocument(doc.path)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> This reference letter contains instructions from the station specifying what needs to be analyzed in the exhibits for this case. Please review it carefully before beginning your analysis.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-2">No reference letter found for this case</p>
                      <p className="text-sm text-muted-foreground">
                        The reference letter should be uploaded by the exhibit officer or case coordinator.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exhibits" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Evidence Items ({caseDetails.exhibits?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {caseDetails.exhibits && caseDetails.exhibits.length > 0 ? (
                    <div className="space-y-3">
                      {caseDetails.exhibits.map((exhibit) => (
                        <div key={exhibit.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{exhibit.exhibit_number}</p>
                            <p className="text-sm text-muted-foreground">{exhibit.device_name} - {exhibit.exhibit_type}</p>
                          </div>
                          <Badge variant="outline">{exhibit.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No exhibits found for this case</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Update Analysis Status</CardTitle>
                  <CardDescription>Change the status of your analysis work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="analyst-status">Analyst Status</Label>
                    <Select value={analystStatus} onValueChange={setAnalystStatus}>
                      <SelectTrigger id="analyst-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending - Not started</SelectItem>
                        <SelectItem value="in_analysis">In Analysis - Work in progress</SelectItem>
                        <SelectItem value="complete">Complete - Analysis finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="analysis-notes">Analysis Notes</Label>
                    <Textarea
                      id="analysis-notes"
                      placeholder="Add notes about your analysis..."
                      value={analysisNotes}
                      onChange={(e) => setAnalysisNotes(e.target.value)}
                      rows={6}
                    />
                  </div>

                  {caseDetails.priority === 'high' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        This is a high priority case requiring immediate attention
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? 'Updating...' : 'Update Status'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Failed to load case details</div>
        )}
      </DialogContent>
    </Dialog>
  );
};