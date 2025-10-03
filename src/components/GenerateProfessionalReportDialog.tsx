import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2 } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";

interface GenerateProfessionalReportDialogProps {
  children?: React.ReactNode;
}

type ReportPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly";

export const GenerateProfessionalReportDialog = ({ children }: GenerateProfessionalReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [customTitle, setCustomTitle] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    const endDate = endOfDay(now);
    let startDate: Date;

    switch (period) {
      case "daily":
        startDate = startOfDay(subDays(now, 1));
        break;
      case "weekly":
        startDate = startOfDay(subWeeks(now, 1));
        break;
      case "monthly":
        startDate = startOfDay(subMonths(now, 1));
        break;
      case "quarterly":
        startDate = startOfDay(subMonths(now, 3));
        break;
      case "half-yearly":
        startDate = startOfDay(subMonths(now, 6));
        break;
      case "yearly":
        startDate = startOfDay(subMonths(now, 12));
        break;
      default:
        startDate = startOfDay(subMonths(now, 1));
    }

    return { startDate, endDate };
  };

  const generateStatistics = (cases: any[], exhibits: any[]) => {
    const casesByStatus = cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casesByPriority = cases.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const exhibitsByType = exhibits.reduce((acc, e) => {
      acc[e.exhibit_type] = (acc[e.exhibit_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const exhibitsByStatus = exhibits.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCases: cases.length,
      totalExhibits: exhibits.length,
      casesByStatus,
      casesByPriority,
      exhibitsByType,
      exhibitsByStatus,
      avgExhibitsPerCase: cases.length > 0 ? (exhibits.length / cases.length).toFixed(2) : "0",
    };
  };

  const formatReportContent = (
    period: ReportPeriod,
    dateRange: { startDate: Date; endDate: Date },
    cases: any[],
    exhibits: any[],
    stats: any
  ) => {
    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1).replace("-", " ");
    
    let content = `# ${periodLabel} Evidence Management Report\n\n`;
    content += `**Report Period:** ${format(dateRange.startDate, "PPP")} to ${format(dateRange.endDate, "PPP")}\n`;
    content += `**Generated:** ${format(new Date(), "PPP 'at' p")}\n\n`;
    content += `---\n\n`;

    // Executive Summary
    content += `## Executive Summary\n\n`;
    content += `This ${period} report provides a comprehensive overview of all cases received and processed during the reporting period. `;
    content += `The report includes detailed statistics, case summaries, exhibit tracking, and operational insights.\n\n`;

    // Key Metrics
    content += `## Key Performance Metrics\n\n`;
    content += `- **Total Cases Received:** ${stats.totalCases}\n`;
    content += `- **Total Exhibits Processed:** ${stats.totalExhibits}\n`;
    content += `- **Average Exhibits per Case:** ${stats.avgExhibitsPerCase}\n\n`;

    // Case Statistics
    content += `## Case Statistics\n\n`;
    content += `### Cases by Status\n`;
    Object.entries(stats.casesByStatus).forEach(([status, count]) => {
      content += `- **${status.toUpperCase()}:** ${count} cases\n`;
    });
    content += `\n### Cases by Priority\n`;
    Object.entries(stats.casesByPriority).forEach(([priority, count]) => {
      content += `- **${priority.toUpperCase()}:** ${count} cases\n`;
    });

    // Exhibit Statistics
    content += `\n## Exhibit Statistics\n\n`;
    content += `### Exhibits by Type\n`;
    Object.entries(stats.exhibitsByType).forEach(([type, count]) => {
      content += `- **${type.replace("_", " ").toUpperCase()}:** ${count} exhibits\n`;
    });
    content += `\n### Exhibits by Status\n`;
    Object.entries(stats.exhibitsByStatus).forEach(([status, count]) => {
      content += `- **${status.toUpperCase()}:** ${count} exhibits\n`;
    });

    // Detailed Case Information
    content += `\n## Detailed Case Information\n\n`;
    if (cases.length === 0) {
      content += `No cases were received during this reporting period.\n\n`;
    } else {
      cases.forEach((caseItem, index) => {
        content += `### ${index + 1}. ${caseItem.case_number} - ${caseItem.title}\n\n`;
        content += `- **Lab Number:** ${caseItem.lab_number || "Not assigned"}\n`;
        content += `- **Status:** ${caseItem.status}\n`;
        content += `- **Priority:** ${caseItem.priority}\n`;
        content += `- **Opened:** ${format(new Date(caseItem.opened_date), "PPP")}\n`;
        if (caseItem.incident_date) {
          content += `- **Incident Date:** ${format(new Date(caseItem.incident_date), "PPP")}\n`;
        }
        if (caseItem.location) {
          content += `- **Location:** ${caseItem.location}\n`;
        }
        if (caseItem.victim_name) {
          content += `- **Victim:** ${caseItem.victim_name}\n`;
        }
        if (caseItem.suspect_name) {
          content += `- **Suspect:** ${caseItem.suspect_name}\n`;
        }
        content += `- **Description:** ${caseItem.description || "N/A"}\n`;
        
        // Associated exhibits
        const caseExhibits = exhibits.filter(e => e.case_id === caseItem.id);
        if (caseExhibits.length > 0) {
          content += `- **Exhibits:** ${caseExhibits.length} exhibit(s)\n`;
          caseExhibits.forEach(exhibit => {
            content += `  - ${exhibit.exhibit_number}: ${exhibit.device_name} (${exhibit.exhibit_type})\n`;
          });
        }
        content += `\n`;
      });
    }

    // Operational Insights
    content += `## Operational Insights\n\n`;
    const openCases = stats.casesByStatus.open || 0;
    const closedCases = stats.casesByStatus.closed || 0;
    const pendingExhibits = stats.exhibitsByStatus.received || 0;
    const analyzedExhibits = stats.exhibitsByStatus.analyzed || 0;

    content += `### Workflow Analysis\n`;
    content += `- **Case Closure Rate:** ${stats.totalCases > 0 ? ((closedCases / stats.totalCases) * 100).toFixed(1) : 0}%\n`;
    content += `- **Exhibit Processing Rate:** ${stats.totalExhibits > 0 ? ((analyzedExhibits / stats.totalExhibits) * 100).toFixed(1) : 0}%\n`;
    content += `- **Open Cases Requiring Attention:** ${openCases}\n`;
    content += `- **Pending Exhibits:** ${pendingExhibits}\n\n`;

    content += `### Recommendations\n`;
    if (openCases > closedCases) {
      content += `- Increase focus on closing open cases to improve case closure rate\n`;
    }
    if (pendingExhibits > analyzedExhibits) {
      content += `- Prioritize pending exhibit analysis to maintain evidence processing efficiency\n`;
    }
    if (stats.totalCases > 0) {
      content += `- Continue monitoring case intake and resource allocation\n`;
    }
    content += `- Maintain chain of custody documentation for all exhibits\n`;
    content += `- Regular training on digital forensics best practices recommended\n\n`;

    content += `---\n\n`;
    content += `*This report was automatically generated by the Digital Forensics Evidence Management System.*\n`;

    return content;
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate reports",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(period);

      // Fetch cases within date range
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .gte("opened_date", startDate.toISOString())
        .lte("opened_date", endDate.toISOString())
        .order("opened_date", { ascending: false });

      if (casesError) throw casesError;

      // Fetch exhibits for these cases
      const caseIds = cases?.map(c => c.id) || [];
      const { data: exhibits, error: exhibitsError } = await supabase
        .from("exhibits")
        .select("*")
        .in("case_id", caseIds);

      if (exhibitsError) throw exhibitsError;

      // Generate statistics
      const stats = generateStatistics(cases || [], exhibits || []);

      // Format report content
      const content = formatReportContent(period, { startDate, endDate }, cases || [], exhibits || [], stats);

      // Save report to database
      const title = customTitle || `${period.charAt(0).toUpperCase() + period.slice(1).replace("-", " ")} Report - ${format(startDate, "MMM yyyy")}`;
      
      const { error: insertError } = await supabase
        .from("reports")
        .insert({
          title,
          report_type: `${period}_evidence_report`,
          content,
          generated_by: user.id,
          is_final: true,
        });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from("case_activities").insert({
        case_id: null,
        user_id: user.id,
        activity_type: "report_generated",
        description: `Generated ${period} professional report: ${title}`,
      });

      toast({
        title: "Report Generated",
        description: `${period.charAt(0).toUpperCase() + period.slice(1)} report created successfully`,
      });

      setOpen(false);
      setPeriod("monthly");
      setCustomTitle("");
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Professional Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Professional Report</DialogTitle>
          <DialogDescription>
            Create a comprehensive report with detailed statistics and case information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="period">Report Period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="quarterly">Quarterly Report (3 Months)</SelectItem>
                <SelectItem value="half-yearly">Half-Yearly Report (6 Months)</SelectItem>
                <SelectItem value="yearly">Yearly Report (12 Months)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Custom Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Leave blank for auto-generated title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
