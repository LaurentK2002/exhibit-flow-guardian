import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2 } from "lucide-react";

interface UploadAnalysisReportDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export const UploadAnalysisReportDialog = ({ children, onSuccess }: UploadAnalysisReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [selectedCase, setSelectedCase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchAssignedCases();
    }
  }, [open, user]);

  const fetchAssignedCases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("cases")
        .select("id, case_number, lab_number, title")
        .eq("analyst_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type (PDF, DOCX, DOC)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 20MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload reports",
        variant: "destructive",
      });
      return;
    }

    if (!reportTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a report title",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCase) {
      toast({
        title: "Error",
        description: "Please select a case",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${reportTitle.replace(/\s+/g, '_')}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("analysis-reports")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create report submission record
      const { error: insertError } = await supabase
        .from("report_submissions")
        .insert({
          case_id: selectedCase,
          analyst_id: user.id,
          report_title: reportTitle,
          file_path: filePath,
          file_name: file.name,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from("case_activities").insert({
        case_id: selectedCase,
        user_id: user.id,
        activity_type: "report_submitted",
        description: `Analysis report "${reportTitle}" submitted for review`,
      });

      toast({
        title: "Success",
        description: "Report submitted successfully and sent to OCU for review",
      });

      setOpen(false);
      setReportTitle("");
      setSelectedCase("");
      setFile(null);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error uploading report:", error);
      toast({
        title: "Error",
        description: "Failed to upload report",
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
            <Upload className="mr-2 h-4 w-4" />
            Upload Analysis Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Analysis Report</DialogTitle>
          <DialogDescription>
            Submit your analysis report for OCU review and approval
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case">Select Case *</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase} required>
              <SelectTrigger id="case">
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.lab_number || c.case_number} - {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              placeholder="Enter report title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Report File (PDF or Word) *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
