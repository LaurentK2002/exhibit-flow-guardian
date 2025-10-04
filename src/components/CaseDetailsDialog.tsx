import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Users,
  Package,
  Activity,
  Download,
  Eye,
} from "lucide-react";
import { CaseStatusBadge, CaseStatus } from "./CaseStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { formatExhibitNumber } from "@/lib/exhibitNumber";

interface CaseDetailsDialogProps {
  caseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CaseDetails {
  id: string;
  case_number: string;
  lab_number: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  opened_date: string;
  closed_date: string | null;
  incident_date: string | null;
  location: string | null;
  victim_name: string | null;
  suspect_name: string | null;
  case_notes: string | null;
  assigned_to: string | null;
  supervisor_id: string | null;
  analyst_id: string | null;
  exhibit_officer_id: string | null;
  investigator?: { full_name: string; badge_number: string | null } | null;
  supervisor?: { full_name: string; badge_number: string | null } | null;
  analyst?: { full_name: string; badge_number: string | null } | null;
  exhibit_officer?: { full_name: string; badge_number: string | null } | null;
  exhibits?: Array<{
    id: string;
    exhibit_number: string;
    device_name: string;
    exhibit_type: string;
    status: string;
    received_date: string;
  }>;
  activities?: Array<{
    id: string;
    activity_type: string;
    description: string;
    created_at: string;
    user?: { full_name: string } | null;
  }>;
  documents?: Array<{
    id: string;
    file_path: string;
    created_at: string;
  }>;
}

export const CaseDetailsDialog = ({ caseId, open, onOpenChange }: CaseDetailsDialogProps) => {
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (caseId && open) {
      fetchCaseDetails();
    }
  }, [caseId, open]);

  const fetchCaseDetails = async () => {
    if (!caseId) return;

    setLoading(true);
    try {
      // Fetch case data
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;

      // Fetch all related profiles
      const profileIds = [
        caseData.assigned_to,
        caseData.supervisor_id,
        caseData.analyst_id,
        caseData.exhibit_officer_id,
      ].filter(Boolean);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, badge_number")
        .in("id", profileIds);

      const getProfile = (id: string | null) =>
        profiles?.find((p) => p.id === id) || null;

      // Fetch exhibits
      const { data: exhibits, error: exhibitsError } = await supabase
        .from("exhibits")
        .select("id, exhibit_number, device_name, exhibit_type, status, received_date")
        .eq("case_id", caseId)
        .order("received_date", { ascending: false });

      if (exhibitsError) throw exhibitsError;

      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from("case_activities")
        .select(`
          id,
          activity_type,
          description,
          created_at,
          user_id
        `)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Fetch user profiles for activities
      const userIds = activities?.map(a => a.user_id).filter(Boolean) || [];
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const activitiesWithUsers = activities?.map(activity => ({
        ...activity,
        user: userProfiles?.find(u => u.id === activity.user_id) || null,
      }));

      // Fetch documents from storage if any
      const { data: caseDocuments } = await supabase.storage
        .from("case-documents")
        .list(caseId);

      // Recursively fetch reference letters under nested folders
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
          // Folders in Supabase Storage have null id; files have an id
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

      // Extract the lab sequence (e.g., "0003" from "FB/CYBER/2025/LAB/0003")
      const labSeq = caseData.lab_number?.split('/').pop() || caseData.case_number?.split('/').pop();
      
      // Filter files that start with the lab sequence number in the filename
      const matchedRefFiles = allRefFiles.filter((f) => {
        const fileName = f.name;
        return labSeq && fileName.startsWith(labSeq + '-');
      });

      const refFilesToShow = matchedRefFiles;

      const allDocuments = [
        ...(caseDocuments?.map((doc) => ({
          id: doc.id,
          file_path: `${caseId}/${doc.name}`,
          created_at: doc.created_at,
        })) || []),
        ...refFilesToShow.map((doc) => ({
          id: doc.id,
          file_path: doc.path,
          created_at: doc.created_at || new Date().toISOString(),
        })),
      ];

      setCaseDetails({
        ...caseData,
        investigator: getProfile(caseData.assigned_to),
        supervisor: getProfile(caseData.supervisor_id),
        analyst: getProfile(caseData.analyst_id),
        exhibit_officer: getProfile(caseData.exhibit_officer_id),
        exhibits: exhibits || [],
        activities: activitiesWithUsers || [],
        documents: allDocuments,
      });
    } catch (error) {
      console.error("Error fetching case details:", error);
      toast({
        title: "Error",
        description: "Failed to load case details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to preview document",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getExhibitStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_analysis: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      analyzed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      returned: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };

    return (
      <Badge className={colors[status] || colors.received}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading case details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!caseDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <FileText className="h-6 w-6" />
            {caseDetails.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold">{caseDetails.case_number}</span>
            {caseDetails.lab_number && (
              <>
                <span>•</span>
                <span className="font-mono">{caseDetails.lab_number}</span>
              </>
            )}
            <span>•</span>
            <CaseStatusBadge status={(caseDetails.status as CaseStatus) || "open"} />
            <Badge variant={getPriorityColor(caseDetails.priority)}>
              {caseDetails.priority.toUpperCase()} PRIORITY
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exhibits">Exhibits ({caseDetails.exhibits?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({caseDetails.documents?.length || 0})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Case Number</p>
                    <p className="font-mono font-medium">{caseDetails.case_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lab Number</p>
                    <p className="font-mono font-medium">{caseDetails.lab_number || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <CaseStatusBadge status={(caseDetails.status as CaseStatus) || "open"} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <div className="mt-1">
                      <Badge variant={getPriorityColor(caseDetails.priority)}>
                        {caseDetails.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {caseDetails.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{caseDetails.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Opened Date</p>
                  <p className="text-sm font-medium">
                    {format(new Date(caseDetails.opened_date), "PPP")}
                  </p>
                </div>
                {caseDetails.incident_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Incident Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(caseDetails.incident_date), "PPP")}
                    </p>
                  </div>
                )}
                {caseDetails.closed_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Closed Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(caseDetails.closed_date), "PPP")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Involved Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {caseDetails.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{caseDetails.location}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {caseDetails.victim_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Victim</p>
                      <p className="text-sm font-medium">{caseDetails.victim_name}</p>
                    </div>
                  )}
                  {caseDetails.suspect_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Suspect</p>
                      <p className="text-sm font-medium">{caseDetails.suspect_name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assigned Personnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Personnel
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {caseDetails.investigator && (
                  <div>
                    <p className="text-sm text-muted-foreground">Investigator</p>
                    <p className="text-sm font-medium">{caseDetails.investigator.full_name}</p>
                    {caseDetails.investigator.badge_number && (
                      <p className="text-xs text-muted-foreground">
                        Badge: {caseDetails.investigator.badge_number}
                      </p>
                    )}
                  </div>
                )}
                {caseDetails.analyst && (
                  <div>
                    <p className="text-sm text-muted-foreground">Forensic Analyst</p>
                    <p className="text-sm font-medium">{caseDetails.analyst.full_name}</p>
                    {caseDetails.analyst.badge_number && (
                      <p className="text-xs text-muted-foreground">
                        Badge: {caseDetails.analyst.badge_number}
                      </p>
                    )}
                  </div>
                )}
                {caseDetails.exhibit_officer && (
                  <div>
                    <p className="text-sm text-muted-foreground">Exhibit Officer</p>
                    <p className="text-sm font-medium">{caseDetails.exhibit_officer.full_name}</p>
                    {caseDetails.exhibit_officer.badge_number && (
                      <p className="text-xs text-muted-foreground">
                        Badge: {caseDetails.exhibit_officer.badge_number}
                      </p>
                    )}
                  </div>
                )}
                {caseDetails.supervisor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Supervisor</p>
                    <p className="text-sm font-medium">{caseDetails.supervisor.full_name}</p>
                    {caseDetails.supervisor.badge_number && (
                      <p className="text-xs text-muted-foreground">
                        Badge: {caseDetails.supervisor.badge_number}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Notes */}
            {caseDetails.case_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Case Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{caseDetails.case_notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exhibits" className="space-y-4">
            {caseDetails.exhibits && caseDetails.exhibits.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Exhibits ({caseDetails.exhibits.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseDetails.exhibits.map((exhibit) => (
                      <div
                        key={exhibit.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold">{formatExhibitNumber(caseDetails.lab_number || caseDetails.case_number, caseDetails.exhibits.findIndex(e => e.id === exhibit.id), caseDetails.exhibits?.length || 1)}</span>
                              {getExhibitStatusBadge(exhibit.status)}
                            </div>
                            <p className="text-sm font-medium">{exhibit.device_name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Type: {exhibit.exhibit_type.replace("_", " ").toUpperCase()}</span>
                              <span>
                                Received: {format(new Date(exhibit.received_date), "PPP")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No exhibits found for this case
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {caseDetails.documents && caseDetails.documents.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reference Letters & Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseDetails.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {doc.file_path.includes('reference-letters') 
                              ? '📄 Reference Letter from Station' 
                              : doc.file_path.split('/').pop()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded: {format(new Date(doc.created_at), "PPP")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => previewDocument(doc.file_path)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadDocument(doc.file_path)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No documents found for this case
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {caseDetails.activities && caseDetails.activities.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {caseDetails.activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <div className="w-px flex-1 bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{activity.user?.full_name || "System"}</span>
                            <span>•</span>
                            <span>{format(new Date(activity.created_at), "PPp")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No activity recorded for this case
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
