import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Filter,
  Search,
  ChevronRight,
  Stamp,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportDetailPanel } from "./ReportDetailPanel";

interface ProfessionalReport {
  id: string;
  title: string;
  report_type: string;
  content: string;
  created_at: string;
  is_final: boolean;
  generated_by: string;
  reviewed_by: string | null;
  generator?: {
    full_name: string;
    badge_number: string | null;
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

export const EnhancedProfessionalReportReview = () => {
  const [reports, setReports] = useState<ProfessionalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ProfessionalReport | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { user, profile } = useAuth();
  const { role } = usePermissions();
  const { toast } = useToast();

  const canReview = role === "officer_commanding_unit" || role === "commanding_officer" || 
                    role === "chief_of_cyber" || role === "administrator" || role === "supervisor";

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
        generator: r.generated_by ? profilesMap.get(r.generated_by) : null,
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

  const openReportDetail = async (report: ProfessionalReport) => {
    setSelectedReport(report);
    setComments([]);
    setDetailSheetOpen(true);
  };

  const openReviewDialog = (action: "approve" | "reject") => {
    setReviewAction(action);
    setReviewComments("");
    setReviewDialogOpen(true);
  };

  const handleAddComment = async (content: string) => {
    if (!selectedReport || !user || !profile) return;

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
    await supabase.from("case_activities").insert({
      case_id: null,
      user_id: user.id,
      activity_type: "report_comment",
      description: `Comment added on professional report "${selectedReport.title}": ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`,
    });

    toast({
      title: "Comment Added",
      description: "Your comment has been added to the report",
    });
  };

  const handleSubmitReview = async () => {
    if (!selectedReport || !reviewAction || !user || !profile) return;

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

      // Add review action as a comment
      const reviewComment: Comment = {
        id: `review-${Date.now()}`,
        user_id: user.id,
        user_name: profile.full_name,
        user_role: role || "user",
        content: reviewComments || `Report ${reviewAction}d`,
        created_at: new Date().toISOString(),
        type: reviewAction === "approve" ? "approval" : "rejection",
      };
      setComments(prev => [...prev, reviewComment]);

      // Log activity
      await supabase.from("case_activities").insert({
        case_id: null,
        user_id: user.id,
        activity_type: reviewAction === "approve" ? "report_approved" : "report_rejected",
        description: `Professional report "${selectedReport.title}" ${reviewAction}d by ${profile.full_name}`,
      });

      toast({
        title: "Review Submitted",
        description: `Report has been ${reviewAction}d successfully`,
      });

      setReviewDialogOpen(false);
      setSelectedReport({ ...selectedReport, is_final: reviewAction === "approve" });
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
        Pending
      </Badge>
    );
  };

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      weekly_departmental: "Weekly Departmental",
      monthly_performance: "Monthly Performance",
      case_summary: "Case Summary",
      exhibit_status: "Exhibit Status",
      team_productivity: "Team Productivity",
      operational_update: "Operational Update",
      incident_report: "Incident Report",
      resource_request: "Resource Request",
    };
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDialogContent = () => {
    if (reviewAction === "approve") {
      return {
        title: "Approve Report",
        description: "This will mark the report as final and approved. The report will be ready for the Commanding Officer.",
        icon: <CheckCircle className="h-12 w-12 text-green-600" />,
        buttonClass: "bg-green-600 hover:bg-green-700",
        buttonText: "Approve Report",
      };
    }
    return {
      title: "Reject Report",
      description: "Please provide a reason for rejection. The report will need to be regenerated or revised.",
      icon: <XCircle className="h-12 w-12 text-red-600" />,
      buttonClass: "bg-red-600 hover:bg-red-700",
      buttonText: "Reject Report",
    };
  };

  // Filter reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = searchQuery === "" || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.generator?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "pending" && !r.is_final) ||
      (statusFilter === "approved" && r.is_final);
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = reports.filter(r => !r.is_final).length;
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
              <FileCheck className="h-6 w-6" />
              Professional Report Review
            </h2>
            <p className="text-muted-foreground">
              Review and approve official departmental reports
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
                  placeholder="Search reports by title or author..."
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
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report List */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">No reports found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Professional reports will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openReportDetail(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{report.title}</h3>
                          {getStatusBadge(report.is_final)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2 text-xs">
                            {getReportTypeLabel(report.report_type)}
                          </Badge>
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>By: {report.generator?.full_name || "Unknown"}</span>
                          <span>•</span>
                          <span>{format(new Date(report.created_at), "MMM d, yyyy")}</span>
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
            <SheetTitle>Professional Report Review</SheetTitle>
            <SheetDescription>
              Review details, add comments, and take action on this report
            </SheetDescription>
          </SheetHeader>
          
          {selectedReport && (
            <ReportDetailPanel
              report={{
                id: selectedReport.id,
                title: selectedReport.title,
                report_type: selectedReport.report_type,
                content: selectedReport.content,
                created_at: selectedReport.created_at,
                status: selectedReport.is_final ? "approved" : "pending",
                is_final: selectedReport.is_final,
                generator_name: selectedReport.generator?.full_name,
                generator_badge: selectedReport.generator?.badge_number || undefined,
              }}
              comments={comments}
              onAddComment={handleAddComment}
              onApprove={() => openReviewDialog("approve")}
              onReject={() => openReviewDialog("reject")}
              onRequestRevision={() => openReviewDialog("reject")}
              canReview={canReview && !selectedReport.is_final}
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
                {reviewAction === "approve" ? "Comments (Optional)" : "Reason for Rejection (Required)"}
              </Label>
              <Textarea
                id="review-comments"
                placeholder={
                  reviewAction === "approve"
                    ? "Add any notes or commendations..."
                    : "Explain why this report is being rejected..."
                }
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {selectedReport && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{selectedReport.title}</p>
                <p className="text-muted-foreground">
                  {getReportTypeLabel(selectedReport.report_type)} by {selectedReport.generator?.full_name}
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
              disabled={submitting || (reviewAction !== "approve" && !reviewComments.trim())}
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
