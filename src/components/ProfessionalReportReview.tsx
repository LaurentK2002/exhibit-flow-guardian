import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/hooks/useRealtime";
import { format } from "date-fns";
import { FileText, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalReport {
  id: string;
  title: string;
  report_type: string;
  content: string;
  created_at: string;
  is_final: boolean;
  generated_by: string;
  reviewed_by: string | null;
  profiles?: {
    full_name: string;
    badge_number: string | null;
  };
}

export const ProfessionalReportReview = () => {
  const [reports, setReports] = useState<ProfessionalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ProfessionalReport | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reportsData = (data as any) || [];
      const generatorIds = [...new Set(reportsData.map((r: any) => r.generated_by).filter(Boolean))];

      let profilesMap = new Map<string, any>();
      if (generatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, badge_number")
          .in("id", generatorIds as string[]);
        profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      }

      const enriched = reportsData.map((r: any) => ({
        ...r,
        profiles: r.generated_by ? profilesMap.get(r.generated_by) : null,
      }));

      setReports(enriched as any);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load professional reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useRealtime("reports", fetchReports);

  const getStatusBadge = (isFinal: boolean) => {
    if (isFinal) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending Review
      </Badge>
    );
  };

  const openReviewDialog = (report: ProfessionalReport, action: "approve" | "reject") => {
    setSelectedReport(report);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedReport || !reviewAction || !user) return;

    setSubmitting(true);
    try {
      const updates: any = {
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (reviewAction === "approve") {
        updates.is_final = true;
      }

      const { error } = await supabase
        .from("reports")
        .update(updates)
        .eq("id", selectedReport.id);

      if (error) throw error;

      // Log activity
      await supabase.from("case_activities").insert({
        case_id: null,
        user_id: user.id,
        activity_type: reviewAction === "approve" ? "report_approved" : "report_rejected",
        description: `Professional report "${selectedReport.title}" ${reviewAction}d by OCU`,
      });

      toast({
        title: "Success",
        description: `Report ${reviewAction}d successfully`,
      });

      setReviewDialogOpen(false);
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = reports.filter(r => !r.is_final).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading professional reports...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Professional Report Review</h2>
            <p className="text-muted-foreground">
              Review professional reports submitted by exhibit officers
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {pendingCount} Pending Review
            </Badge>
          )}
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No professional reports yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {report.title}
                      </CardTitle>
                      <CardDescription>
                        {report.report_type.replace(/_/g, " ").toUpperCase()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(report.is_final)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Generated By</p>
                      <p className="font-medium">
                        {report.profiles?.full_name}
                        {report.profiles?.badge_number && ` (${report.profiles.badge_number})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created On</p>
                      <p className="font-medium">
                        {format(new Date(report.created_at), "PPp")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Report
                    </Button>

                    {!report.is_final && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => openReviewDialog(report, "reject")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openReviewDialog(report, "approve")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Generated on {selectedReport && format(new Date(selectedReport.created_at), "PPP")}
            </DialogDescription>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {selectedReport?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Report" : "Reject Report"}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && `${selectedReport.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reviewAction === "approve"
                ? "This will mark the report as final and approved."
                : "This will reject the report and it will need to be regenerated."}
            </p>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={submitting}
                className={
                  reviewAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {submitting ? "Submitting..." : reviewAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
