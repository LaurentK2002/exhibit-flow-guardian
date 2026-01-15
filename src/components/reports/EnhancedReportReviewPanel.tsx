import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtime } from "@/hooks/useRealtime";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Eye,
  Filter,
  Search,
  ChevronRight,
  MessageSquare,
  Send,
  Stamp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportDetailPanel } from "./ReportDetailPanel";

interface ReportSubmission {
  id: string;
  report_title: string;
  file_name: string;
  file_path: string;
  submission_date: string;
  status: string;
  review_comments: string | null;
  analyst_id: string;
  case_id: string | null;
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

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
  type: "comment" | "approval" | "rejection" | "revision_request";
}

export const EnhancedReportReviewPanel = () => {
  const [submissions, setSubmissions] = useState<ReportSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportSubmission | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | "revision_requested" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { user, profile } = useAuth();
  const { role } = usePermissions();
  const { toast } = useToast();

  const canReview = role === "officer_commanding_unit" || role === "commanding_officer" || 
                    role === "chief_of_cyber" || role === "administrator" || role === "supervisor";

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("report_submissions")
        .select("*")
        .order("submission_date", { ascending: false });

      if (error) throw error;

      const submissionsData = (data as any) || [];

      // Fetch related cases
      const caseIds = [...new Set(submissionsData.map((s: any) => s.case_id).filter(Boolean))];
      let casesMap = new Map<string, any>();
      if (caseIds.length > 0) {
        const { data: casesData } = await supabase
          .from("cases")
          .select("id, case_number, lab_number, title")
          .in("id", caseIds as string[]);
        casesMap = new Map((casesData || []).map((c: any) => [c.id, c]));
      }

      // Fetch analyst profiles
      const analystIds = [...new Set(submissionsData.map((s: any) => s.analyst_id).filter(Boolean))];
      let analystMap = new Map<string, any>();
      if (analystIds.length > 0) {
        const { data: analysts } = await supabase
          .from("profiles")
          .select("id, full_name, badge_number")
          .in("id", analystIds as string[]);
        analystMap = new Map((analysts || []).map((a: any) => [a.id, a]));
      }
      
      const enrichedData = submissionsData.map((submission: any) => ({
        ...submission,
        analyst: submission.analyst_id ? analystMap.get(submission.analyst_id) : null,
        case: submission.case_id ? casesMap.get(submission.case_id) : null,
      }));

      setSubmissions(enrichedData as any);
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

  const fetchCommentsForReport = async (reportId: string) => {
    try {
      // Fetch activities related to this report
      const { data: activities } = await supabase
        .from("case_activities")
        .select("*")
        .ilike("description", `%${reportId}%`)
        .order("created_at", { ascending: true });

      // For now, create mock comments from existing review data
      // In production, you'd have a dedicated comments table
      const mockComments: Comment[] = [];
      
      const report = submissions.find(s => s.id === reportId);
      if (report?.review_comments) {
        mockComments.push({
          id: `review-${reportId}`,
          user_id: "system",
          user_name: "Reviewer",
          user_role: "officer_commanding_unit",
          content: report.review_comments,
          created_at: new Date().toISOString(),
          type: report.status as any,
        });
      }

      setComments(mockComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useRealtime("report_submissions", fetchSubmissions);

  const openReportDetail = async (report: ReportSubmission) => {
    setSelectedReport(report);
    await fetchCommentsForReport(report.id);
    setDetailSheetOpen(true);
  };

  const openReviewDialog = (action: "approved" | "rejected" | "revision_requested") => {
    setReviewAction(action);
    setReviewComments("");
    setReviewDialogOpen(true);
  };

  const handleAddComment = async (content: string) => {
    if (!selectedReport || !user || !profile) return;

    // In a full implementation, you'd save to a comments table
    // For now, we'll add to local state
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      user_id: user.id,
      user_name: profile.full_name,
      user_role: role || "user",
      content,
      created_at: new Date().toISOString(),
      type: "comment",
    };

    setComments(prev => [...prev, newComment]);

    // Log activity
    if (selectedReport.case_id) {
      await supabase.from("case_activities").insert({
        case_id: selectedReport.case_id,
        user_id: user.id,
        activity_type: "report_comment",
        description: `Comment added on report "${selectedReport.report_title}": ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`,
      });
    }

    toast({
      title: "Comment Added",
      description: "Your comment has been added to the report",
    });
  };

  const handleSubmitReview = async () => {
    if (!selectedReport || !reviewAction || !user || !profile) return;

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

      // Update case status when report is approved
      if (reviewAction === "approved" && selectedReport.case_id) {
        await supabase
          .from("cases")
          .update({ status: "analysis_complete" })
          .eq("id", selectedReport.case_id);
      }

      // Add review action as a comment
      const reviewComment: Comment = {
        id: `review-${Date.now()}`,
        user_id: user.id,
        user_name: profile.full_name,
        user_role: role || "user",
        content: reviewComments || `Report ${reviewAction.replace("_", " ")}`,
        created_at: new Date().toISOString(),
        type: reviewAction as any,
      };
      setComments(prev => [...prev, reviewComment]);

      // Log activity
      if (selectedReport.case_id) {
        await supabase.from("case_activities").insert({
          case_id: selectedReport.case_id,
          user_id: user.id,
          activity_type: "report_reviewed",
          description: `Analysis report "${selectedReport.report_title}" ${reviewAction.replace("_", " ")} by ${profile.full_name}`,
        });
      }

      toast({
        title: "Review Submitted",
        description: `Report has been ${reviewAction.replace("_", " ")} successfully`,
      });

      setReviewDialogOpen(false);
      setSelectedReport({ ...selectedReport, status: reviewAction, review_comments: reviewComments });
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock, label: "Pending" },
      approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle, label: "Rejected" },
      revision_requested: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertCircle, label: "Revision" },
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

  const getDialogContent = () => {
    switch (reviewAction) {
      case "approved":
        return {
          title: "Approve Report",
          description: "Confirm approval of this analysis report. The case status will be updated to 'Analysis Complete'.",
          icon: <CheckCircle className="h-12 w-12 text-green-600" />,
          buttonClass: "bg-green-600 hover:bg-green-700",
          buttonText: "Approve Report",
        };
      case "rejected":
        return {
          title: "Reject Report",
          description: "Please provide a reason for rejection. The analyst will be notified and can resubmit.",
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          buttonClass: "bg-red-600 hover:bg-red-700",
          buttonText: "Reject Report",
        };
      case "revision_requested":
        return {
          title: "Request Revision",
          description: "Specify the changes required. The analyst will receive your feedback.",
          icon: <AlertCircle className="h-12 w-12 text-orange-600" />,
          buttonClass: "bg-orange-600 hover:bg-orange-700",
          buttonText: "Request Revision",
        };
      default:
        return { title: "", description: "", icon: null, buttonClass: "", buttonText: "" };
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = searchQuery === "" || 
      s.report_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.case?.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.analyst?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = submissions.filter(s => s.status === "pending").length;
  const dialogContent = getDialogContent();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Stamp className="h-6 w-6" />
              Report Review & Approval
            </h2>
            <p className="text-muted-foreground">
              Review, comment, and approve analysis reports from your team
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
              {pendingCount} Awaiting Review
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports by title, case number, or analyst..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revision_requested">Revision Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report List */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">No reports found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Reports submitted by analysts will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <Card 
                key={submission.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openReportDetail(submission)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{submission.report_title}</h3>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {submission.case 
                            ? `${submission.case.lab_number || submission.case.case_number} • ${submission.case.title}`
                            : "No case linked"}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>By: {submission.analyst?.full_name || "Unknown"}</span>
                          <span>•</span>
                          <span>{format(new Date(submission.submission_date), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Report Review</SheetTitle>
            <SheetDescription>
              Review details, add comments, and take action on this report
            </SheetDescription>
          </SheetHeader>
          
          {selectedReport && (
            <ReportDetailPanel
              report={{
                id: selectedReport.id,
                title: selectedReport.report_title,
                report_type: "analysis_report",
                file_name: selectedReport.file_name,
                file_path: selectedReport.file_path,
                created_at: selectedReport.submission_date,
                status: selectedReport.status,
                case_number: selectedReport.case?.case_number,
                case_title: selectedReport.case?.title,
                lab_number: selectedReport.case?.lab_number || undefined,
                analyst_name: selectedReport.analyst?.full_name,
                analyst_badge: selectedReport.analyst?.badge_number || undefined,
                review_comments: selectedReport.review_comments || undefined,
              }}
              comments={comments}
              onAddComment={handleAddComment}
              onApprove={() => openReviewDialog("approved")}
              onReject={() => openReviewDialog("rejected")}
              onRequestRevision={() => openReviewDialog("revision_requested")}
              onDownload={() => downloadReport(selectedReport.file_path, selectedReport.file_name)}
              canReview={canReview}
              isLoading={submitting}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              {dialogContent.icon}
            </div>
            <DialogTitle className="text-xl">{dialogContent.title}</DialogTitle>
            <DialogDescription>
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-comments">
                {reviewAction === "approved" ? "Comments (Optional)" : "Comments (Required)"}
              </Label>
              <Textarea
                id="review-comments"
                placeholder={
                  reviewAction === "approved"
                    ? "Add any commendation or notes for the analyst..."
                    : "Provide detailed feedback for the analyst..."
                }
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {selectedReport && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{selectedReport.report_title}</p>
                <p className="text-muted-foreground">
                  Submitted by {selectedReport.analyst?.full_name}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
              className={dialogContent.buttonClass}
            >
              {submitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                dialogContent.buttonText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
