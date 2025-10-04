import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/hooks/useRealtime";
import { UploadAnalysisReportDialog } from "./UploadAnalysisReportDialog";
import { format } from "date-fns";
import { FileText, Download, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportSubmission {
  id: string;
  report_title: string;
  file_name: string;
  file_path: string;
  submission_date: string;
  status: string;
  review_comments: string | null;
  review_date: string | null;
  case: {
    case_number: string;
    lab_number: string | null;
    title: string;
  } | null;
  reviewer: {
    full_name: string;
  } | null;
}

export const AnalystReportSubmissions = () => {
  const [submissions, setSubmissions] = useState<ReportSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("report_submissions")
        .select(`
          *,
          cases!report_submissions_case_id_fkey(case_number, lab_number, title)
        `)
        .eq("analyst_id", user.id)
        .order("submission_date", { ascending: false });

      if (error) throw error;

      // Fetch reviewer details separately if needed
      if (data && data.length > 0) {
        const reviewerIds = data.filter((s: any) => s.reviewed_by).map((s: any) => s.reviewed_by);
        
        if (reviewerIds.length > 0) {
          const { data: reviewers } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", reviewerIds);

          const reviewerMap = new Map(reviewers?.map(r => [r.id, r]) || []);
          
          const enrichedData = data.map((submission: any) => ({
            ...submission,
            reviewer: submission.reviewed_by ? reviewerMap.get(submission.reviewed_by) : null,
            case: submission.cases
          }));

          setSubmissions(enrichedData as any);
        } else {
          setSubmissions(data.map((s: any) => ({ ...s, case: s.cases })) as any);
        }
      } else {
        setSubmissions([]);
      }
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
  }, [user]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading submissions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analysis Report Submissions</h2>
          <p className="text-muted-foreground">
            Upload reports drafted outside the system for OCU review
          </p>
        </div>
        <UploadAnalysisReportDialog onSuccess={fetchSubmissions} />
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No report submissions yet</p>
            <UploadAnalysisReportDialog onSuccess={fetchSubmissions}>
              <Button>Upload Your First Report</Button>
            </UploadAnalysisReportDialog>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                  {submission.reviewer && (
                    <div>
                      <p className="text-muted-foreground">Reviewed By</p>
                      <p className="font-medium">{submission.reviewer.full_name}</p>
                    </div>
                  )}
                  {submission.review_date && (
                    <div>
                      <p className="text-muted-foreground">Review Date</p>
                      <p className="font-medium">
                        {format(new Date(submission.review_date), "PPp")}
                      </p>
                    </div>
                  )}
                </div>

                {submission.review_comments && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Review Comments:</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.review_comments}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(submission.file_path, submission.file_name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
