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
import { FileText, Download, CheckCircle, XCircle, AlertCircle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportSubmission {
  id: string;
  report_title: string;
  file_name: string;
  file_path: string;
  submission_date: string;
  status: string;
  review_comments: string | null;
  analyst: {
    full_name: string;
    badge_number: string | null;
  } | null;
  case: {
    id: string;
    case_number: string;
    lab_number: string | null;
    title: string;
  } | null;
}

export const ReportReviewPanel = () => {
  const [submissions, setSubmissions] = useState<ReportSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | "revision_requested" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("report_submissions")
        .select(`
          *,
          analyst:analyst_id(full_name, badge_number),
          case:case_id(id, case_number, lab_number, title)
        `)
        .order("submission_date", { ascending: false });

      if (error) throw error;
      setSubmissions((data as any) || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load report submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useRealtime("report_submissions", fetchSubmissions);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock, label: "Pending Review" },
      approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle, label: "Rejected" },
      revision_requested: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertCircle, label: "Revision Requested" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const downloadReport = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("analysis-reports")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const openReviewDialog = (report: ReportSubmission, action: "approved" | "rejected" | "revision_requested") => {
    setSelectedReport(report);
    setReviewAction(action);
    setReviewComments("");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedReport || !reviewAction || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("report_submissions")
        .update({
          status: reviewAction,
          reviewed_by: user.id,
          review_date: new Date().toISOString(),
          review_comments: reviewComments || null,
        })
        .eq("id", selectedReport.id);

      if (error) throw error;

      // Log activity
      if (selectedReport.case?.id) {
        await supabase.from("case_activities").insert({
          case_id: selectedReport.case.id,
          user_id: user.id,
          activity_type: "report_reviewed",
          description: `Analysis report "${selectedReport.report_title}" ${reviewAction.replace("_", " ")}`,
        });
      }

      toast({
        title: "Success",
        description: `Report ${reviewAction.replace("_", " ")} successfully`,
      });

      setReviewDialogOpen(false);
      setSelectedReport(null);
      fetchSubmissions();
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

  const pendingCount = submissions.filter(s => s.status === "pending").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading report submissions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Report Review & Approval</h2>
            <p className="text-muted-foreground">
              Review analysis reports submitted by analysts
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {pendingCount} Pending Review
            </Badge>
          )}
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No report submissions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {submission.report_title}
                      </CardTitle>
                      <CardDescription>
                        {submission.case && (
                          <>
                            Case: {submission.case.lab_number || submission.case.case_number} - {submission.case.title}
                          </>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Analyst</p>
                      <p className="font-medium">
                        {submission.analyst?.full_name}
                        {submission.analyst?.badge_number && ` (${submission.analyst.badge_number})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">File Name</p>
                      <p className="font-medium">{submission.file_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted On</p>
                      <p className="font-medium">
                        {format(new Date(submission.submission_date), "PPp")}
                      </p>
                    </div>
                  </div>

                  {submission.review_comments && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Review Comments:</p>
                      <p className="text-sm text-muted-foreground">
                        {submission.review_comments}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(submission.file_path, submission.file_name)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>

                    {submission.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600"
                          onClick={() => openReviewDialog(submission, "revision_requested")}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Request Revision
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => openReviewDialog(submission, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openReviewDialog(submission, "approved")}
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

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" && "Approve Report"}
              {reviewAction === "rejected" && "Reject Report"}
              {reviewAction === "revision_requested" && "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && `${selectedReport.report_title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">
                {reviewAction === "approved" ? "Comments (Optional)" : "Comments *"}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  reviewAction === "approved"
                    ? "Add any additional comments..."
                    : "Provide feedback for the analyst..."
                }
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                required={reviewAction !== "approved"}
              />
            </div>

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
                disabled={submitting || (reviewAction !== "approved" && !reviewComments.trim())}
                className={
                  reviewAction === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : reviewAction === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
