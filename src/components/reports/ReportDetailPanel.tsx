import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  User,
  Calendar,
  Briefcase,
  FileCheck,
  Printer,
  Share2
} from "lucide-react";
import { ReportReviewComments } from "./ReportReviewComments";

interface ReportDetails {
  id: string;
  title: string;
  report_type: string;
  content?: string;
  file_name?: string;
  file_path?: string;
  created_at: string;
  status: string;
  is_final?: boolean;
  case_number?: string;
  case_title?: string;
  lab_number?: string;
  analyst_name?: string;
  analyst_badge?: string;
  generator_name?: string;
  generator_badge?: string;
  review_comments?: string;
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

interface ReportDetailPanelProps {
  report: ReportDetails;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onApprove: () => void;
  onReject: () => void;
  onRequestRevision: () => void;
  onDownload?: () => void;
  canReview: boolean;
  isLoading?: boolean;
}

export const ReportDetailPanel = ({
  report,
  comments,
  onAddComment,
  onApprove,
  onReject,
  onRequestRevision,
  onDownload,
  canReview,
  isLoading = false
}: ReportDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("details");

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock, label: "Pending Review" },
      approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle, label: "Rejected" },
      revision_requested: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertCircle, label: "Revision Requested" },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(report.is_final ? "approved" : report.status);
  const StatusIcon = statusConfig.icon;

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      weekly_departmental: "Weekly Departmental Report",
      monthly_performance: "Monthly Performance Report",
      case_summary: "Case Summary Report",
      exhibit_status: "Exhibit Status Report",
      team_productivity: "Team Productivity Report",
      operational_update: "Operational Update",
      incident_report: "Incident Report",
      resource_request: "Resource Request",
      analysis_report: "Analysis Report",
      forensic_report: "Forensic Report",
    };
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">{report.title}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{getReportTypeLabel(report.report_type)}</Badge>
                {report.case_number && (
                  <span className="text-sm">
                    • Case: {report.lab_number || report.case_number}
                  </span>
                )}
              </CardDescription>
            </div>
            <Badge className={`${statusConfig.color} px-3 py-1.5`}>
              <StatusIcon className="h-4 w-4 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {(report.analyst_name || report.generator_name) && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Submitted By</p>
                  <p className="font-medium">{report.analyst_name || report.generator_name}</p>
                  {(report.analyst_badge || report.generator_badge) && (
                    <p className="text-xs text-muted-foreground">
                      Badge: {report.analyst_badge || report.generator_badge}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Submitted On</p>
                <p className="font-medium">{format(new Date(report.created_at), "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(report.created_at), "h:mm a")}
                </p>
              </div>
            </div>

            {report.case_title && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Related Case</p>
                  <p className="font-medium truncate max-w-[150px]" title={report.case_title}>
                    {report.case_title}
                  </p>
                </div>
              </div>
            )}

            {report.file_name && (
              <div className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Attachment</p>
                  <p className="font-medium truncate max-w-[150px]" title={report.file_name}>
                    {report.file_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {onDownload && report.file_path && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
              <Button variant="outline" size="sm" disabled>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {canReview && report.status === "pending" && !report.is_final && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={onRequestRevision}
                  disabled={isLoading}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onReject}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={onApprove}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Report
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Report Content</TabsTrigger>
          <TabsTrigger value="comments">
            Review Activity
            {comments.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {comments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Report Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {report.content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                      {report.content}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Report content is available in the attached file</p>
                    {onDownload && report.file_path && (
                      <Button variant="link" onClick={onDownload} className="mt-2">
                        Download to view
                      </Button>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {report.review_comments && (
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertCircle className="h-5 w-5" />
                  Previous Review Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.review_comments}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments">
          <ReportReviewComments
            comments={comments}
            onAddComment={onAddComment}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
